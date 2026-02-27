import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { PluginManager, CombatTickEvent, XpGainEvent, GoldGainEvent } from './plugin-manager.service';
import { MonsterRepository, MonsterData } from './monster.repository';
import { LootService } from './loot.service';
import { PrismaService } from '../prisma/prisma.service';

// ============================================================
// Types de la session joueur
// ============================================================

export interface PlayerSession {
    /** ID du joueur en BDD */
    playerId: string;
    username: string;
    socketId: string;

    // --- Stats du joueur ---
    level: number;
    xp: number;
    xpToNext: number;
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    critChance: number;
    dodge: number;
    haste: number;
    gold: number;
    crystals: number;
    role: string;
    language: string;

    // --- Bonus d'équipement ---
    equipmentBonus: {
        attack: number;
        defense: number;
        hp: number;
        critChance: number;
        dodge: number;
        haste: number;
    };

    // --- État de combat ---
    currentTier: number;
    currentMonster: MonsterData | null;
    isInCombat: boolean;
    autoAttackEnabled: boolean;

    // --- État du Donjon ---
    activeDungeonId: string | null;
    dungeonMonstersKilled: number; // Compteur pour les 10 minions avant le boss

    // --- Statistiques de session ---
    totalDamageDealt: number;
    totalMonstersKilled: number;
    totalClicks: number;
    sessionStartedAt: number;

    // --- Timer de la boucle ---
    loopInterval: ReturnType<typeof setInterval> | null;
}

// ============================================================
// Constantes du moteur
// ============================================================

const TICK_RATE_MS = 1000;              // 1 tick par seconde
const BASE_PLAYER_HP = 100;
const BASE_PLAYER_ATTACK = 15;
const BASE_PLAYER_DEFENSE = 5;
const HP_PER_LEVEL = 20;
const ATTACK_PER_LEVEL = 3;
const DEFENSE_PER_LEVEL = 1;
const CLICK_DAMAGE_MULTIPLIER = 0.5;    // Clic = 50% de l'attaque de base
const XP_FOR_LEVEL = (level: number) => Math.floor(100 * Math.pow(1.15, level - 1));

/**
 * GameLoopService — La boucle de jeu par joueur.
 *
 * Chaque joueur connecté a sa propre Game Loop qui tourne à 1 tick/sec.
 * Le serveur calcule TOUT : dégâts, morts, XP, level-ups, loot.
 * Le client ne fait qu'afficher et envoyer des intentions (clic).
 *
 * Architecture :
 * 1. tick() → calcule les dégâts auto-attaque
 * 2. Si le monstre meurt → émet 'monster:death', génère loot, spawn suivant
 * 3. Si le joueur meurt → respawn, perte de Tier
 * 4. Les gains d'XP passent par le PluginManager (les plugins peuvent modifier le multiplicateur)
 */
@Injectable()
export class GameLoopService implements OnModuleDestroy {
    private readonly logger = new Logger(GameLoopService.name);
    private readonly sessions = new Map<string, PlayerSession>();

    constructor(
        private readonly pluginManager: PluginManager,
        private readonly monsterRepo: MonsterRepository,
        private readonly lootService: LootService,
        private readonly prisma: PrismaService, // Nécessaire pour charger les donjons
    ) {
        this.logger.log('⚔️ GameLoopService initialized');
    }

    onModuleDestroy() {
        // Arrêter toutes les boucles à la destruction du module
        for (const session of this.sessions.values()) {
            this.stopLoop(session);
        }
        this.logger.log('⚔️ All game loops stopped');
    }

    // ============================================================
    // Gestion des sessions
    // ============================================================

    /**
     * Crée une nouvelle session de jeu pour un joueur connecté.
     */
    startSession(playerId: string, username: string, socketId: string, playerData?: Partial<PlayerSession>): PlayerSession {
        // Si une session existe déjà, la réutiliser
        const existing = this.sessions.get(playerId);
        if (existing) {
            existing.socketId = socketId; // Mettre à jour le socket
            this.logger.log(`♻️ Session resumed: ${username}`);
            return existing;
        }

        const level = playerData?.level ?? 1;

        const session: PlayerSession = {
            playerId,
            username,
            socketId,
            level,
            xp: playerData?.xp ?? 0,
            xpToNext: XP_FOR_LEVEL(level),
            hp: BASE_PLAYER_HP + HP_PER_LEVEL * (level - 1),
            maxHp: BASE_PLAYER_HP + HP_PER_LEVEL * (level - 1),
            attack: BASE_PLAYER_ATTACK + ATTACK_PER_LEVEL * (level - 1),
            defense: BASE_PLAYER_DEFENSE + DEFENSE_PER_LEVEL * (level - 1),
            critChance: 0.05,  // 5% de base
            dodge: 0.03,       // 3% de base
            haste: 0,          // 0% de base
            gold: playerData?.gold ?? 100,
            crystals: playerData?.crystals ?? 0,
            role: playerData?.role ?? 'USER',
            language: playerData?.language ?? 'fr',
            equipmentBonus: playerData?.equipmentBonus ?? {
                attack: 0, defense: 0, hp: 0, critChance: 0, dodge: 0, haste: 0
            },
            currentTier: playerData?.currentTier ?? 1,
            currentMonster: null,
            isInCombat: false,
            autoAttackEnabled: true,
            totalDamageDealt: 0,
            totalMonstersKilled: 0,
            totalClicks: 0,
            sessionStartedAt: Date.now(),
            loopInterval: null,
            activeDungeonId: null,
            dungeonMonstersKilled: 0
        };

        this.sessions.set(playerId, session);
        this.spawnMonster(session);
        this.startLoop(session);

        this.logger.log(`⚔️ Game started: ${username} (Lvl ${level}, Tier ${session.currentTier})`);
        return session;
    }

