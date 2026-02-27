import { Injectable } from '@nestjs/common';

// ============================================================
// Types de monstres
// ============================================================

export interface MonsterData {
    id: string;
    name: string;
    tier: number;
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    xpReward: number;
    goldReward: number;
    spriteKey: string;
}

// ============================================================
// Noms et préfixes pour la génération procédurale de monstres
// ============================================================

const MONSTER_PREFIXES = [
    '', '', '', '',  // 40% pas de préfixe (monstres basiques)
    'Sombre ', 'Ancien ', 'Maudit ', 'Enragé ', 'Corrompu ',
    'Spectral ', 'Infernal ', 'Glacial ', 'Toxique ', 'Brûlant ',
];

const MONSTER_NAMES = [
    'Gobelin', 'Squelette', 'Loup', 'Araignée', 'Slime',
    'Orc', 'Zombie', 'Chauve-Souris', 'Rat Géant', 'Serpent',
    'Golem', 'Banshee', 'Minotaure', 'Ogre', 'Wraith',
    'Drake', 'Chimère', 'Hydre', 'Démon', 'Liche',
    'Revenant', 'Basilic', 'Cockatrice', 'Manticore', 'Griffon',
];

const MONSTER_SUFFIXES = [
    '', '', '', '', '',  // 50% pas de suffixe
    ' du Crépuscule', ' des Abysses', ' de l\'Ombre',
    ' du Néant', ' de Feu', ' de Givre', ' Putréfié',
    ' Ancestral', ' Immortel', ' du Chaos',
];

const BOSS_TITLES = [
    'Roi', 'Seigneur', 'Empereur', 'Gardien', 'Archonte',
    'Avatar', 'Prophète', 'Fléau', 'Tyran', 'Patriarche',
];

// ============================================================
// MonsterRepository — Génération procédurale par Tier
// ============================================================

@Injectable()
export class MonsterRepository {

    /**
     * Génère un monstre pour un Tier donné.
     * Les stats scalent exponentiellement — le jeu est techniquement infini.
     *
     * Formules de scaling :
     * - HP   = 100 × 1.12^(tier-1)
     * - ATK  = 10  × 1.10^(tier-1)
     * - DEF  = 5   × 1.08^(tier-1)
     * - XP   = 25  × 1.11^(tier-1)
     * - Gold = 5   × 1.08^(tier-1)
     */
    generateMonster(tier: number): MonsterData {
        const isBoss = this.isBossWave(tier);
        const bossMultiplier = isBoss ? 5 : 1;

        const name = isBoss ? this.generateBossName(tier) : this.generateMonsterName(tier);
        const id = `monster_${tier}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

        const hp = Math.floor(100 * Math.pow(1.12, tier - 1) * bossMultiplier);
        const attack = Math.floor(10 * Math.pow(1.10, tier - 1) * (isBoss ? 2 : 1));
        const defense = Math.floor(5 * Math.pow(1.08, tier - 1) * (isBoss ? 1.5 : 1));
        const xpReward = Math.floor(25 * Math.pow(1.11, tier - 1) * (isBoss ? 10 : 1));
        const goldReward = Math.floor(5 * Math.pow(1.08, tier - 1) * (isBoss ? 5 : 1));

        return {
            id,
            name,
            tier,
            hp,
            maxHp: hp,
            attack,
            defense,
            xpReward,
            goldReward,
            spriteKey: this.getSpriteKey(tier, isBoss),
        };
    }

    /**
     * Détermine si le monstre est un Boss (tous les 10 tiers)
     */
    private isBossWave(tier: number): boolean {
        return tier % 10 === 0;
    }

    /**
     * Génère un nom de monstre procédural basé sur le Tier
     */
    private generateMonsterName(tier: number): string {
        // Seed basé sur le tier pour une variété déterministe
        const nameIndex = tier % MONSTER_NAMES.length;
        const prefixIndex = Math.floor(tier / MONSTER_NAMES.length) % MONSTER_PREFIXES.length;
        const suffixIndex = Math.floor(tier / (MONSTER_NAMES.length * 2)) % MONSTER_SUFFIXES.length;

        const prefix = tier > 5 ? MONSTER_PREFIXES[prefixIndex] : '';
        const name = MONSTER_NAMES[nameIndex];
        const suffix = tier > 15 ? MONSTER_SUFFIXES[suffixIndex] : '';

        return `${prefix}${name}${suffix}`.trim();
    }

    /**
     * Génère un nom de Boss épique
     */
    private generateBossName(tier: number): string {
        const titleIndex = (tier / 10) % BOSS_TITLES.length;
        const nameIndex = Math.floor(tier / 10) % MONSTER_NAMES.length;
        const title = BOSS_TITLES[Math.floor(titleIndex)];
        const name = MONSTER_NAMES[nameIndex];

        return `${title} ${name}`;
    }

    /**
     * Clé de sprite basée sur le tiers de difficulté
     */
    private getSpriteKey(tier: number, isBoss: boolean): string {
        if (isBoss) return `boss_${Math.ceil(tier / 10)}`;
        if (tier <= 5) return 'monster_basic';
        if (tier <= 15) return 'monster_undead';
        if (tier <= 30) return 'monster_demon';
        if (tier <= 50) return 'monster_dragon';
        return 'monster_eldritch';
    }

    /**
     * Affiche des stats formatées pour le debug
     */
    formatStats(monster: MonsterData): string {
        return `[T${monster.tier}] ${monster.name} | HP: ${monster.hp.toLocaleString()} | ATK: ${monster.attack} | DEF: ${monster.defense} | XP: ${monster.xpReward} | Gold: ${monster.goldReward}`;
    }
}
