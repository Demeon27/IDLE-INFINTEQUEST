import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import { LayeredSprite } from './LayeredSprite';
import type { SpriteLayer } from './LayeredSprite';

export function HeroCard() {
    const { t } = useTranslation();
    const player = useGameStore(s => s.player);
    const inventory = useGameStore(s => s.inventory);
    const bonus = useGameStore(s => s.equipmentBonus);
    const stats = useGameStore(s => s.stats);

    if (!player) return null;

    // --- Génération des couches d'équipement (Fidèle à CombatScene) ---
    const SLOT_ZINDEX: Record<string, number> = {
        'CAPE': 5, 'BODY': 10, 'LEGS': 20, 'FEET': 25,
        'HEAD': 30, 'SHIELD': 15, 'WEAPON': 40
    };

    const playerLayers: SpriteLayer[] = [
        { id: 'base_legL_thigh', url: '/sprites/base/base_legL_thigh.svg', zIndex: 10, slot: 'BASE_LEGL_THIGH' },
        { id: 'base_legL_calf', url: '/sprites/base/base_legL_calf.svg', zIndex: 10, slot: 'BASE_LEGL_CALF' },
        { id: 'base_legR_thigh', url: '/sprites/base/base_legR_thigh.svg', zIndex: 10, slot: 'BASE_LEGR_THIGH' },
        { id: 'base_legR_calf', url: '/sprites/base/base_legR_calf.svg', zIndex: 10, slot: 'BASE_LEGL_CALF' },
        { id: 'base_armL_upper', url: '/sprites/base/base_armL_upper.svg', zIndex: 15, slot: 'BASE_ARML_UPPER' },
        { id: 'base_armL_lower', url: '/sprites/base/base_armL_lower.svg', zIndex: 15, slot: 'BASE_ARML_LOWER' },
        { id: 'base_torso', url: '/sprites/base/base_torso.svg', zIndex: 10, slot: 'BASE_TORSO' },
        { id: 'base_head', url: '/sprites/base/base_head.svg', zIndex: 30, slot: 'BASE_HEAD' },
        { id: 'base_armR_upper', url: '/sprites/base/base_armR_upper.svg', zIndex: 40, slot: 'BASE_ARMR_UPPER' },
        { id: 'base_armR_lower', url: '/sprites/base/base_armR_lower.svg', zIndex: 40, slot: 'BASE_ARMR_LOWER' }
    ];

    inventory.filter(i => i.isEquipped).forEach(item => {
        if (item.spriteUrl) {
            playerLayers.push({
                id: item.instanceId,
                url: item.spriteUrl,
                zIndex: SLOT_ZINDEX[item.slot] || 50,
                hueRotate: item.hueRotate,
                brightness: item.brightness,
                saturate: item.saturate,
                slot: item.slot
            });
        }
    });

    return (
        <div className="hero-card panel panel--parchment" style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', minHeight: '500px' }}>
            {/* Côté Gauche : Avatar HD */}
            <div style={{ flex: '0 0 350px', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', borderRight: '1px solid var(--border-medium)' }}>
                <div style={{ transform: 'scale(1.8)', transformOrigin: 'center' }}>
                    <LayeredSprite layers={playerLayers} animation="idle" scale={1} direction="right" />
                </div>
                <div style={{ position: 'absolute', bottom: '20px', textAlign: 'center', width: '100%' }}>
                    <h2 className="text-pixel" style={{ color: 'var(--gold)', margin: 0, fontSize: 'var(--text-lg)' }}>{player.username}</h2>
                    <div style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginTop: '5px' }}>Lvl {player.level} Adventurer</div>
                </div>
            </div>

            {/* Côté Droit : Statistiques */}
            <div style={{ flex: 1, padding: 'var(--space-xl)' }}>
                <h3 className="text-pixel" style={{ color: 'var(--text-accent)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-lg)' }}>
                    📜 {t('stats.attributes')}
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
                    {/* Colonne 1 : Combat */}
                    <div className="panel" style={{ padding: 'var(--space-md)', background: 'rgba(0,0,0,0.1)' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: 'var(--gold)' }}>⚔️ COMBAT</h4>
                        <StatRow label={t('stats.attack')} value={player.attack} bonus={bonus.attack} />
                        <StatRow label={t('stats.crit')} value={`${(player.critChance * 100).toFixed(1)}%`} bonus={`${(bonus.critChance * 100).toFixed(1)}%`} />
                        <StatRow label={t('stats.haste')} value={`${(player.haste * 100).toFixed(1)}%`} bonus={`${(bonus.haste * 100).toFixed(1)}%`} />
                    </div>

                    {/* Colonne 2 : Survie */}
                    <div className="panel" style={{ padding: 'var(--space-md)', background: 'rgba(0,0,0,0.1)' }}>
                        <h4 style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: 'var(--emerald)' }}>🛡️ SURVIE</h4>
                        <StatRow label={t('stats.hp')} value={player.maxHp} bonus={bonus.hp} />
                        <StatRow label={t('stats.defense')} value={player.defense} bonus={bonus.defense} />
                        <StatRow label={t('stats.dodge')} value={`${(player.dodge * 100).toFixed(1)}%`} bonus={`${(bonus.dodge * 100).toFixed(1)}%`} />
                    </div>
                </div>

                <div style={{ marginTop: 'var(--space-xl)' }}>
                    <h3 className="text-pixel" style={{ color: 'var(--text-accent)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-lg)' }}>
                        🏆 {t('stats.achievements')}
                    </h3>
                    <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                        <Achievement icon="🩸" label="Total Damage" value={stats.totalDamageDealt.toLocaleString()} />
                        <Achievement icon="💀" label="Monsters Killed" value={stats.totalMonstersKilled.toLocaleString()} />
                        <Achievement icon="🖱️" label="Total Clicks" value={stats.totalClicks.toLocaleString()} />
                    </div>
                </div>

                <div style={{ marginTop: 'auto', paddingTop: 'var(--space-xl)', textAlign: 'right' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Account ID: {player.id}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatRow({ label, value, bonus }: { label: string, value: any, bonus: any }) {
    const isBonusPositive = parseFloat(bonus) > 0 || bonus > 0;
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
            <span>
                {value}
                {isBonusPositive && <span style={{ color: 'var(--emerald)', fontSize: '0.8rem', marginLeft: '5px' }}>+{bonus}</span>}
            </span>
        </div>
    );
}

function Achievement({ icon, label, value }: { icon: string, label: string, value: string }) {
    return (
        <div className="panel" style={{ padding: 'var(--space-sm)', flex: 1, textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '5px' }}>{icon}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--gold)' }}>{value}</div>
        </div>
    );
}
