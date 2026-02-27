import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import { RARITY_COLORS, SLOT_ICONS } from './InventoryShop';

// ============================================================
// Types
// ============================================================

interface AuctionListing {
    id: string;
    price: number;
    quantity: number;
    seller: { id: string; username: string };
    template: {
        id: string;
        name: string;
        slot: string;
        rarity: string;
        attack: number;
        defense: number;
        hp: number;
        isUGC: boolean;
        creatorId: string | null;
        spriteUrl: string | null;
    };
}

// ============================================================
// Hook
// ============================================================

export function useAuctionSocket(socket: React.RefObject<any>) {
    const [listings, setListings] = useState<AuctionListing[]>([]);
    const playerId = useGameStore(s => s.playerId);

    useEffect(() => {
        const sock = socket.current;
        if (!sock) return;

        const handleData = (data: { listings: AuctionListing[] }) => {
            setListings(data.listings);
        };

        sock.on('auction:data', handleData);
        // Demande initiale
        sock.emit('auction:get');

        return () => {
            sock.off('auction:data', handleData);
        };
    }, [socket]);

    const requestListings = useCallback(() => {
        socket.current?.emit('auction:get');
    }, [socket]);

    const sellItem = useCallback((instanceId: string, price: number, quantity: number = 1) => {
        if (playerId) socket.current?.emit('auction:sell', { userId: playerId, instanceId, price, quantity });
    }, [socket, playerId]);

    const buyItem = useCallback((listingId: string) => {
        if (playerId) socket.current?.emit('auction:buy', { userId: playerId, listingId });
    }, [socket, playerId]);

    return { listings, requestListings, sellItem, buyItem };
}

// ============================================================
// Composant : Vue Hôtel de Vente (Auction House)
// ============================================================

export function AuctionView({ inventory, socket }: { inventory: any[], socket: React.RefObject<any> }) {
    const { t } = useTranslation();
    const { listings, requestListings, sellItem, buyItem } = useAuctionSocket(socket);
    const [tab, setTab] = useState<'BUY' | 'SELL'>('BUY');
    const playerGold = useGameStore(s => s.player?.gold || 0);

    // Pour la vente
    const backpack = inventory.filter(i => !i.isEquipped);
    const [sellPrice, setSellPrice] = useState<Record<string, number>>({});

    const handleSell = (item: any) => {
        const price = sellPrice[item.instanceId];
        if (!price || price <= 0) {
            alert(t('auction.invalidPrice'));
            return;
        }
        sellItem(item.instanceId, price, 1);
        // Réinitialiser le form
        setSellPrice(p => ({ ...p, [item.instanceId]: 0 }));
    };

    return (
        <div className="auction-view" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>

            <div className="panel__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-pixel" style={{ fontSize: 'var(--text-lg)', color: 'var(--gold)' }}>
                    {t('auction.title')}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-md)', color: 'var(--gold)' }}>
                    {t('auction.playerGold', { gold: playerGold.toLocaleString() })}
                </span>
            </div>

            {/* Onglets */}
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                <button
                    className={`btn ${tab === 'BUY' ? 'btn--gold' : 'btn--ghost'}`}
                    onClick={() => { setTab('BUY'); requestListings(); }}
                >
                    {t('auction.buyTab')}
                </button>
                <button
                    className={`btn ${tab === 'SELL' ? 'btn--gold' : 'btn--ghost'}`}
                    onClick={() => setTab('SELL')}
                >
                    {t('auction.sellTab')}
                </button>
            </div>

            {/* Panel Principal */}
            <div className="panel">

                {/* ---------- ONGLET ACHAT ---------- */}
                {tab === 'BUY' && (
                    <div className="shop-grid">
                        {listings.length === 0 && (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', gridColumn: '1 / -1', padding: 'var(--space-lg)' }}>
                                {t('auction.noItems')}
                            </p>
                        )}
                        {listings.map(l => {
                            const canAfford = playerGold >= l.price;
                            return (
                                <div key={l.id} className={`shop-card shop-card--${l.template.rarity.toLowerCase()}`}>
                                    <div className="shop-card__header">
                                        <span>{SLOT_ICONS[l.template.slot] || '📦'}</span>
                                        <span className="shop-card__name" style={{ color: RARITY_COLORS[l.template.rarity] }}>
                                            {l.template.name}
                                        </span>
                                    </div>
                                    <span className={`badge badge--${l.template.rarity.toLowerCase()}`} style={{ fontSize: '0.55rem' }}>
                                        {t(`rarity.${l.template.rarity}`)}
                                    </span>

                                    <div className="shop-card__stats" style={{ marginTop: 'var(--space-xs)' }}>
                                        {l.template.attack > 0 && <span>⚔️{l.template.attack}</span>}
                                        {l.template.defense > 0 && <span>🛡️{l.template.defense}</span>}
                                        {l.template.hp > 0 && <span>❤️{l.template.hp}</span>}
                                    </div>

                                    {/* Informations sur le marché */}
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 'var(--space-sm)' }}>
                                        {t('auction.seller')}: <span style={{ color: 'var(--text-light)' }}>{l.seller.username}</span>
                                        {l.quantity > 1 && <span> • {t('auction.quantity')}: {l.quantity}</span>}
                                    </div>
                                    {l.template.isUGC && (
                                        <div style={{ fontSize: '0.6rem', color: 'var(--mystic)', fontStyle: 'italic', marginTop: 2 }}>
                                            {t('auction.ugcHint')}
                                        </div>
                                    )}

                                    <button
                                        className={`btn btn--sm ${canAfford ? 'btn--gold' : ''}`}
                                        disabled={!canAfford}
                                        onClick={() => buyItem(l.id)}
                                        style={{ marginTop: 'var(--space-sm)', width: '100%' }}
                                    >
                                        {t('auction.buyButton', { price: l.price })}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ---------- ONGLET VENTE ---------- */}
                {tab === 'SELL' && (
                    <div className="inventory-grid">
                        {backpack.length === 0 && (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', gridColumn: '1 / -1', padding: 'var(--space-lg)' }}>
                                {t('auction.emptyBackpack')}
                            </p>
                        )}
                        {backpack.map(item => (
                            <div key={item.instanceId} className={`item-card item-card--${item.rarity.toLowerCase()}`} style={{ display: 'flex', flexDirection: 'column' }}>
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

                                <div style={{ marginTop: 'auto', paddingTop: 'var(--space-sm)' }}>
                                    <div style={{ display: 'flex', gap: 'var(--space-xs)', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
                                        <input
                                            type="number"
                                            placeholder={t('auction.pricePlaceholder')}
                                            value={sellPrice[item.instanceId] || ''}
                                            onChange={e => setSellPrice(p => ({ ...p, [item.instanceId]: parseInt(e.target.value) || 0 }))}
                                            style={{ flex: 1, padding: '4px', background: 'var(--bg-dark)', color: 'var(--gold)', border: '1px solid var(--border)', width: '100%' }}
                                            min="1"
                                        />
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>💰</span>
                                    </div>
                                    <button
                                        className="btn btn--danger btn--sm"
                                        style={{ width: '100%' }}
                                        onClick={() => handleSell(item)}
                                    >
                                        {t('auction.sellButton')}
                                    </button>
                                    <div style={{ fontSize: '0.55rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 4 }}>
                                        {t('auction.taxHint')}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}
