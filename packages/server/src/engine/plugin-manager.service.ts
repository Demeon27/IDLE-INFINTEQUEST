import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

// ============================================================
// Types des Hooks — Contrats typés pour tout le système de plugins
// ============================================================

export interface MonsterDeathEvent {
    playerId: string;
    monsterId: string;
    monsterName: string;
    tier: number;
    damageDealt: number;
    overkill: number;
    timestamp: number;
}

export interface PlayerLevelUpEvent {
    playerId: string;
    oldLevel: number;
    newLevel: number;
    totalXp: number;
    timestamp: number;
}

export interface LootDropEvent {
    playerId: string;
    monsterId: string;
    tier: number;
    drops: Array<{
        templateId: string;
        name: string;
        rarity: string;
        quantity: number;
    }>;
    goldAmount: number;
    timestamp: number;
}

export interface CombatTickEvent {
    playerId: string;
    playerDamage: number;
    monsterDamage: number;
    playerHp: number;
    monsterHp: number;
    isCrit: boolean;
    isDodge: boolean;
    timestamp: number;
}

export interface PlayerDeathEvent {
    playerId: string;
    killedBy: string;
    tier: number;
    timestamp: number;
}

export interface XpGainEvent {
    playerId: string;
    amount: number;
    source: string;
    /** Multiplicateur AVANT application (permet aux plugins de le modifier) */
    multiplier: number;
    timestamp: number;
}

export interface GoldGainEvent {
    playerId: string;
    amount: number;
    source: string;
    timestamp: number;
}

export interface ClickAttackEvent {
    playerId: string;
    clickDamage: number;
    totalClicks: number;
    timestamp: number;
}

export interface ShopItemApprovedEvent {
    item: any; // On met 'any' pour l'instant ou ItemTemplate selon comment prisma est mappé
}

// ============================================================
// Map des événements typés — Registre central
// ============================================================

export interface GameEventMap {
    'monster:death': MonsterDeathEvent;
    'player:levelup': PlayerLevelUpEvent;
    'player:death': PlayerDeathEvent;
    'loot:drop': LootDropEvent;
    'combat:tick': CombatTickEvent;
    'xp:gain': XpGainEvent;
    'gold:gain': GoldGainEvent;
    'click:attack': ClickAttackEvent;
    'shop:item_approved': ShopItemApprovedEvent;
}

export type GameEventName = keyof GameEventMap;

// ============================================================
// Interface Plugin — Contrat que tout plugin doit respecter
// ============================================================

export interface IGamePlugin {
    /** Nom unique du plugin */
    name: string;
    /** Description affichée dans l'admin */
    description: string;
    /** Version du plugin */
    version: string;
    /** Appelé quand le plugin est activé */
    onEnable(manager: PluginManager): void;
    /** Appelé quand le plugin est désactivé */
    onDisable(manager: PluginManager): void;
}

// ============================================================
// PluginManager — EventEmitter typé central
// ============================================================

@Injectable()
export class PluginManager {
    private readonly logger = new Logger(PluginManager.name);
    private readonly emitter = new EventEmitter();
    private readonly plugins = new Map<string, IGamePlugin>();
    private readonly activePlugins = new Set<string>();

    constructor() {
        // Augmenter la limite d'écouteurs (beaucoup de plugins possibles)
        this.emitter.setMaxListeners(50);
        this.logger.log('🔌 PluginManager initialized — Ready for plugins');
    }

    // ---- Émission d'événements ----

    /**
     * Émet un événement typé. Tous les plugins abonnés seront notifiés.
     */
    emit<K extends GameEventName>(event: K, data: GameEventMap[K]): void {
        this.emitter.emit(event, data);
    }

    // ---- Abonnement aux événements ----

    /**
     * S'abonne à un événement du moteur.
     * Les plugins et modules utilisent cette méthode pour réagir aux événements.
     */
    on<K extends GameEventName>(event: K, handler: (data: GameEventMap[K]) => void): void {
        this.emitter.on(event, handler as (...args: unknown[]) => void);
    }

    /**
     * S'abonne une seule fois à un événement.
     */
    once<K extends GameEventName>(event: K, handler: (data: GameEventMap[K]) => void): void {
        this.emitter.once(event, handler as (...args: unknown[]) => void);
    }

    /**
     * Se désabonne d'un événement.
     */
    off<K extends GameEventName>(event: K, handler: (data: GameEventMap[K]) => void): void {
        this.emitter.off(event, handler as (...args: unknown[]) => void);
    }

    // ---- Gestion des plugins ----

    /**
     * Enregistre un plugin dans le système.
     */
    register(plugin: IGamePlugin): void {
        if (this.plugins.has(plugin.name)) {
            this.logger.warn(`⚠️ Plugin "${plugin.name}" already registered — skipping`);
            return;
        }

        this.plugins.set(plugin.name, plugin);
        this.logger.log(`📦 Plugin registered: ${plugin.name} v${plugin.version}`);
    }

    /**
     * Active un plugin enregistré.
     */
    enable(pluginName: string): boolean {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) {
            this.logger.warn(`⚠️ Plugin "${pluginName}" not found`);
            return false;
        }

        if (this.activePlugins.has(pluginName)) {
            this.logger.warn(`⚠️ Plugin "${pluginName}" already active`);
            return false;
        }

        plugin.onEnable(this);
        this.activePlugins.add(pluginName);
        this.logger.log(`✅ Plugin enabled: ${plugin.name}`);
        return true;
    }

    /**
     * Désactive un plugin.
     */
    disable(pluginName: string): boolean {
        const plugin = this.plugins.get(pluginName);
        if (!plugin) return false;

        if (!this.activePlugins.has(pluginName)) return false;

        plugin.onDisable(this);
        this.activePlugins.delete(pluginName);
        this.logger.log(`🔴 Plugin disabled: ${plugin.name}`);
        return true;
    }

    /**
     * Retourne la liste de tous les plugins et leur état.
     */
    listPlugins(): Array<{ name: string; description: string; version: string; active: boolean }> {
        return Array.from(this.plugins.values()).map(p => ({
            name: p.name,
            description: p.description,
            version: p.version,
            active: this.activePlugins.has(p.name),
        }));
    }

    /**
     * Nombre d'écouteurs pour un événement donné.
     */
    listenerCount(event: GameEventName): number {
        return this.emitter.listenerCount(event);
    }
}
