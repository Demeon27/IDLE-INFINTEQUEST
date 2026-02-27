// ============================================================
// Design Tokens — Thème "Taverne Pixel Art"
// Source de vérité pour TOUTE la direction artistique
// ============================================================

import { Rarity } from './types';

/**
 * Palette de couleurs — Taverne Médiévale
 * Tons terreux, bois, pierre, or, feu de cheminée
 */
export const COLORS = {
    // --- Backgrounds ---
    bg: {
        darkest: '#0d0b08',  // Fond le plus sombre (ombre profonde)
        darker: '#1a1510',  // Panneau latéral, header
        dark: '#2a2318',  // Carte / panneau principal
        medium: '#3d3425',  // Surface élevée (modale)
        light: '#4f4433',  // Hover sur surface
        lighter: '#635842',  // Activé / sélectionné
    },

    // --- Textures (référencées en CSS) ---
    wood: {
        dark: '#2c1e0f',  // Bois sombre (chêne)
        medium: '#4a3322',  // Bois moyen (meubles)
        light: '#6b4c2f',  // Bois clair (pin)
        grain: '#3a2813',  // Grain du bois
    },

    stone: {
        dark: '#3a3a3a',  // Pierre sombre
        medium: '#5a5a52',  // Pierre moyenne
        light: '#7a7a6e',  // Pierre claire
        moss: '#4a5a3a',  // Pierre moussue
    },

    // --- Texte ---
    text: {
        primary: '#e8dcc8', // Texte principal (parchemin clair)
        secondary: '#b8a88a', // Texte secondaire
        muted: '#8a7a62', // Texte désactivé / subtil
        accent: '#d4a855', // Texte doré (titres importants)
        dark: '#2a2318', // Texte sur fond clair
    },

    // --- Accents ---
    accent: {
        gold: '#d4a855', // Or principal (boutons, XP)
        goldLight: '#e8c46a', // Or clair (hover)
        goldDark: '#b8882a', // Or sombre (pressed)
        fire: '#c44a1a', // Rouge feu (HP, danger)
        fireDark: '#8a2a0a', // Rouge sombre
        ember: '#d4682a', // Braise (notifications)
        emerald: '#4a8a3a', // Vert émeraude (heal, succès)
        mana: '#4a6a9a', // Bleu nuit (mana, info)
        purple: '#7a4a8a', // Violet mystique (epic)
    },

    // --- Bordures ---
    border: {
        dark: '#1a1510', // Bordure sombre
        medium: '#3d3425', // Bordure standard
        light: '#5a4d3a', // Bordure claire
        gold: '#d4a855', // Bordure dorée (accent)
        iron: '#6a6a62', // Fer forgé
    },

    // --- Rareté (contours lumineux des items) ---
    rarity: {
        [Rarity.COMMON]: '#9a9a8a',  // Gris clair
        [Rarity.UNCOMMON]: '#4a9a3a',  // Vert
        [Rarity.RARE]: '#3a6ab8',  // Bleu
        [Rarity.EPIC]: '#8a3ab8',  // Violet
        [Rarity.LEGENDARY]: '#d4882a',  // Orange
    },
} as const;

/**
 * Typographie — Pixel Art + Lisibilité
 */
export const TYPOGRAPHY = {
    /** Police pixel art pour les titres et les noms */
    fontPixel: "'Press Start 2P', cursive",
    /** Police lisible pour le corps de texte */
    fontBody: "'Inter', 'Segoe UI', system-ui, sans-serif",
    /** Police pour les nombres et stats */
    fontMono: "'JetBrains Mono', 'Fira Code', monospace",

    sizes: {
        xs: '0.625rem',  // 10px — labels minuscules
        sm: '0.75rem',   // 12px — texte secondaire
        base: '0.875rem',  // 14px — corps de texte
        md: '1rem',      // 16px — titres de section
        lg: '1.25rem',   // 20px — titres de modale
        xl: '1.5rem',    // 24px — titres principaux
        xxl: '2rem',      // 32px — titres de page (pixel)
        hero: '2.5rem',    // 40px — titre héro
    },

    weights: {
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
    },
} as const;

/**
 * Espacements — Grille de 4px
 */
export const SPACING = {
    xxs: '2px',
    xs: '4px',
    sm: '8px',
    md: '12px',
    base: '16px',
    lg: '20px',
    xl: '24px',
    xxl: '32px',
    xxxl: '48px',
    huge: '64px',
} as const;

/**
 * Ombres — Ambiance chaleureuse de taverne
 */
export const SHADOWS = {
    /** Ombre portée douce (panneau) */
    sm: '0 2px 4px rgba(0, 0, 0, 0.3)',
    /** Ombre standard (carte élevée) */
    md: '0 4px 8px rgba(0, 0, 0, 0.4)',
    /** Ombre marquée (modale, dropdown) */
    lg: '0 8px 24px rgba(0, 0, 0, 0.5)',
    /** Ombre de fenêtre flottante */
    xl: '0 12px 32px rgba(0, 0, 0, 0.6)',
    /** Lueur de feu intérieure (ambiance) */
    fireGlow: '0 0 30px rgba(196, 74, 26, 0.15), 0 0 60px rgba(212, 168, 85, 0.08)',
    /** Lueur dorée (bouton actif / focus) */
    goldGlow: '0 0 8px rgba(212, 168, 85, 0.4)',
    /** Inset ombré (champ de texte, barre) */
    inset: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
} as const;

/**
 * Bordures & Radius
 */
export const BORDERS = {
    radius: {
        none: '0',
        sm: '2px',   // Subtil (pixel art friendly)
        md: '4px',   // Standard
        lg: '6px',   // Modale
        xl: '8px',   // Bouton large
        full: '9999px', // Pill / badge
    },
    width: {
        thin: '1px',
        medium: '2px',
        thick: '3px',
        heavy: '4px',
    },
} as const;

/**
 * Animations — Transitions et timings
 */
export const ANIMATION = {
    duration: {
        instant: '0ms',
        fast: '100ms',
        normal: '200ms',
        smooth: '300ms',
        slow: '500ms',
    },
    easing: {
        default: 'cubic-bezier(0.4, 0, 0.2, 1)',
        bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        snap: 'cubic-bezier(0, 0, 0.2, 1)',
    },
} as const;

/**
 * Z-Index — Couches de l'interface
 */
export const Z_INDEX = {
    base: 0,
    sidebar: 100,
    header: 200,
    dropdown: 300,
    modal: 400,
    tooltip: 500,
    toast: 600,
    floatingWindow: 350,
} as const;
