import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import { CreatorShowcase } from './CreatorShowcase';

// ============================================================
// Types repris du serveur
// ============================================================

interface InventoryItem {
    instanceId: string;
    templateId: string;
    name: string;
    description: string | null;
    slot: string;
    rarity: string;
    isEquipped: boolean;
    quantity: number;
    stats: {
        attack: number;
        defense: number;
        hp: number;
        critChance: number;
        dodge: number;
        haste: number;
    };
    isUGC: boolean;
    creatorId: string | null;
    creatorName: string | null;
}

interface EquipmentBonus {
    attack: number;
    defense: number;
    hp: number;
    critChance: number;
    dodge: number;
    haste: number;
}

interface ShopItem {
    templateId: string;
    name: string;
    description: string | null;
    slot: string;
    rarity: string;
    price: number;
    stats: {
        attack: number;
        defense: number;
        hp: number;
        critChance: number;
        dodge: number;
        haste: number;
    };
    isUGC: boolean;
    creatorName: string | null;
}

// ============================================================
// Hooks partagés pour la communication WebSocket
// ============================================================

export function useInventorySocket(socket: React.RefObject<any>) {
    const inventory = useGameStore(s => s.inventory);
    const equipmentBonus = useGameStore(s => s.equipmentBonus);
    const setInventory = useGameStore(s => s.setInventory);
    const setEquipmentBonus = useGameStore(s => s.setEquipmentBonus);
    const [shopItems, setShopItems] = useState<ShopItem[]>([]);
    const [shopTotal, setShopTotal] = useState(0);
    const playerId = useGameStore(s => s.playerId);

    useEffect(() => {
        const sock = socket.current;
        if (!sock) return;

        const handleInventoryData = (data: any) => {
            if (data.inventory) setInventory(data.inventory);
            if (data.equipmentBonus) setEquipmentBonus(data.equipmentBonus);
        };

        const handleCatalog = (data: any) => {
            setShopItems(data.items || []);
            setShopTotal(data.total || 0);
        };

        const handleLootDrop = () => {
            // Un petit délai pour laisser l'opération DB se terminer côté serveur
            setTimeout(() => {
                const pId = useGameStore.getState().playerId;
                if (pId) sock.emit('inventory:get', { userId: pId });
            }, 500);
        };

        sock.on('inventory:data', handleInventoryData);
        sock.on('shop:catalog', handleCatalog);
        sock.on('loot:drop', handleLootDrop);

        return () => {
            sock.off('inventory:data', handleInventoryData);
            sock.off('shop:catalog', handleCatalog);
            sock.off('loot:drop', handleLootDrop);
        };
    }, [socket]);

    useEffect(() => {
        if (playerId && socket.current) {
            socket.current.emit('inventory:get', { userId: playerId });
        }
    }, [playerId, socket]);

    const requestInventory = useCallback(() => {
        if (playerId) socket.current?.emit('inventory:get', { userId: playerId });
    }, [socket, playerId]);

    const equipItem = useCallback((instanceId: string) => {
        if (playerId) socket.current?.emit('inventory:equip', { userId: playerId, instanceId });
    }, [socket, playerId]);

    const unequipItem = useCallback((instanceId: string) => {
        if (playerId) socket.current?.emit('inventory:unequip', { userId: playerId, instanceId });
    }, [socket, playerId]);

    const sellItem = useCallback((instanceId: string, quantity?: number) => {
        if (playerId) socket.current?.emit('inventory:sell', { userId: playerId, instanceId, quantity });
    }, [socket, playerId]);

    const requestCatalog = useCallback((playerTier: number, page?: number) => {
        socket.current?.emit('shop:catalog', { playerTier, page });
    }, [socket]);

    const buyItem = useCallback((templateId: string, quantity?: number) => {
        if (playerId) socket.current?.emit('shop:buy', { userId: playerId, templateId, quantity });
    }, [socket, playerId]);

    return {
        inventory,
        equipmentBonus,
        shopItems,
        shopTotal,
        requestInventory,
        equipItem,
        unequipItem,
        sellItem,
        requestCatalog,
        buyItem,
    };
}

// ============================================================
// Constantes visuelles
// ============================================================

export const RARITY_COLORS: Record<string, string> = {
    COMMON: 'var(--text-secondary)',
    UNCOMMON: 'var(--emerald)',
    RARE: 'var(--mana)',
    EPIC: 'var(--mystic)',
    LEGENDARY: 'var(--gold)',
};

export const SLOT_ICONS: Record<string, string> = {
    HEAD: '🪖', BODY: '🛡️', LEGS: '👖', FEET: '👢',
    WEAPON: '⚔️', SHIELD: '🛡️', RING: '💍', AMULET: '📿', CAPE: '🧣',
};

export const RARITY_LABELS: Record<string, string> = {
    COMMON: 'Commun', UNCOMMON: 'Peu commun', RARE: 'Rare', EPIC: 'Épique', LEGENDARY: 'Légendaire',
};

// ============================================================
// Composant : Vue Inventaire
// ============================================================

