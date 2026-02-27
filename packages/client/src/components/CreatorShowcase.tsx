import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { RARITY_COLORS, SLOT_ICONS } from './InventoryShop';

export function CreatorShowcase({ creatorId, onClose }: { creatorId: string, onClose: () => void }) {
    const { t } = useTranslation();
    const [data, setData] = useState<{ creator: any, items: any[] } | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`http://localhost:3000/api/workshop/creator/${creatorId}`)
            .then(res => res.json())
            .then(res => {
                setData(res);
                setLoading(false);
            })
            .catch(err => {
                console.error('Erreur', err);
                setLoading(false);
            });
    }, [creatorId]);

    const handleLike = async (templateId: string) => {
        try {
            await fetch(`http://localhost:3000/api/workshop/item/${templateId}/like`, { method: 'POST' });
            // Update local likes visually
            setData(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    items: prev.items.map(i => i.id === templateId ? { ...i, likes: i.likes + 1 } : i)
                };
            });
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000, background: 'rgba(0,0,0,0.8)' }}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ width: '80%', maxWidth: '800px', maxHeight: '80vh', overflowY: 'auto' }}>

                {loading ? (
                    <p style={{ color: 'var(--text-muted)' }}>{t('showcase.loading')}</p>
                ) : !data ? (
                    <p style={{ color: 'var(--fire)' }}>{t('showcase.notFound')}</p>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)', borderBottom: '2px solid var(--border)', paddingBottom: 'var(--space-sm)' }}>
                            <h2 className="text-pixel" style={{ color: 'var(--gold)', margin: 0 }}>
                                {t('showcase.title', { name: data.creator.username })}
                            </h2>
                            <button className="btn btn--ghost" onClick={onClose}>{t('common.close')}</button>
                        </div>

                        {data.items.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)' }}>{t('showcase.empty')}</p>
                        ) : (
                            <div className="shop-grid">
                                {data.items.map((item: any) => (
                                    <div key={item.id} className={`shop-card shop-card--${item.rarity.toLowerCase()}`}>
                                        <div className="shop-card__header">
                                            <span>{SLOT_ICONS[item.slot] || '📦'}</span>
                                            <span className="shop-card__name" style={{ color: RARITY_COLORS[item.rarity] }}>
                                                {item.name}
                                            </span>
                                        </div>
                                        <span className={`badge badge--${item.rarity.toLowerCase()}`} style={{ fontSize: '0.55rem' }}>
                                            {t(`rarity.${item.rarity}`)}
                                        </span>

                                        <img
                                            src={`http://localhost:3000${item.spriteUrl}`}
                                            alt={item.name}
                                            style={{ width: 64, height: 64, imageRendering: 'pixelated', margin: 'var(--space-sm) auto' }}
                                        />

                                        <div className="shop-card__stats" style={{ marginTop: 'var(--space-xs)' }}>
                                            {item.attack > 0 && <span>⚔️{item.attack}</span>}
                                            {item.defense > 0 && <span>🛡️{item.defense}</span>}
                                            {item.hp > 0 && <span>❤️{item.hp}</span>}
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-md)' }}>
                                            <span style={{ fontSize: '1rem', color: 'var(--fire)' }}>❤️ {item.likes}</span>
                                            <button className="btn btn--sm" onClick={() => handleLike(item.id)}>
                                                {t('showcase.like')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
