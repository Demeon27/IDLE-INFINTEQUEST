import { create } from 'zustand';

// ============================================================
// Types du GameState côté client (miroir du serveur)
// ============================================================

export interface PlayerState {
    id: string;
    username: string;
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
}

export interface MonsterState {
    id: string;
    name: string;
    tier: number;
    hp: number;
    maxHp: number;
    attack: number;
    spriteKey: string;
}

export interface CombatState {
    isActive: boolean;
    currentTier: number;
    monster: MonsterState | null;
}

export interface SessionStats {
    totalDamageDealt: number;
    totalMonstersKilled: number;
    totalClicks: number;
    dps: number;
    sessionDuration: number;
}

export interface FloatingNumber {
    id: number;
    value: string;
    type: 'damage' | 'crit' | 'heal' | 'gold' | 'xp' | 'dodge';
    x: number;
    y: number;
}

export interface Toast {
    id: number;
    type: 'success' | 'error' | 'warning' | 'info' | 'loot';
    message: string;
}

export interface LootDrop {
    name: string;
    rarity: string;
    quantity: number;
}

export interface VisualDrop {
    id: number;
    type: 'gold' | 'bag' | 'chest';
    x: number;
    y: number;
    color: string;
    label: string;
}

// ============================================================
// Store Zustand — Source de vérité côté client
// ============================================================

interface GameStore {
    // --- État de connexion ---
    connected: boolean;
    playerId: string | null;

    // --- GameState (miroir du serveur) ---
    player: PlayerState | null;
    combat: CombatState;
    stats: SessionStats;

    // --- Inventory & Equipment (Global) ---
    inventory: any[];
    equipmentBonus: any;


    // --- UI State ---
    floatingNumbers: FloatingNumber[];
    visualDrops: VisualDrop[];
    toasts: Toast[];
    shaking: boolean;
    levelUpFlash: boolean;
    activeView: string;
    activeDungeonId: string | null;

    // --- Auth State ---
    token: string | null;
    isAuthenticated: boolean;
    setAuth: (token: string, playerId: string) => void;
    logout: () => void;


    // --- Actions de mise à jour ---
    setConnected: (connected: boolean) => void;
    setPlayerId: (id: string) => void;
    updateGameState: (state: { player: PlayerState; combat: CombatState; stats: SessionStats; activeDungeonId?: string | null }) => void;

    // --- Actions de combat ---
    handleCombatTick: (tick: { damage: number; monsterDamage: number; isCrit: boolean; isDodge: boolean; playerHp: number; monsterHp: number }) => void;
    handleClickResult: (result: { damage: number; isCrit: boolean; monsterHp: number }) => void;
    handleMonsterDeath: (data: { monsterName: string; tier: number }) => void;
    handleLevelUp: (data: { oldLevel: number; newLevel: number }) => void;
    handleLootDrop: (data: { drops: LootDrop[]; gold: number }) => void;
    handlePlayerDeath: (data: { killedBy: string; newTier: number }) => void;
    setInventory: (items: any[]) => void;
    setEquipmentBonus: (bonus: any) => void;


    // --- Actions UI ---
    addFloatingNumber: (value: string, type: FloatingNumber['type']) => void;
    addVisualDrop: (type: VisualDrop['type'], label: string, color?: string) => void;
    addToast: (type: Toast['type'], message: string) => void;
    removeToast: (id: number) => void;
    triggerShake: () => void;
    setActiveView: (view: string) => void;
    setActiveDungeonId: (id: string | null) => void;
}

let floatingIdCounter = 0;
let toastIdCounter = 0;