export function InventoryView({ inventory, equipmentBonus, onEquip, onUnequip, onSell, onRefresh }: {
    inventory: InventoryItem[];
    equipmentBonus: EquipmentBonus;
    onEquip: (instanceId: string) => void;
    onUnequip: (instanceId: string) => void;
    onSell: (instanceId: string) => void;
    onRefresh: () => void;
}) {
    const { t } = useTranslation();
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [showcaseCreatorId, setShowcaseCreatorId] = useState<string | null>(null);

    useEffect(() => { onRefresh(); }, [onRefresh]);

    const equipped = inventory.filter(i => i.isEquipped);
    const backpack = inventory.filter(i => !i.isEquipped);

    return (
        <div className="inventory-view">
            {/* ---- Equipment Slots ---- */}
            <div className="panel">
                <div className="panel__header">
                    <span className="text-pixel" style={{ fontSize: 'var(--text-xs)', color: 'var(--gold)' }}>
                        ⚔️ {t('inventory.bonus')}
                    </span>
                </div>
                <div className="equipment-grid">
                    {equipped.length === 0 && (
                        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-md)', textAlign: 'center' }}>
                            {t('inventory.emptyHint')}
                        </p>
                    )}
                    {equipped.map(item => (
                        <div
                            key={item.instanceId}
                            className={`item-slot item-slot--${item.rarity.toLowerCase()}`}
                            onClick={() => setSelectedItem(item)}
                        >
                            <span className="item-slot__icon">{SLOT_ICONS[item.slot] || '📦'}</span>
                            <span className="item-slot__name" style={{ color: RARITY_COLORS[item.rarity] }}>
                                {item.name}
                            </span>
                        </div>
                    ))}
                </div>
                {/* Bonus total */}
                <div className="equipment-bonus">
                    {equipmentBonus.attack > 0 && <span className="equipment-bonus__stat">⚔️ +{equipmentBonus.attack} {t('inventory.attack')}</span>}
                    {equipmentBonus.defense > 0 && <span className="equipment-bonus__stat">🛡️ +{equipmentBonus.defense} {t('inventory.defense')}</span>}
                    {equipmentBonus.hp > 0 && <span className="equipment-bonus__stat">❤️ +{equipmentBonus.hp} {t('inventory.hp')}</span>}
                    {equipmentBonus.critChance > 0 && <span className="equipment-bonus__stat">💥 +{(equipmentBonus.critChance * 100).toFixed(1)}% {t('inventory.critChance')}</span>}
                </div>
            </div>

            {/* ---- Sac à dos ---- */}
            <div className="panel">
                <div className="panel__header">
                    <span className="text-pixel" style={{ fontSize: 'var(--text-xs)', color: 'var(--gold)' }}>
                        🎒 {t('inventory.title')} ({backpack.length})
                    </span>
                </div>
                <div className="inventory-grid">
                    {backpack.length === 0 && (
                        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-md)', textAlign: 'center' }}>
                            {t('inventory.emptyHint')}
                        </p>
                    )}
                    {backpack.map(item => (
                        <div
                            key={item.instanceId}
                            className={`item-card item-card--${item.rarity.toLowerCase()}`}
                            onClick={() => setSelectedItem(item)}
                        >
                            <div className="item-card__header">
                                <span>{SLOT_ICONS[item.slot] || '📦'}</span>
                                <span className="item-card__name" style={{ color: RARITY_COLORS[item.rarity] }}>
                                    {item.name}
                                </span>
                                {item.quantity > 1 && <span className="item-card__qty">x{item.quantity}</span>}
                            </div>
                            <div className="item-card__stats">
                                {item.stats.attack > 0 && <span>⚔️{item.stats.attack}</span>}
                                {item.stats.defense > 0 && <span>🛡️{item.stats.defense}</span>}
                                {item.stats.hp > 0 && <span>❤️{item.stats.hp}</span>}
                            </div>
                            <div className="item-card__actions">
                                <button className="btn btn--gold btn--sm" onClick={(e) => { e.stopPropagation(); onEquip(item.instanceId); }}>
                                    {t('inventory.equip')}
                                </button>
                                <button className="btn btn--ghost btn--sm" onClick={(e) => { e.stopPropagation(); onSell(item.instanceId); }}>
                                    {t('inventory.sell')}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ---- Detail Modal ---- */}
            {selectedItem && (
                <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <h3 className="text-pixel" style={{ color: RARITY_COLORS[selectedItem.rarity], fontSize: 'var(--text-sm)' }}>
                            {SLOT_ICONS[selectedItem.slot]} {selectedItem.name}
                        </h3>
                        <span className={`badge badge--${selectedItem.rarity.toLowerCase()}`}>
                            {t(`rarity.${selectedItem.rarity}`)}
                        </span>
                        {selectedItem.isUGC && (
                            <div style={{ marginTop: 'var(--space-sm)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                🔨 {t('workshop.creatorName')} <span style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{selectedItem.creatorName}</span>
                            </div>
                        )}
                        <div style={{ margin: 'var(--space-md) 0' }}>
                            {selectedItem.stats.attack > 0 && <div>⚔️ {t('inventory.attack')}: <strong>+{selectedItem.stats.attack}</strong></div>}
                            {selectedItem.stats.defense > 0 && <div>🛡️ {t('inventory.defense')}: <strong>+{selectedItem.stats.defense}</strong></div>}
                            {selectedItem.stats.hp > 0 && <div>❤️ {t('inventory.hp')}: <strong>+{selectedItem.stats.hp}</strong></div>}
                            {selectedItem.stats.critChance > 0 && <div>💥 {t('inventory.critChance')}: <strong>+{(selectedItem.stats.critChance * 100).toFixed(1)}%</strong></div>}
                            {selectedItem.stats.dodge > 0 && <div>💨 {t('inventory.dodge')}: <strong>+{(selectedItem.stats.dodge * 100).toFixed(1)}%</strong></div>}
                            {selectedItem.stats.haste > 0 && <div>⚡ {t('inventory.haste')}: <strong>+{(selectedItem.stats.haste * 100).toFixed(1)}%</strong></div>}
                        </div>
                        <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                            {selectedItem.isEquipped ? (
                                <button className="btn btn--danger" onClick={() => { onUnequip(selectedItem.instanceId); setSelectedItem(null); }}>
                                    {t('inventory.unequip')}
                                </button>
                            ) : (
                                <button className="btn btn--gold" onClick={() => { onEquip(selectedItem.instanceId); setSelectedItem(null); }}>
                                    {t('inventory.equip')}
                                </button>
                            )}
                            {!selectedItem.isEquipped && (
                                <button className="btn btn--ghost" onClick={() => { onSell(selectedItem.instanceId); setSelectedItem(null); }}>
                                    💰 {t('inventory.sell')}
                                </button>
                            )}
                            <button className="btn" onClick={() => setSelectedItem(null)}>{t('common.close')}</button>
                        </div>
                        {selectedItem.isUGC && selectedItem.creatorId && (
                            <div style={{ marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                                <button className="btn btn--ghost btn--sm" onClick={() => setShowcaseCreatorId(selectedItem.creatorId!)}>
                                    🧑‍🎨 {t('inventory.viewShowcase')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de la Vitrine du Créateur */}
            {showcaseCreatorId && (
                <CreatorShowcase creatorId={showcaseCreatorId} onClose={() => setShowcaseCreatorId(null)} />
            )}
        </div>
    );
}

// ============================================================
// Composant : Vue Boutique
// ============================================================

export function ShopView({ items, playerGold, onBuy, onRefresh }: {
    items: ShopItem[];
    playerGold: number;
    onBuy: (templateId: string) => void;
    onRefresh: () => void;
}) {
    const { t } = useTranslation();
    useEffect(() => { onRefresh(); }, []);

    return (
        <div className="shop-view">
            <div className="panel">
                <div className="panel__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="text-pixel" style={{ fontSize: 'var(--text-xs)', color: 'var(--gold)' }}>
                        {t('shop.title')}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-sm)', color: 'var(--gold)' }}>
                        {t('shop.playerGold', { gold: playerGold.toLocaleString() })}
                    </span>
                </div>
                <div className="shop-grid">
                    {items.length === 0 && (
                        <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', padding: 'var(--space-lg)', textAlign: 'center', gridColumn: '1 / -1' }}>
                            {t('shop.empty')}
                        </p>
                    )}
                    {items.map(item => {
                        const canAfford = playerGold >= item.price;
                        return (
                            <div key={item.templateId} className={`shop-card shop-card--${item.rarity.toLowerCase()}`}>
                                <div className="shop-card__header">
                                    <span>{SLOT_ICONS[item.slot] || '📦'}</span>
                                    <span className="shop-card__name" style={{ color: RARITY_COLORS[item.rarity] }}>
                                        {item.name}
                                    </span>
                                </div>
                                <span className={`badge badge--${item.rarity.toLowerCase()}`} style={{ fontSize: '0.55rem' }}>
                                    {t(`rarity.${item.rarity}`)}
                                </span>
                                <div className="shop-card__stats">
                                    {item.stats.attack > 0 && <span>⚔️{item.stats.attack}</span>}
                                    {item.stats.defense > 0 && <span>🛡️{item.stats.defense}</span>}
                                    {item.stats.hp > 0 && <span>❤️{item.stats.hp}</span>}
                                    {item.stats.critChance > 0 && <span>💥{(item.stats.critChance * 100).toFixed(0)}%</span>}
                                </div>
                                {item.isUGC && item.creatorName && (
                                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                        {t('workshop.creatorName')} {item.creatorName}
                                    </div>
                                )}
                                <button
                                    className={`btn btn--sm ${canAfford ? 'btn--gold' : ''}`}
                                    disabled={!canAfford}
                                    onClick={() => onBuy(item.templateId)}
                                    style={{ marginTop: 'var(--space-sm)', width: '100%' }}
                                >
                                    {t('shop.price', { price: item.price })}
                                </button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
