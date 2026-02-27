import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../store/useGameStore';

export function GuildView() {
    const { t } = useTranslation();
    const [guilds, setGuilds] = useState<any[]>([]);
    const [view, setView] = useState<'list' | 'mine' | 'create'>('list');

    // Formulaire de création
    const [guildName, setGuildName] = useState('');
    const [guildDesc, setGuildDesc] = useState('');

    const playerId = useGameStore(s => s.playerId);
    const addToast = useGameStore(s => s.addToast);

    useEffect(() => {
        fetchGuilds();
        if (playerId) fetchMyGuild();
    }, [playerId]);

    const fetchGuilds = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/social/guilds');
            if (res.ok) setGuilds(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchMyGuild = async () => {
        // En attendant un vrai auth state avec le lien de guilde
        try {
            // fetch(`http://localhost:3000/api/auth/me`); 
        } catch (e) { console.error(e); }
    };

    const createGuild = async () => {
        if (!guildName) return;
        try {
            const res = await fetch('http://localhost:3000/api/social/guild/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ownerId: playerId,
                    name: guildName,
                    description: guildDesc
                })
            });
            if (res.ok) {
                addToast('success', 'Guilde créée !');
                setView('list');
                fetchGuilds();
            } else {
                const err = await res.json();
                addToast('error', err.message);
            }
        } catch (e) { console.error(e); }
    };

    const joinGuild = async (guildId: string) => {
        try {
            const res = await fetch(`http://localhost:3000/api/social/guild/${guildId}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: playerId })
            });
            if (res.ok) {
                addToast('success', 'Vous avez rejoint la guilde !');
                fetchGuilds();
            } else {
                const err = await res.json();
                addToast('error', err.message);
            }
        } catch (e) { console.error(e); }
    };

    return (
        <div className="guild-view" style={{ padding: 'var(--space-md)' }}>
            <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                <button
                    className={`btn ${view === 'list' ? 'btn--gold' : 'btn--ghost'}`}
                    onClick={() => setView('list')}
                >
                    📜 {t('social.listGuilds')}
                </button>
                <button
                    className={`btn ${view === 'create' ? 'btn--gold' : 'btn--ghost'}`}
                    onClick={() => setView('create')}
                >
                    🛡️ {t('social.createGuild')}
                </button>
            </div>

            {view === 'list' && (
                <div className="panel" style={{ padding: 'var(--space-md)' }}>
                    <h3 className="text-pixel" style={{ color: 'var(--gold)', marginBottom: 'var(--space-md)' }}>
                        🏰 {t('social.guildsHall')}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                        {guilds.length === 0 && <p style={{ color: 'var(--text-muted)' }}>{t('social.noGuilds')}</p>}
                        {guilds.map(g => (
                            <div key={g.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: 'var(--space-sm)', background: 'var(--bg-dark)', border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-sm)'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 'bold', color: 'var(--gold)' }}>{g.name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{g._count.members} membres • Lvl {g.level}</div>
                                </div>
                                <button className="btn btn--secondary btn--sm" onClick={() => joinGuild(g.id)}>
                                    {t('social.join')}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {view === 'create' && (
                <div className="panel" style={{ padding: 'var(--space-xl)', maxWidth: '400px', margin: '0 auto' }}>
                    <h3 className="text-pixel" style={{ color: 'var(--gold)', marginBottom: 'var(--space-md)', textAlign: 'center' }}>
                        🔨 {t('social.foundGuild')}
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('social.guildName')}</label>
                            <input
                                type="text"
                                value={guildName}
                                onChange={e => setGuildName(e.target.value)}
                                style={{ width: '100%', padding: 'var(--space-sm)', background: '#000', color: '#fff', border: '1px solid var(--border)' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{t('social.description')}</label>
                            <textarea
                                value={guildDesc}
                                onChange={e => setGuildDesc(e.target.value)}
                                style={{ width: '100%', height: '80px', padding: 'var(--space-sm)', background: '#000', color: '#fff', border: '1px solid var(--border)' }}
                            />
                        </div>
                        <button className="btn btn--gold" onClick={createGuild}>
                            ✨ {t('social.createSubmit')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
