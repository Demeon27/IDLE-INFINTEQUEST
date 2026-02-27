import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import { useSocket } from '../hooks/useSocket';

export function DungeonView() {
    const { t } = useTranslation();
    const [dungeons, setDungeons] = useState<any[]>([]);
    const { socket } = useSocket();
    const activeDungeonId = useGameStore(s => s.activeDungeonId); // On pourra l'ajouter au store plus tard

    useEffect(() => {
        fetchDungeons();
    }, []);

    const fetchDungeons = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/dungeons');
            if (res.ok) setDungeons(await res.json());
        } catch (e) { console.error(e); }
    };

    const enterDungeon = (id: string) => {
        socket.current?.emit('dungeon:enter', { dungeonId: id });
    };

    const leaveDungeon = () => {
        socket.current?.emit('dungeon:leave');
    };

    return (
        <div className="dungeon-view" style={{ padding: 'var(--space-md)' }}>
            <h2 className="text-pixel" style={{ color: 'var(--gold)', marginBottom: 'var(--space-lg)' }}>
                🗝️ {t('nav.dungeon')}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
                {dungeons.map(d => (
                    <div key={d.id} className="panel" style={{
                        overflow: 'hidden', display: 'flex', flexDirection: 'column',
                        border: d.id === activeDungeonId ? '2px solid var(--gold)' : '1px solid var(--border)'
                    }}>
                        <div style={{
                            height: '120px', background: `url(${d.backgroundUrl}) center/cover`,
                            position: 'relative', display: 'flex', alignItems: 'flex-end', padding: 'var(--space-sm)'
                        }}>
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }} />
                            <div style={{ position: 'relative', fontWeight: 'bold', color: '#fff' }}>{d.name}</div>
                        </div>

                        <div style={{ padding: 'var(--space-md)', flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>{d.description}</p>

                            <div style={{ display: 'flex', gap: 'var(--space-md)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                <span>👾 {d.minionTemplate.name}</span>
                                <span>💀 {d.bossTemplate.name}</span>
                            </div>

                            <div style={{ marginTop: 'auto', paddingTop: 'var(--space-md)' }}>
                                {activeDungeonId === d.id ? (
                                    <button className="btn btn--fire btn--full" onClick={leaveDungeon}>
                                        🏃 {t('common.leave')}
                                    </button>
                                ) : (
                                    <button className="btn btn--gold btn--full" onClick={() => enterDungeon(d.id)}>
                                        ⚔️ {t('common.enter')}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {dungeons.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {t('social.noDungeons')} {/* TODO: Add specifically for dungeons */}
                </div>
            )}
        </div>
    );
}
