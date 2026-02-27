// ============================================================
// Types fondamentaux du jeu — @idle/shared
// ============================================================

/** Rôles utilisateurs avec hiérarchie stricte */
export enum UserRole {
    USER = 'USER',
    MODERATOR = 'MODERATOR',
    ADMIN = 'ADMIN',
}

/** Raretés des items — chaque rareté a sa couleur dans le Design System */
export enum Rarity {
    COMMON = 'COMMON',       // Blanc
    UNCOMMON = 'UNCOMMON',   // Vert
    RARE = 'RARE',           // Bleu
    EPIC = 'EPIC',           // Violet
    LEGENDARY = 'LEGENDARY', // Orange
}

/** Statuts de modération Workshop */
export enum ItemStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
    SUSPENDED = 'SUSPENDED',
}

/** Animations disponibles pour les sprites */
export enum SpriteAnimation {
    IDLE = 'idle',
    ATTACK = 'attack',
    HIT = 'hit',
    DEATH = 'death',
}

/** Couche d'un sprite multicouche */
export interface SpriteLayer {
    id: string;
    zIndex: number;
    spriteUrl: string;
    animation: SpriteAnimation;
    hueRotate?: number;
    brightness?: number;
    saturate?: number;
}

/** État du jeu envoyé au client via WebSocket */
export interface GameState {
    player: PlayerState;
    combat: CombatState;
    inventory: InventoryItem[];
}

export interface PlayerState {
    id: string;
    username: string;
    level: number;
    xp: number;
    xpToNext: number;
    hp: number;
    maxHp: number;
    gold: number;
    crystals: number;
    role: UserRole;
    avatar: SpriteLayer[];
}

export interface CombatState {
    isActive: boolean;
    currentZone: string;
    currentTier: number;
    monster: MonsterState | null;
    dps: number;
    lastHit: number;
}

export interface MonsterState {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    sprite: SpriteLayer[];
    tier: number;
}

export interface InventoryItem {
    instanceId: string;
    templateId: string;
    name: string;
    rarity: Rarity;
    isEquipped: boolean;
    slot: EquipmentSlot;
    stats: ItemStats;
    spriteUrl: string;
    creatorName?: string;
}

export enum EquipmentSlot {
    HEAD = 'HEAD',
    BODY = 'BODY',
    LEGS = 'LEGS',
    FEET = 'FEET',
    CAPE = 'CAPE',
    WEAPON_MAIN = 'WEAPON_MAIN',
    WEAPON_OFF = 'WEAPON_OFF',
    SHIELD = 'SHIELD',
    AURA = 'AURA',
    PET = 'PET',
}

export interface ItemStats {
    attack?: number;
    defense?: number;
    hp?: number;
    critChance?: number;
    dodge?: number;
    haste?: number;
}

/** Événements WebSocket (Client → Server) */
export enum ClientEvent {
    CLICK_ATTACK = 'combat:click',
    EQUIP_ITEM = 'inventory:equip',
    UNEQUIP_ITEM = 'inventory:unequip',
    SHOP_BUY = 'shop:buy',
    SHOP_SELL = 'shop:sell',
    CHANGE_ZONE = 'combat:zone',
}

/** Événements WebSocket (Server → Client) */
export enum ServerEvent {
    GAME_STATE = 'game:state',
    COMBAT_TICK = 'combat:tick',
    MONSTER_DEATH = 'combat:monster_death',
    PLAYER_LEVEL_UP = 'player:level_up',
    LOOT_DROP = 'loot:drop',
    INVENTORY_UPDATE = 'inventory:update',
    NOTIFICATION = 'ui:notification',
    ERROR = 'error',
}