    /**
     * Arrête la session d'un joueur.
     */
    endSession(playerId: string): PlayerSession | null {
        const session = this.sessions.get(playerId);
        if (!session) return null;

        this.stopLoop(session);
        this.sessions.delete(playerId);
        this.logger.log(`🔴 Session ended: ${session.username}`);
        return session;
    }

    /**
     * Récupère la session d'un joueur.
     */
    getSession(playerId: string): PlayerSession | undefined {
        return this.sessions.get(playerId);
    }

    /**
     * Nombre de sessions actives (CCU en combat).
     */
    getActiveSessions(): number {
        return this.sessions.size;
    }

    // ============================================================
    // Mise à jour de l'équipement
    // ============================================================

    updateEquipmentBonus(playerId: string, bonus: PlayerSession['equipmentBonus']): void {
        const session = this.sessions.get(playerId);
        if (!session) return;

        // On calcule la différence de MaxHP pour soigner ou blesser proportionnellement
        const oldMaxHp = session.maxHp + session.equipmentBonus.hp;
        const newMaxHp = session.maxHp + bonus.hp;
        const hpRatio = oldMaxHp > 0 ? session.hp / oldMaxHp : 1;

        session.equipmentBonus = bonus;
        session.hp = Math.max(1, Math.floor(newMaxHp * hpRatio));

        this.logger.log(`🛡️ Updated equipment stats for ${session.username}`);
    }

    // ============================================================
    // Boucle de jeu
    // ============================================================

    private startLoop(session: PlayerSession): void {
        if (session.loopInterval) return;

        session.isInCombat = true;
        const totalHaste = session.haste + session.equipmentBonus.haste;
        const tickRate = Math.max(200, TICK_RATE_MS * (1 - totalHaste));

        session.loopInterval = setInterval(async () => {
            await this.handleCombatTick(session);
        }, tickRate);
    }

    private stopLoop(session: PlayerSession): void {
        if (session.loopInterval) {
            clearInterval(session.loopInterval);
            session.loopInterval = null;
        }
        session.isInCombat = false;
    }

    /**
     * Un tick de la boucle de jeu :
     * 1. Le joueur attaque le monstre (auto-attack)
     * 2. Le monstre attaque le joueur
     * 3. Vérifier mort du monstre / joueur
     */
    private async handleCombatTick(session: PlayerSession): Promise<void> {
        if (!session.currentMonster || !session.isInCombat) return;

        const monster = session.currentMonster;

        // --- 1. Calcul des dégâts du joueur ---
        const totalCritChance = session.critChance + session.equipmentBonus.critChance;
        const isCrit = Math.random() < totalCritChance;
        const critMultiplier = isCrit ? 2.0 : 1.0;
        const totalAttack = session.attack + session.equipmentBonus.attack;
        const rawDamage = totalAttack * critMultiplier;
        const playerDamage = Math.max(1, Math.floor(rawDamage - monster.defense * 0.3));

        monster.hp -= playerDamage;
        session.totalDamageDealt += playerDamage;

        // --- 2. Calcul des dégâts du monstre ---
        const totalDodge = session.dodge + session.equipmentBonus.dodge;
        const totalDefense = session.defense + session.equipmentBonus.defense;
        const isDodge = Math.random() < totalDodge;
        let monsterDamage = 0;
        if (!isDodge) {
            monsterDamage = Math.max(1, Math.floor(monster.attack - totalDefense * 0.5));
            session.hp -= monsterDamage;
        }

        // --- 3. Émettre l'événement de tick ---
        const tickEvent: CombatTickEvent = {
            playerId: session.playerId,
            playerDamage,
            monsterDamage,
            playerHp: session.hp,
            monsterHp: Math.max(0, monster.hp),
            isCrit,
            isDodge,
            timestamp: Date.now(),
        };
        this.pluginManager.emit('combat:tick', tickEvent);

        // --- 4. Vérification de la mort du monstre ---
        if (monster.hp <= 0) {
            await this.onMonsterDeath(session, monster, playerDamage);
            return;
        }

        // --- 5. Vérification de la mort du joueur ---
        if (session.hp <= 0) {
            this.onPlayerDeath(session, monster);
        }
    }