export const useGameStore = create<GameStore>((set, get) => ({
    // --- État initial ---
    connected: false,
    playerId: null,
    player: null,
    combat: { isActive: false, currentTier: 1, monster: null },
    stats: { totalDamageDealt: 0, totalMonstersKilled: 0, totalClicks: 0, dps: 0, sessionDuration: 0 },
    inventory: [],
    equipmentBonus: { attack: 0, defense: 0, hp: 0, critChance: 0, dodge: 0, haste: 0 },

    floatingNumbers: [],
    visualDrops: [],
    toasts: [],
    shaking: false,
    levelUpFlash: false,
    activeView: 'auth',
    activeDungeonId: null,
    token: localStorage.getItem('auth_token'),
    isAuthenticated: !!localStorage.getItem('auth_token'),


    // --- Connexion ---
    setConnected: (connected) => set({ connected }),
    setPlayerId: (id) => set({ playerId: id }),

    // --- Mise à jour complète du GameState (reçu du serveur) ---
    updateGameState: (state) => set({
        playerId: state.player.id,
        player: state.player,
        combat: state.combat,
        stats: state.stats,
        activeDungeonId: state.activeDungeonId ?? null,
    }),

    // --- Combat tick (auto-attaque chaque seconde) ---
    handleCombatTick: (tick) => {

        // Floating number pour les dégâts du joueur
        if (tick.damage > 0) {
            const type = tick.isCrit ? 'crit' : 'damage';
            get().addFloatingNumber(
                tick.isCrit ? `💥 ${tick.damage}` : `${tick.damage}`,
                type
            );
        }

        // Floating number pour l'esquive
        if (tick.isDodge) {
            get().addFloatingNumber('ESQUIVE !', 'dodge');
        }

        // Shake si le joueur prend des dégâts
        if (tick.monsterDamage > 0 && !tick.isDodge) {
            get().triggerShake();
        }

        // Mettre à jour les HP
        set((s) => ({
            player: s.player ? { ...s.player, hp: tick.playerHp } : null,
            combat: {
                ...s.combat,
                monster: s.combat.monster ? { ...s.combat.monster, hp: Math.max(0, tick.monsterHp) } : null,
            },
        }));
    },

    // --- Résultat d'un clic ---
    handleClickResult: (result) => {
        get().addFloatingNumber(
            result.isCrit ? `⚡ ${result.damage}` : `${result.damage}`,
            result.isCrit ? 'crit' : 'damage'
        );
        set((s) => ({
            combat: {
                ...s.combat,
                monster: s.combat.monster ? { ...s.combat.monster, hp: Math.max(0, result.monsterHp) } : null,
            },
            stats: { ...s.stats, totalClicks: s.stats.totalClicks + 1 },
        }));
    },

    // --- Mort du monstre ---
    handleMonsterDeath: (_data) => {
        set((s) => ({
            stats: { ...s.stats, totalMonstersKilled: s.stats.totalMonstersKilled + 1 },
        }));
    },

    // --- Level Up ! ---
    handleLevelUp: (data) => {
        set({ levelUpFlash: true });
        setTimeout(() => set({ levelUpFlash: false }), 1500);
        get().addToast('success', `🎊 LEVEL UP ! Niveau ${data.newLevel} atteint !`);
    },

    // --- Loot drop ---
    handleLootDrop: (data) => {
        for (const drop of data.drops) {
            const rarityEmoji: Record<string, string> = {
                COMMON: '⚪', UNCOMMON: '🟢', RARE: '🔵', EPIC: '🟣', LEGENDARY: '🟠'
            };
            get().addToast('loot', `${rarityEmoji[drop.rarity] || '⚪'} ${drop.name} (${drop.rarity})`);

            // Spawn visual drop (chest for RARE+, bag for others)
            const type = ['RARE', 'EPIC', 'LEGENDARY'].includes(drop.rarity) ? 'chest' : 'bag';
            const colorMap: Record<string, string> = {
                COMMON: '#cbd5e1', UNCOMMON: '#4ade80', RARE: '#60a5fa', EPIC: '#c084fc', LEGENDARY: '#fb923c'
            };
            get().addVisualDrop(type, drop.name, colorMap[drop.rarity] || '#fff');
        }
        if (data.gold > 0) {
            get().addFloatingNumber(`+${data.gold} 💰`, 'gold');
            get().addVisualDrop('gold', `+${data.gold} 💰`, '#ffd700');
        }
    },

    // --- Mort du joueur ---
    handlePlayerDeath: (data) => {
        get().addToast('error', `💀 Vous avez été tué par ${data.killedBy} ! Retour au Tier ${data.newTier}`);
    },
    setInventory: (items) => set({ inventory: items }),
    setEquipmentBonus: (bonus) => set({ equipmentBonus: bonus }),


    // --- Floating Numbers ---
    addFloatingNumber: (value, type) => {
        const id = ++floatingIdCounter;
        const x = 40 + Math.random() * 60;
        const y = 20 + Math.random() * 30;
        set((s) => ({
            floatingNumbers: [...s.floatingNumbers.slice(-15), { id, value, type, x, y }],
        }));
        setTimeout(() => {
            set((s) => ({
                floatingNumbers: s.floatingNumbers.filter(n => n.id !== id),
            }));
        }, 1200);
    },

    // --- Visual Drops ---
    addVisualDrop: (type, label, color = '#fff') => {
        const id = ++floatingIdCounter;
        const x = 50 + (Math.random() * 20 - 10);
        const y = 50 + (Math.random() * 20 - 10);
        set((s) => ({
            visualDrops: [...s.visualDrops, { id, type, label, color, x, y }],
        }));
        setTimeout(() => {
            set((s) => ({
                visualDrops: s.visualDrops.filter((d) => d.id !== id),
            }));
        }, 1500);
    },

    // --- Toasts ---
    addToast: (type, message) => {
        const id = ++toastIdCounter;
        set((s) => ({
            toasts: [...s.toasts.slice(-4), { id, type, message }],
        }));
        setTimeout(() => get().removeToast(id), 4000);
    },
    removeToast: (id) => set((s) => ({
        toasts: s.toasts.filter(t => t.id !== id),
    })),

    // --- Shake ---
    triggerShake: () => {
        set({ shaking: true });
        setTimeout(() => set({ shaking: false }), 300);
    },

    // --- Navigation ---
    setActiveView: (view) => set({ activeView: view }),

    setAuth: (token, playerId) => {
        localStorage.setItem('auth_token', token);
        set({ token, playerId, isAuthenticated: true, activeView: 'combat' });
    },

    logout: () => {
        localStorage.removeItem('auth_token');
        set({ token: null, playerId: null, isAuthenticated: false, activeView: 'auth' });
    },
    setActiveDungeonId: (id) => set({ activeDungeonId: id }),
}));
