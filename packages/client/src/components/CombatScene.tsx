import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import { LayeredSprite } from './LayeredSprite';
import type { SpriteLayer } from './LayeredSprite';

// Mapping spriteKey → chemin de sprite monstre
const MONSTER_SPRITES: Record<string, string> = {
    'monster_basic': '/sprites/monsters/skeleton.svg',
    'monster_undead': '/sprites/monsters/skeleton.svg',
    'monster_demon': '/sprites/monsters/skeleton.svg',   // TODO: sprite démon
    'monster_dragon': '/sprites/monsters/skeleton.svg',  // TODO: sprite dragon
    'monster_eldritch': '/sprites/monsters/skeleton.svg', // TODO: sprite eldritch
};

/**
 * CombatScene — La zone de combat principale.
 *
 * Affiche le monstre, le joueur, les barres de HP, les dégâts flottants.
 * Le clic sur la zone envoie une attaque au serveur.
 */
export function CombatScene({ onAttack, equippedItems = [] }: { onAttack: () => void, equippedItems?: any[] }) {
    const { t } = useTranslation();
    const combat = useGameStore(s => s.combat);
    const player = useGameStore(s => s.player);
    const stats = useGameStore(s => s.stats);
    const floatingNumbers = useGameStore(s => s.floatingNumbers);
    const visualDrops = useGameStore(s => s.visualDrops);
    const shaking = useGameStore(s => s.shaking);
    const levelUpFlash = useGameStore(s => s.levelUpFlash);

    const monster = combat.monster;

    // Pourcentage de HP du monstre
    const monsterHpPercent = monster ? Math.max(0, (monster.hp / monster.maxHp) * 100) : 0;
    const playerHpPercent = player ? Math.max(0, (player.hp / player.maxHp) * 100) : 0;
    const xpPercent = player ? (player.xp / player.xpToNext) * 100 : 0;

    // Couleur de la barre de HP du monstre selon le %
    const monsterHpColor = monsterHpPercent > 60 ? 'var(--emerald)' :
        monsterHpPercent > 30 ? 'var(--ember)' : 'var(--fire)';

    const [playerAnim, setPlayerAnim] = useState<'idle' | 'attack' | 'attack-sword' | 'attack-bow' | 'attack-staff' | 'hit' | 'dead'>('idle');
    const [monsterAnim, setMonsterAnim] = useState<'idle' | 'attack' | 'hit' | 'dead'>('idle');
    const [critFlash, setCritFlash] = useState(false);


    // Détermine le type d'animation d'attaque selon l'arme équipée
    const getAttackAnim = (): 'attack' | 'attack-sword' | 'attack-bow' | 'attack-staff' => {
        const weapon = equippedItems.find(i => i.slot === 'WEAPON' || i.slot === 'WEAPON_MAIN');
        if (!weapon) return 'attack-sword'; // Par défaut: épée (même à mains nues pour le style)
        const name = (weapon.name || '').toLowerCase();
        if (name.includes('arc') || name.includes('bow')) return 'attack-bow';
        if (name.includes('bâton') || name.includes('staff') || name.includes('sceptre')) return 'attack-staff';
        return 'attack-sword'; // Épée, hache, dague → animation de slash
    };

    // Réagit à la prise de dégâts
    useEffect(() => {
        if (shaking && playerAnim !== 'attack' && playerAnim !== 'attack-sword') {
            setPlayerAnim('hit');
            setTimeout(() => setPlayerAnim('idle'), 400);
        }
    }, [shaking]);

    // Attack Player -> Hit Monster
    const handleAttackWrapper = () => {
        onAttack();
        const atkAnim = getAttackAnim();
        setPlayerAnim(atkAnim);
        setMonsterAnim('hit');

        // Chance de flash visuel si crit (basé sur le store ou localement pour le feedback immédiat)
        if (player && Math.random() < player.critChance) {
            setCritFlash(true);
            setTimeout(() => setCritFlash(false), 200);
        }

        setTimeout(() => setPlayerAnim('idle'), 550);
        setTimeout(() => setMonsterAnim('idle'), 400);
    };

    // --- Génération des couches d'équipement (Joueur) ---
    const SLOT_ZINDEX: Record<string, number> = {
        'CAPE': 5, 'BODY': 10, 'LEGS': 20, 'FEET': 25,
        'HEAD': 30, 'SHIELD': 15, 'WEAPON': 40
    };

    const playerLayers: SpriteLayer[] = [
        { id: 'base_legL_thigh', url: '/sprites/base/base_legL_thigh.svg', zIndex: 10, slot: 'BASE_LEGL_THIGH' },
        { id: 'base_legL_calf', url: '/sprites/base/base_legL_calf.svg', zIndex: 10, slot: 'BASE_LEGL_CALF' },
        { id: 'base_legR_thigh', url: '/sprites/base/base_legR_thigh.svg', zIndex: 10, slot: 'BASE_LEGR_THIGH' },
        { id: 'base_legR_calf', url: '/sprites/base/base_legR_calf.svg', zIndex: 10, slot: 'BASE_LEGR_CALF' },
        { id: 'base_armL_upper', url: '/sprites/base/base_armL_upper.svg', zIndex: 15, slot: 'BASE_ARML_UPPER' },
        { id: 'base_armL_lower', url: '/sprites/base/base_armL_lower.svg', zIndex: 15, slot: 'BASE_ARML_LOWER' },
        { id: 'base_torso', url: '/sprites/base/base_torso.svg', zIndex: 10, slot: 'BASE_TORSO' },
        { id: 'base_head', url: '/sprites/base/base_head.svg', zIndex: 30, slot: 'BASE_HEAD' },
        { id: 'base_armR_upper', url: '/sprites/base/base_armR_upper.svg', zIndex: 40, slot: 'BASE_ARMR_UPPER' },
        { id: 'base_armR_lower', url: '/sprites/base/base_armR_lower.svg', zIndex: 40, slot: 'BASE_ARMR_LOWER' }
    ];

    equippedItems.forEach(item => {
        if (item.spriteUrl) {
            playerLayers.push({
                id: item.instanceId,
                url: item.spriteUrl,
                zIndex: SLOT_ZINDEX[item.slot] || 50,
                hueRotate: item.hueRotate,
                brightness: item.brightness,
                saturate: item.saturate,
            });
        }
    });

    // URL du sprite monstre actuel
    const monsterSpriteUrl = monster ? (MONSTER_SPRITES[monster.spriteKey] || '/sprites/monsters/skeleton.svg') : null;

    return (
        <div className={`combat-arena ${shaking ? 'shake' : ''} ${critFlash ? 'crit-flash' : ''} ${levelUpFlash ? 'level-up-flash' : ''}`}>

            {/* ---- Zone de combat globale avec HUD ---- */}
            <div className="combat-scene__arena" onClick={handleAttackWrapper} style={{
                backgroundImage: 'url(/sprites/bg/combat_bg.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center bottom',
                imageRendering: 'pixelated'
            }}>

                {/* --- HUD DE COMBAT (Style Fighting Game) --- */}
                <div className="combat-scene__hud">
                    {/* HUD Joueur (Gauche) */}
                    <div className="hud-side hud-player">
                        <div className="hud-header">
                            <div className="hud-portrait">
                                {/* Portrait placeholder ou avatar du joueur ici */}
                                👤
                            </div>
                            <div className="hud-name-bar">
                                <span className="hud-name">{player?.username ?? 'HÉRO'}</span>
                                <span className="hud-hp-text">{Math.round(playerHpPercent)}%</span>
                            </div>
                        </div>
                        <div className="hud-hp-track">
                            <div
                                className="hud-hp-fill hud-hp-fill--player"
                                style={{ width: `${playerHpPercent}%` }}
                            />
                        </div>
                        <div className="hud-sub">
                            Lvl {player?.level ?? 1} • {player?.xp ?? 0}/{player?.xpToNext ?? 10} XP
                        </div>
                    </div>

                    {/* Centre (VS / Tier) */}
                    <div className="hud-center">
                        <div className="hud-vs">{t('combat.vs')}</div>
                        <div className="hud-tier">TIER {combat.currentTier}</div>
                    </div>

                    {/* HUD Monstre (Droite) */}
                    {monster && (
                        <div className="hud-side hud-monster">
                            <div className="hud-header">
                                <div className="hud-name-bar">
                                    <span className="hud-hp-text">{Math.round(monsterHpPercent)}%</span>
                                    <span className="hud-name">{monster.name}</span>
                                </div>
                                <div className="hud-portrait">
                                    <img src={monsterSpriteUrl!} alt={monster.name} style={{ width: 32, height: 32, imageRendering: 'pixelated', objectFit: 'contain' }} />
                                </div>
                            </div>
                            <div className="hud-hp-track hud-hp-track--reverse">
                                <div
                                    className="hud-hp-fill hud-hp-fill--monster"
                                    style={{
                                        width: `${monsterHpPercent}%`,
                                        backgroundColor: monsterHpColor
                                    }}
                                />
                            </div>
                            <div className="hud-sub" style={{ textAlign: 'right' }}>
                                {monster.hp.toLocaleString()} / {monster.maxHp.toLocaleString()} HP
                            </div>
                        </div>
                    )}
                    {!monster && (
                        <div className="hud-side hud-monster hud-waiting">
                            {t('combat.searchingEnemy')}
                        </div>
                    )}
                </div>

                {/* --- ZONE D'AFFRONTEMENT (Les Sprites) --- */}
                <div className="combat-scene__stage">

                    {/* Visual Drops */}
                    {visualDrops.map(drop => (
                        <div
                            key={drop.id}
                            className="visual-drop"
                            style={{ left: `${drop.x}%`, top: `${drop.y}%` }}
                        >
                            <span className="visual-drop__icon" style={{ color: drop.color, textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                                {drop.type === 'gold' ? '💰' : drop.type === 'chest' ? '🎁' : '🎒'}
                            </span>
                            <span className="visual-drop__label" style={{ color: drop.color, borderColor: drop.color }}>
                                {drop.label}
                            </span>
                        </div>
                    ))}

                    {/* --- JOUEUR (Gauche) --- */}
                    {player && (
                        <div className="combat-fighter combat-fighter--player">
                            <LayeredSprite
                                layers={playerLayers}
                                animation={player.hp <= 0 ? 'dead' : playerAnim}
                                direction="right"
                                scale={3.5}
                            />
                        </div>
                    )}

                    {/* --- MONSTRE (Droite) --- */}
                    {monster && (
                        <div className={`combat-fighter combat-fighter--monster ${monsterAnim === 'hit' ? 'monster-hit-flash' : ''} ${monster.hp <= 0 ? 'monster-dead' : ''}`}>
                            <img
                                src={monsterSpriteUrl!}
                                alt={monster.name}
                                className="monster-sprite"
                                style={{
                                    width: 180,
                                    height: 180,
                                    imageRendering: 'pixelated',
                                    objectFit: 'contain',
                                    filter: monsterAnim === 'hit' ? 'brightness(2) sepia(0.6) drop-shadow(0 0 8px rgba(255,50,50,0.8))' : 'drop-shadow(2px 4px 6px rgba(0,0,0,0.6))',
                                    transition: 'filter 0.15s ease-out, transform 0.15s ease-out',
                                    transform: monsterAnim === 'hit' ? 'translateX(8px) scale(0.95)' : (monster.hp <= 0 ? 'translateY(20px) scale(0.8)' : 'none'),
                                    opacity: monster.hp <= 0 ? 0.4 : 1,
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Floating Damage Numbers */}
                {floatingNumbers.map(n => (
                    <span
                        key={n.id}
                        className={`floating-number floating-number--${n.type}`}
                        style={{ left: `${n.x}%`, top: `${n.y}%`, zIndex: 50 }}
                    >
                        {n.value}
                    </span>
                ))}

                {/* Message si pas de monstre */}
                {!monster && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                        <span style={{ fontSize: 40, opacity: 0.5 }}>⏳</span>
                        <p className="text-pixel" style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-md)' }}>
                            {t('combat.waiting')}
                        </p>
                    </div>
                )}

                {/* Indication de clic */}
                <div className="combat-scene__click-hint" style={{ bottom: 20 }}>
                    {t('combat.clickHint')}
                </div>
            </div>

            {/* ---- Barres du joueur ---- */}
            {player && (
                <div className="combat-scene__player-bars">
                    <div style={{ marginBottom: 'var(--space-sm)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>❤️ {t('combat.hp')}</span>
                            <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                                {player.hp.toLocaleString()} / {player.maxHp.toLocaleString()}
                            </span>
                        </div>
                        <div className="progress-bar" style={{ height: 14 }}>
                            <div className="progress-bar__fill progress-bar__fill--hp" style={{ width: `${playerHpPercent}%` }} />
                        </div>
                    </div>
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>⭐ {t('combat.xp')}</span>
                            <span style={{ fontSize: 'var(--text-xs)', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                                {player.xp.toLocaleString()} / {player.xpToNext.toLocaleString()}
                            </span>
                        </div>
                        <div className="progress-bar progress-bar--slim">
                            <div className="progress-bar__fill progress-bar__fill--xp" style={{ width: `${xpPercent}%` }} />
                        </div>
                    </div>
                </div>
            )}

            {/* ---- Stats rapides ---- */}
            {player && (
                <div className="combat-scene__quick-stats">
                    <div className="combat-scene__stat">
                        <span className="combat-scene__stat-label">{t('combat.atk')}</span>
                        <span className="combat-scene__stat-value">{player.attack}</span>
                    </div>
                    <div className="combat-scene__stat">
                        <span className="combat-scene__stat-label">{t('combat.def')}</span>
                        <span className="combat-scene__stat-value">{player.defense}</span>
                    </div>
                    <div className="combat-scene__stat">
                        <span className="combat-scene__stat-label">{t('combat.crit')}</span>
                        <span className="combat-scene__stat-value">{(player.critChance * 100).toFixed(1)}%</span>
                    </div>
                    <div className="combat-scene__stat">
                        <span className="combat-scene__stat-label">{t('combat.dps')}</span>
                        <span className="combat-scene__stat-value">{stats.dps}</span>
                    </div>
                </div>
            )}
        </div>
    );
}