    // ============================================================
    // Clic du joueur (Clicker mechanic)
    // ============================================================

    /**
     * Le joueur clique pour attaquer manuellement.
     * S'ajoute aux auto-attaques.
     */
    async handleClick(playerId: string): Promise<CombatTickEvent | null> {
        const session = this.sessions.get(playerId);
        if (!session || !session.currentMonster || !session.isInCombat) return null;

        const monster = session.currentMonster;
        session.totalClicks++;

        const totalCritChance = session.critChance + session.equipmentBonus.critChance;
        const totalAttack = session.attack + session.equipmentBonus.attack;

        // Dégâts du clic
        const isCrit = Math.random() < (totalCritChance * 1.5); // Crits 50% plus fréquents au clic
        const clickDamage = Math.max(1, Math.floor(
            totalAttack * CLICK_DAMAGE_MULTIPLIER * (isCrit ? 2.5 : 1.0)
        ));

        monster.hp -= clickDamage;
        session.totalDamageDealt += clickDamage;

        // Émettre l'événement de clic
        this.pluginManager.emit('click:attack', {
            playerId: session.playerId,
            clickDamage,
            totalClicks: session.totalClicks,
            timestamp: Date.now(),
        });

        const tickEvent: CombatTickEvent = {
            playerId: session.playerId,
            playerDamage: clickDamage,
            monsterDamage: 0,
            playerHp: session.hp,
            monsterHp: Math.max(0, monster.hp),
            isCrit,
            isDodge: false,
            timestamp: Date.now(),
        };

        // Le monstre meurt du clic ?
        if (monster.hp <= 0) {
            await this.onMonsterDeath(session, monster, clickDamage);
        }

        return tickEvent;
    }

    // ============================================================
    // Événements majeurs
    // ============================================================

    /**
     * Le monstre est mort !
     */
    private async onMonsterDeath(session: PlayerSession, monster: MonsterData, lastHit: number): Promise<void> {
        session.totalMonstersKilled++;

        // Émettre l'événement monster:death
        this.pluginManager.emit('monster:death', {
            playerId: session.playerId,
            monsterId: monster.id,
            monsterName: monster.name,
            tier: monster.tier,
            damageDealt: session.totalDamageDealt,
            overkill: Math.abs(Math.min(0, monster.hp)),
            timestamp: Date.now(),
        });

        // --- Gain d'XP (passe par le PluginManager pour que les plugins modifient le multiplicateur) ---
        const xpEvent: XpGainEvent = {
            playerId: session.playerId,
            amount: monster.xpReward,
            source: `monster:${monster.name}`,
            multiplier: 1.0, // Les plugins peuvent modifier ce champ !
            timestamp: Date.now(),
        };
        this.pluginManager.emit('xp:gain', xpEvent);

        // Appliquer le gain d'XP (avec le multiplicateur potentiellement modifié par les plugins)
        const xpGained = Math.floor(xpEvent.amount * xpEvent.multiplier);
        session.xp += xpGained;

        // --- Gain d'Or ---
        const goldEvent: GoldGainEvent = {
            playerId: session.playerId,
            amount: monster.goldReward,
            source: `monster:${monster.name}`,
            timestamp: Date.now(),
        };
        this.pluginManager.emit('gold:gain', goldEvent);
        session.gold += goldEvent.amount;

        // --- Level Up ? ---
        this.checkLevelUp(session);

        // --- Générer le loot ---
        await this.lootService.generateLoot(session.playerId, monster);

        // --- Régénération partielle des HP ---
        const currentMaxHp = session.maxHp + session.equipmentBonus.hp;
        session.hp = Math.min(currentMaxHp, session.hp + Math.floor(currentMaxHp * 0.15));

        // --- Avancer au Tier suivant (boss = progression) ---
        if (session.activeDungeonId) {
            session.dungeonMonstersKilled++;
            if (session.dungeonMonstersKilled > 10) { // On vient de tuer le boss (10 minions + 1 boss)
                session.dungeonMonstersKilled = 0;
                session.currentTier++; // On progresse au Tier suivant !
                // On pourrait aussi sortir du donjon ou continuer
            }
        } else if (monster.tier % 10 === 0) {
            session.currentTier++;
        }

        // --- Spawn du prochain monstre ---
        this.spawnMonster(session);
    }

