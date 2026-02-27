// ============================================================
// Constantes de jeu — @idle/shared
// ============================================================

/** Formule d'XP requise par niveau (exponentielle) */
export const xpForLevel = (level: number): number =>
    Math.floor(100 * Math.pow(1.15, level - 1));

/** HP des monstres par Tier (scaling infini) */
export const monsterHpForTier = (tier: number): number =>
    Math.floor(100 * Math.pow(1.12, tier - 1));

/** Dégâts des monstres par Tier */
export const monsterDmgForTier = (tier: number): number =>
    Math.floor(10 * Math.pow(1.10, tier - 1));

/** Gold drop par Tier */
export const goldDropForTier = (tier: number): number =>
    Math.floor(5 * Math.pow(1.08, tier - 1));

/** Constantes globales du jeu */
export const GAME_CONSTANTS = {
    /** Tick rate de la Game Loop (ms) */
    TICK_RATE: 1000,
    /** Max actions WebSocket par seconde (anti-abus) */
    MAX_ACTIONS_PER_SECOND: 10,
    /** Taxe sur l'Hôtel de Vente (5%) */
    AUCTION_TAX_RATE: 0.05,
    /** Niveaux de calques pour les avatars */
    SPRITE_SIZE: 64,
    /** Frames par animation */
    ANIMATION_FRAMES: {
        idle: 4,
        attack: 6,
        hit: 2,
        death: 4,
    },
} as const;

/** Définition des calques d'avatar (z-index -> slot) */
export const AVATAR_LAYERS = [
    { slot: 'BASE', zIndex: 0, label: 'Corps' },
    { slot: 'LEGS', zIndex: 1, label: 'Jambières' },
    { slot: 'FEET', zIndex: 2, label: 'Bottes' },
    { slot: 'BODY', zIndex: 3, label: 'Armure' },
    { slot: 'CAPE', zIndex: 4, label: 'Cape' },
    { slot: 'HEAD', zIndex: 5, label: 'Casque' },
    { slot: 'WEAPON_MAIN', zIndex: 6, label: 'Arme (Main)' },
    { slot: 'WEAPON_OFF', zIndex: 7, label: 'Arme (Off)' },
    { slot: 'SHIELD', zIndex: 8, label: 'Bouclier' },
    { slot: 'AURA', zIndex: 9, label: 'Aura' },
    { slot: 'PET', zIndex: 10, label: 'Familier' },
] as const;
