import { useState } from 'react';

/**
 * Design Showcase — Page de démonstration du Design System "Taverne Pixel Art"
 * Affiche tous les composants pour validation visuelle avant de construire les features.
 */
export function DesignShowcase() {
    const [modalOpen, setModalOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [activeNav, setActiveNav] = useState('combat');
    const [toasts, setToasts] = useState<Array<{ id: number; type: string; message: string }>>([]);
    let toastId = 0;

    const addToast = (type: string, message: string) => {
        const id = ++toastId;
        setToasts(prev => [...prev, { id: Date.now(), type, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    };

    const navItems = [
        { id: 'combat', icon: '⚔️', label: 'Combat' },
        { id: 'inventory', icon: '🎒', label: 'Inventaire' },
        { id: 'shop', icon: '🏪', label: 'Boutique' },
        { id: 'workshop', icon: '🔨', label: 'Atelier' },
        { id: 'guild', icon: '🏰', label: 'Guilde' },
        { id: 'tavern', icon: '🍺', label: 'La Taverne' },
        { id: 'dungeon', icon: '🗝️', label: 'Donjons' },
        { id: 'leaderboard', icon: '🏆', label: 'Classements' },
    ];

    return (
        <div className="app-layout">
            {/* ========== SIDEBAR ========== */}
            <aside className="sidebar">
                <div className="sidebar__logo">
                    <h1>⚔️ IDLE<br />INFINITE<br />QUEST</h1>
                </div>
                <nav className="sidebar__nav">
                    {navItems.map(item => (
                        <a
                            key={item.id}
                            className={`sidebar__link ${activeNav === item.id ? 'sidebar__link--active' : ''}`}
                            onClick={() => setActiveNav(item.id)}
                        >
                            <span className="sidebar__link-icon">{item.icon}</span>
                            <span>{item.label}</span>
                        </a>
                    ))}
                </nav>
                <div className="sidebar__footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 'var(--radius-md)',
                            background: 'var(--bg-medium)', border: '2px solid var(--gold)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '16px'
                        }}>🧙</div>
                        <div>
                            <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>DarkMage42</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Niveau 73</div>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ========== HEADER ========== */}
            <header className="header">
                <div className="header__stats">
                    <div className="header__stat">
                        <span className="header__stat-icon">❤️</span>
                        <div>
                            <div className="header__stat-value">2,847 / 3,200</div>
                            <div className="header__stat-label">HP</div>
                        </div>
                    </div>
                    <div className="header__stat">
                        <span className="header__stat-icon">⭐</span>
                        <div>
                            <div className="header__stat-value">12,450 / 18,900</div>
                            <div className="header__stat-label">XP</div>
                        </div>
                    </div>
                    <div className="header__stat">
                        <span className="header__stat-icon">💰</span>
                        <div>
                            <div className="header__stat-value" style={{ color: 'var(--gold)' }}>24,893</div>
                            <div className="header__stat-label">Or</div>
                        </div>
                    </div>
                    <div className="header__stat">
                        <span className="header__stat-icon">💎</span>
                        <div>
                            <div className="header__stat-value" style={{ color: 'var(--purple)' }}>150</div>
                            <div className="header__stat-label">Cristaux</div>
                        </div>
                    </div>
                </div>
                <div className="header__actions">
                    <button className="btn btn--ghost btn--sm" onClick={() => addToast('info', 'Notifications ouvertes')}>
                        🔔 <span style={{ fontSize: 'var(--text-xs)', background: 'var(--fire)', borderRadius: 'var(--radius-full)', padding: '1px 6px' }}>3</span>
                    </button>
                    <button className="btn btn--ghost btn--sm">⚙️</button>
                </div>
            </header>

            {/* ========== CONTENT ========== */}
            <main className="content">
                <h2 style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--text-lg)', color: 'var(--gold)', marginBottom: 'var(--space-xl)', textShadow: '0 0 12px rgba(212, 168, 85, 0.25)' }}>
                    📜 Design System — Taverne Pixel Art
                </h2>

                {/* -------- Section: Palette -------- */}
                <section style={{ marginBottom: 'var(--space-xxxl)' }}>
                    <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--text-xs)', color: 'var(--text-accent)', marginBottom: 'var(--space-base)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        🎨 Palette de Couleurs
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 'var(--space-md)' }}>
                        {[
                            { name: 'BG Darkest', color: '#0d0b08' },
                            { name: 'BG Darker', color: '#1a1510' },
                            { name: 'BG Dark', color: '#2a2318' },
                            { name: 'BG Medium', color: '#3d3425' },
                            { name: 'Bois Sombre', color: '#2c1e0f' },
                            { name: 'Bois Moyen', color: '#4a3322' },
                            { name: 'Bois Clair', color: '#6b4c2f' },
                            { name: 'Or', color: '#d4a855' },
                            { name: 'Or Clair', color: '#e8c46a' },
                            { name: 'Feu', color: '#c44a1a' },
                            { name: 'Braise', color: '#d4682a' },
                            { name: 'Émeraude', color: '#4a8a3a' },
                            { name: 'Mana', color: '#4a6a9a' },
                            { name: 'Mystique', color: '#7a4a8a' },
                            { name: 'Pierre', color: '#5a5a52' },
                            { name: 'Fer Forgé', color: '#6a6a62' },
                        ].map(c => (
                            <div key={c.name} style={{ textAlign: 'center' }}>
                                <div style={{
                                    width: '100%', height: 60, borderRadius: 'var(--radius-md)',
                                    background: c.color, border: '1px solid var(--border-medium)',
                                    boxShadow: 'var(--shadow-sm)'
                                }} />
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: 'var(--space-xs)' }}>{c.name}</div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{c.color}</div>
                            </div>
                        ))}
                    </div>
                </section>

                <hr className="divider" />

                {/* -------- Section: Typographie -------- */}
                <section style={{ marginBottom: 'var(--space-xxxl)' }}>
                    <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--text-xs)', color: 'var(--text-accent)', marginBottom: 'var(--space-base)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        ✒️ Typographie
                    </h3>
                    <div className="panel panel--parchment" style={{ padding: 'var(--space-xl)' }}>
                        <p style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--text-hero)', color: 'var(--gold)', marginBottom: 'var(--space-lg)' }}>
                            Pixel Art Hero
                        </p>
                        <p style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--text-xxl)', color: 'var(--text-primary)', marginBottom: 'var(--space-md)' }}>
                            Titre de Page
                        </p>
                        <p style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--text-sm)', color: 'var(--text-accent)', marginBottom: 'var(--space-xl)' }}>
                            Press Start 2P (Titres, Noms, Labels)
                        </p>
                        <hr className="divider" />
                        <p style={{ fontSize: 'var(--text-xl)', fontWeight: 700, marginBottom: 'var(--space-sm)' }}>Inter — Heading Large (700)</p>
                        <p style={{ fontSize: 'var(--text-lg)', fontWeight: 600, marginBottom: 'var(--space-sm)' }}>Inter — Heading Medium (600)</p>
                        <p style={{ fontSize: 'var(--text-md)', fontWeight: 500, marginBottom: 'var(--space-sm)' }}>Inter — Body Large (500)</p>
                        <p style={{ fontSize: 'var(--text-base)', marginBottom: 'var(--space-sm)' }}>Inter — Body (400) — Le voyageur s'arrêta devant la porte de la taverne...</p>
                        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>Inter — Small — Texte secondaire et descriptions</p>
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>Inter — Extra Small — Labels et métadonnées</p>
                        <hr className="divider" />
                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-base)' }}>JetBrains Mono — 2,847 HP | +15 ATK | 24,893 Gold</p>
                    </div>
                </section>

                <hr className="divider" />

                {/* -------- Section: Boutons -------- */}
                <section style={{ marginBottom: 'var(--space-xxxl)' }}>
                    <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--text-xs)', color: 'var(--text-accent)', marginBottom: 'var(--space-base)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        🪵 Boutons
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                        <button className="btn">Bois Standard</button>
                        <button className="btn btn--gold">🏆 Action Dorée</button>
                        <button className="btn btn--danger">🔥 Danger</button>
                        <button className="btn btn--ghost">👻 Fantôme</button>
                        <button className="btn" disabled>Désactivé</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                        <button className="btn btn--pixel btn--gold">⚔️ COMBATTRE</button>
                        <button className="btn btn--pixel">🛒 ACHETER</button>
                        <button className="btn btn--pixel btn--danger">💀 FUIR</button>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', alignItems: 'center' }}>
                        <button className="btn btn--sm">Petit</button>
                        <button className="btn">Normal</button>
                        <button className="btn btn--lg">Grand</button>
                    </div>
                </section>

                <hr className="divider" />

                {/* -------- Section: Panneaux -------- */}
                <section style={{ marginBottom: 'var(--space-xxxl)' }}>
                    <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--text-xs)', color: 'var(--text-accent)', marginBottom: 'var(--space-base)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        📋 Panneaux
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-lg)' }}>
                        <div className="panel">
                            <div className="panel__header">
                                <span className="panel__title">📊 Statistiques</span>
                                <button className="btn btn--ghost btn--sm">⚙️</button>
                            </div>
                            <div className="panel__body">
                                <div className="tooltip__stat"><span>Attaque</span><span className="tooltip__stat-value">+142</span></div>
                                <div className="tooltip__stat"><span>Défense</span><span className="tooltip__stat-value">+87</span></div>
                                <div className="tooltip__stat"><span>Critique</span><span className="tooltip__stat-value">12.5%</span></div>
                                <div className="tooltip__stat"><span>Esquive</span><span className="tooltip__stat-value">8.2%</span></div>
                                <div className="tooltip__stat"><span>Hâte</span><span className="tooltip__stat-value">+15%</span></div>
                            </div>
                        </div>

                        <div className="panel panel--parchment">
                            <div className="panel__header">
                                <span className="panel__title">📜 Quête Active</span>
                            </div>
                            <div className="panel__body">
                                <p style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-sm)', fontWeight: 600 }}>
                                    La Crypte des Âmes Perdues
                                </p>
                                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-base)' }}>
                                    Descendez au Tier 45 et triomphez du Gardien de l'Abîme...
                                </p>
                                <div className="progress-bar" style={{ marginBottom: 'var(--space-sm)' }}>
                                    <div className="progress-bar__fill progress-bar__fill--xp" style={{ width: '65%' }}></div>
                                    <span className="progress-bar__label">32 / 50 monstres</span>
                                </div>
                            </div>
                        </div>

                        <div className="panel panel--stone">
                            <div className="panel__header">
                                <span className="panel__title">🏰 Zone de Combat</span>
                            </div>
                            <div className="panel__body">
                                <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: 'var(--space-xs)' }}>
                                    Forêt Maudite — Tier 42
                                </p>
                                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-md)' }}>
                                    DPS actuel : 1,247/s
                                </p>
                                <div className="progress-bar" style={{ marginBottom: 'var(--space-sm)' }}>
                                    <div className="progress-bar__fill progress-bar__fill--hp" style={{ width: '38%' }}></div>
                                    <span className="progress-bar__label">1,520 / 4,000 HP</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <hr className="divider" />

                {/* -------- Section: Inputs -------- */}
                <section style={{ marginBottom: 'var(--space-xxxl)' }}>
                    <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--text-xs)', color: 'var(--text-accent)', marginBottom: 'var(--space-base)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        ✏️ Champs de Saisie
                    </h3>
                    <div style={{ maxWidth: 450 }}>
                        <div className="form-group">
                            <label className="label">Nom du Héros</label>
                            <input
                                className="input"
                                type="text"
                                placeholder="Entrez le nom de votre personnage..."
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label className="label">Description de l'item</label>
                            <textarea className="input" placeholder="Décrivez votre création pixel art..." />
                        </div>
                        <div className="form-group">
                            <label className="label">Champ en erreur</label>
                            <input className="input input--error" type="text" value="Nom trop court" readOnly />
                        </div>
                    </div>
                </section>

                <hr className="divider" />

                {/* -------- Section: Barres de Progression -------- */}
                <section style={{ marginBottom: 'var(--space-xxxl)' }}>
                    <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--text-xs)', color: 'var(--text-accent)', marginBottom: 'var(--space-base)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        📊 Barres de Progression
                    </h3>
                    <div style={{ maxWidth: 500, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        <div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>HP (Points de Vie)</div>
                            <div className="progress-bar">
                                <div className="progress-bar__fill progress-bar__fill--hp" style={{ width: '72%' }}></div>
                                <span className="progress-bar__label">2,847 / 3,200</span>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>XP (Expérience)</div>
                            <div className="progress-bar">
                                <div className="progress-bar__fill progress-bar__fill--xp" style={{ width: '45%' }}></div>
                                <span className="progress-bar__label">12,450 / 18,900</span>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>Mana</div>
                            <div className="progress-bar">
                                <div className="progress-bar__fill progress-bar__fill--mana" style={{ width: '88%' }}></div>
                                <span className="progress-bar__label">440 / 500</span>
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', marginBottom: 'var(--space-xs)' }}>Barre fine (slim)</div>
                            <div className="progress-bar progress-bar--slim">
                                <div className="progress-bar__fill progress-bar__fill--xp" style={{ width: '60%' }}></div>
                            </div>
                        </div>
                    </div>
                </section>

                <hr className="divider" />

                {/* -------- Section: Badges de Rareté -------- */}
                <section style={{ marginBottom: 'var(--space-xxxl)' }}>
                    <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--text-xs)', color: 'var(--text-accent)', marginBottom: 'var(--space-base)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        💎 Raretés & Badges
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', alignItems: 'center' }}>
                        <span className="badge badge--common">Commun</span>
                        <span className="badge badge--uncommon">Peu Commun</span>
                        <span className="badge badge--rare">Rare</span>
                        <span className="badge badge--epic">Épique</span>
                        <span className="badge badge--legendary">Légendaire</span>
                    </div>

                    <h4 style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>Slots d'Inventaire (avec lueurs de rareté)</h4>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                        <div className="item-slot">
                            <span style={{ fontSize: 20 }}>🗡️</span>
                        </div>
                        <div className="item-slot item-slot--common">
                            <span style={{ fontSize: 20 }}>🛡️</span>
                        </div>
                        <div className="item-slot item-slot--uncommon">
                            <span style={{ fontSize: 20 }}>🏹</span>
                        </div>
                        <div className="item-slot item-slot--rare">
                            <span style={{ fontSize: 20 }}>⚔️</span>
                        </div>
                        <div className="item-slot item-slot--epic">
                            <span style={{ fontSize: 20 }}>🔮</span>
                        </div>
                        <div className="item-slot item-slot--legendary">
                            <span style={{ fontSize: 20 }}>👑</span>
                        </div>
                        <div className="item-slot">
                            {/* vide */}
                        </div>
                        <div className="item-slot">
                            {/* vide */}
                        </div>
                    </div>
                </section>

                <hr className="divider" />

                {/* -------- Section: Modale -------- */}
                <section style={{ marginBottom: 'var(--space-xxxl)' }}>
                    <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--text-xs)', color: 'var(--text-accent)', marginBottom: 'var(--space-base)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        🪟 Modale (Fenêtre Ornée)
                    </h3>
                    <button className="btn btn--gold" onClick={() => setModalOpen(true)}>
                        📜 Ouvrir la Modale
                    </button>
                </section>

                <hr className="divider" />

                {/* -------- Section: Toasts -------- */}
                <section style={{ marginBottom: 'var(--space-xxxl)' }}>
                    <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--text-xs)', color: 'var(--text-accent)', marginBottom: 'var(--space-base)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        🔔 Notifications (Toasts)
                    </h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
                        <button className="btn btn--sm" onClick={() => addToast('success', '✅ Item équipé avec succès !')}>Succès</button>
                        <button className="btn btn--sm" onClick={() => addToast('error', '❌ Pas assez d\'or !')}>Erreur</button>
                        <button className="btn btn--sm" onClick={() => addToast('warning', '⚠️ Votre personnage est en danger !')}>Warning</button>
                        <button className="btn btn--sm" onClick={() => addToast('info', 'ℹ️ Maintenance prévue à 03h00')}>Info</button>
                        <button className="btn btn--gold btn--sm" onClick={() => addToast('loot', '🎉 Épée du Dragon Ancien (Légendaire) !')}>Loot !</button>
                    </div>
                </section>

                <hr className="divider" />

                {/* -------- Section: VFX & Animations -------- */}
                <section style={{ marginBottom: 'var(--space-xxxl)' }}>
                    <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--text-xs)', color: 'var(--text-accent)', marginBottom: 'var(--space-base)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        ✨ VFX & Animations
                    </h3>
                    <div style={{ display: 'flex', gap: 'var(--space-xxl)', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                        <div style={{ position: 'relative', width: 200, height: 120, background: 'var(--bg-dark)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-medium)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <DamageDemo />
                        </div>
                        <div>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>Screen Shake :</p>
                            <ShakeDemo />
                        </div>
                        <div>
                            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>Level Up Flash :</p>
                            <LevelUpDemo />
                        </div>
                    </div>
                </section>

                {/* -------- Section: Tooltip inline -------- */}
                <section style={{ marginBottom: 'var(--space-xxxl)' }}>
                    <h3 style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--text-xs)', color: 'var(--text-accent)', marginBottom: 'var(--space-base)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        💬 Tooltips (exemples statiques)
                    </h3>
                    <div style={{ display: 'flex', gap: 'var(--space-xl)', flexWrap: 'wrap' }}>
                        {[
                            { rarity: 'common', name: 'Épée Rouillée', desc: 'Une vieille lame oubliée.', stats: [['ATK', '+5']] },
                            { rarity: 'rare', name: 'Arc de Cristal', desc: 'Façonné dans la grotte de l\'Étoile Nocturne.', stats: [['ATK', '+42'], ['CRIT', '+8.5%']] },
                            { rarity: 'legendary', name: 'Couronne du Roi Déchu', desc: 'Murmure des anciennes gloires...', stats: [['DEF', '+120'], ['HP', '+500'], ['Hâte', '+25%']] },
                        ].map(item => (
                            <div key={item.name} className={`tooltip tooltip--${item.rarity}`} style={{ position: 'relative' }}>
                                <div className="tooltip__title">{item.name}</div>
                                <div className="tooltip__desc">{item.desc}</div>
                                <hr className="divider" />
                                {item.stats.map(([label, value]) => (
                                    <div key={label} className="tooltip__stat">
                                        <span>{label}</span>
                                        <span className="tooltip__stat-value">{value}</span>
                                    </div>
                                ))}
                                <div style={{ marginTop: 'var(--space-sm)', fontSize: 'var(--text-xs)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                    Créé par <span style={{ color: 'var(--gold)' }}>PixelMaster_99</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

            </main>

            {/* ========== MODAL ========== */}
            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal__header">
                            <h2 className="modal__title">🏪 Boutique Royale</h2>
                            <button className="modal__close" onClick={() => setModalOpen(false)}>✕</button>
                        </div>
                        <div className="modal__body">
                            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-base)' }}>
                                Bienvenue dans la boutique de la Taverne, voyageur. Contemplez nos plus belles marchandises forgées par les artisans du royaume.
                            </p>
                            <div style={{ display: 'flex', gap: 'var(--space-md)', flexWrap: 'wrap' }}>
                                {[
                                    { icon: '⚔️', name: 'Lame Vaillante', price: '1,200', rarity: 'uncommon' },
                                    { icon: '🛡️', name: 'Bouclier de Fer', price: '800', rarity: 'common' },
                                    { icon: '🔮', name: 'Orbe Mystique', price: '5,400', rarity: 'epic' },
                                ].map(item => (
                                    <div key={item.name} className="panel" style={{ flex: '1', minWidth: 140 }}>
                                        <div className="panel__body" style={{ textAlign: 'center' }}>
                                            <div className={`item-slot item-slot--${item.rarity}`} style={{ margin: '0 auto var(--space-sm)' }}>
                                                <span style={{ fontSize: 24 }}>{item.icon}</span>
                                            </div>
                                            <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--text-xs)', color: `var(--rarity-${item.rarity})`, marginBottom: 'var(--space-xs)' }}>
                                                {item.name}
                                            </div>
                                            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-xs)', color: 'var(--gold)' }}>
                                                💰 {item.price}
                                            </div>
                                            <button className="btn btn--gold btn--sm" style={{ marginTop: 'var(--space-sm)', width: '100%' }}>
                                                Acheter
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="modal__footer">
                            <button className="btn btn--ghost" onClick={() => setModalOpen(false)}>Fermer</button>
                            <button className="btn btn--gold">💰 Tout Acheter</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ========== TOASTS ========== */}
            <div className="toast-container">
                {toasts.map(toast => (
                    <div key={toast.id} className={`toast toast--${toast.type}`}>
                        {toast.message}
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ---------- Sous-composants de démo VFX ---------- */

function DamageDemo() {
    const [numbers, setNumbers] = useState<Array<{ id: number; x: number; y: number; value: string; type: string }>>([]);

    const handleClick = () => {
        const isCrit = Math.random() > 0.7;
        const dmg = isCrit ? Math.floor(Math.random() * 500) + 500 : Math.floor(Math.random() * 200) + 50;
        setNumbers(prev => [...prev, {
            id: Date.now(),
            x: 40 + Math.random() * 120,
            y: 40 + Math.random() * 40,
            value: isCrit ? `💥 ${dmg}` : `${dmg}`,
            type: isCrit ? 'crit' : 'damage',
        }]);
        setTimeout(() => setNumbers(prev => prev.slice(1)), 1200);
    };

    return (
        <div style={{ width: '100%', height: '100%', cursor: 'pointer' }} onClick={handleClick}>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', textAlign: 'center', paddingTop: 'var(--space-md)' }}>
                Cliquez ici !
            </p>
            <p style={{ fontFamily: 'var(--font-pixel)', fontSize: '20px', textAlign: 'center', marginTop: 'var(--space-sm)' }}>🐉</p>
            {numbers.map(n => (
                <span
                    key={n.id}
                    className={`floating-number floating-number--${n.type}`}
                    style={{ left: n.x, top: n.y }}
                >
                    {n.value}
                </span>
            ))}
        </div>
    );
}

function ShakeDemo() {
    const [shaking, setShaking] = useState(false);
    return (
        <div
            className={shaking ? 'shake' : ''}
            style={{
                width: 100, height: 60, background: 'var(--bg-dark)',
                border: '2px solid var(--border-medium)', borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', cursor: 'pointer'
            }}
            onClick={() => { setShaking(true); setTimeout(() => setShaking(false), 300); }}
        >
            ⚔️
        </div>
    );
}

function LevelUpDemo() {
    const [leveling, setLeveling] = useState(false);
    return (
        <div
            className={leveling ? 'level-up-flash' : ''}
            style={{
                width: 100, height: 60, background: 'var(--bg-dark)',
                border: '2px solid var(--gold)', borderRadius: 'var(--radius-md)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
            }}
            onClick={() => { setLeveling(true); setTimeout(() => setLeveling(false), 1500); }}
        >
            <span style={{ fontFamily: 'var(--font-pixel)', fontSize: 'var(--text-xs)', color: 'var(--gold)' }}>LVL UP</span>
        </div>
    );
}