    /**
     * Le joueur est mort...
     */
    private onPlayerDeath(session: PlayerSession, killedBy: MonsterData): void {
        this.pluginManager.emit('player:death', {
            playerId: session.playerId,
            killedBy: killedBy.name,
            tier: session.currentTier,
            timestamp: Date.now(),
        });

        // Respawn : HP full, recul d'un Tier (minimum 1)
        session.currentTier = Math.max(1, session.currentTier - 1);
        session.hp = session.maxHp + session.equipmentBonus.hp;

        this.logger.log(`💀 ${session.username} died to ${killedBy.name}! Back to Tier ${session.currentTier}`);

        // Respawn d'un nouveau monstre
        this.spawnMonster(session);
    }

    /**
     * Vérifie et applique le level-up.
     */
    private checkLevelUp(session: PlayerSession): void {
        while (session.xp >= session.xpToNext) {
            session.xp -= session.xpToNext;
            const oldLevel = session.level;
            session.level++;
            session.xpToNext = XP_FOR_LEVEL(session.level);

            // Augmenter les stats
            session.maxHp = BASE_PLAYER_HP + HP_PER_LEVEL * (session.level - 1);
            session.hp = session.maxHp + session.equipmentBonus.hp; // Full heal au level up !
            session.attack = BASE_PLAYER_ATTACK + ATTACK_PER_LEVEL * (session.level - 1);
            session.defense = BASE_PLAYER_DEFENSE + DEFENSE_PER_LEVEL * (session.level - 1);

            this.pluginManager.emit('player:levelup', {
                playerId: session.playerId,
                oldLevel,
                newLevel: session.level,
                totalXp: session.xp,
                timestamp: Date.now(),
            });

            this.logger.log(`🎊 ${session.username} LEVEL UP! ${oldLevel} → ${session.level}`);
        }
    }

    /**
     * Fait apparaître un nouveau monstre.
     * Si le joueur est dans un donjon spécifique, utilise les templates du donjon.
     */
    public async spawnMonster(session: PlayerSession): Promise<void> {
        if (session.activeDungeonId) {
            const dungeon = await this.prisma.dungeonTemplate.findUnique({
                where: { id: session.activeDungeonId },
                include: { minionTemplate: true, bossTemplate: true }
            });

            if (dungeon) {
                const isBossTime = session.dungeonMonstersKilled >= 10;
                const template = isBossTime ? dungeon.bossTemplate : dungeon.minionTemplate;
                const category = isBossTime ? 'BOSS' : 'MINION';

                // Calcul du scaling (Logique Phase 9)
                const scale = this.calculateScaling(session.currentTier, category as any);

                session.currentMonster = {
                    id: template.id,
                    name: template.name,
                    hp: scale.hp,
                    maxHp: scale.hp,
                    attack: scale.attack,
                    defense: Math.floor(session.currentTier * 2),
                    xpReward: scale.xp,
                    goldReward: scale.gold,
                    tier: session.currentTier,
                    spriteKey: template.spriteUrl // On réutilise spriteKey pour stocker l'URL
                };
                return;
            }
        }

        // Monde normal
        session.currentMonster = this.monsterRepo.generateMonster(session.currentTier);
    }

    /**
     * Calcule le scaling d'un monstre pour le donjon.
     * Note: Cette logique devrait idéalement être partagée avec DungeonService.
     */
    private calculateScaling(tier: number, category: 'MINION' | 'BOSS') {
        const baseHp = 100;
        const growthRate = 1.0202;
        let hp = Math.floor(baseHp * Math.pow(growthRate, tier - 1));
        if (category === 'BOSS') hp *= 10;
        const attack = Math.max(1, Math.floor(hp * 0.05));
        const xp = Math.floor(tier * 10 * Math.pow(1.01, tier - 1));
        const gold = Math.floor(tier * 5);
        return { hp, attack, xp, gold };
    }

    // ============================================================
    // Sérialisation du GameState pour le client
    // ============================================================

    /**
     * Construit le GameState complet à envoyer au client via WebSocket.
     */
    buildGameState(session: PlayerSession) {
        const payload = {
            player: {
                id: session.playerId,
                username: session.username,
                level: session.level,
                xp: session.xp,
                xpToNext: session.xpToNext,
                hp: session.hp,
                maxHp: session.maxHp + session.equipmentBonus.hp,
                gold: session.gold,
                crystals: session.crystals,
                role: session.role,
                language: session.language
            },
            combat: {
                tier: session.currentTier,
                monster: session.currentMonster,
                isInCombat: session.isInCombat,
            },
            stats: {
                totalMonstersKilled: session.totalMonstersKilled,
                totalClicks: session.totalClicks,
                dps: session.attack, // Simplifié, sera calculé plus précisément plus tard
                sessionDuration: Math.floor((Date.now() - session.sessionStartedAt) / 1000),
            },
        };
    }
}
