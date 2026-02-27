import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';

export function ProfileView({ socket }: { socket: any }) {
    const { t, i18n } = useTranslation();
    const player = useGameStore(s => s.player);
    const [username, setUsername] = useState(player?.username || '');
    const [language, setLanguage] = useState(i18n.language);
    const [loading, setLoading] = useState(false);

    const handleUpdate = () => {
        if (!username.trim()) return;
        setLoading(true);

        // Update via WebSocket for immediate game effect
        socket.current?.emit('profile:update', {
            username,
            language
        });

        // Update local language
        i18n.changeLanguage(language);

        setTimeout(() => setLoading(false), 500);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)', maxWidth: '600px', margin: '0 auto' }}>

            <div className="panel panel--parchment" style={{ padding: 'var(--space-xl)' }}>
                <h2 className="text-pixel" style={{ color: 'var(--gold)', marginBottom: 'var(--space-lg)' }}>
                    👤 {t('common.settings')}
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>

                    {/* Nom du Héros */}
                    <div className="form-group">
                        <label className="label">Nom du Héros</label>
                        <input
                            type="text"
                            className="input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Entrez votre nouveau nom..."
                        />
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                            C'est le nom qui s'affichera dans la Taverne et sur votre carte de héros.
                        </p>
                    </div>

                    {/* Langue Préférée */}
                    <div className="form-group">
                        <label className="label">{t('common.language')}</label>
                        <select
                            className="input"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            style={{ cursor: 'pointer' }}
                        >
                            <option value="fr">Français (🇫🇷)</option>
                            <option value="en">English (🇬🇧)</option>
                        </select>
                    </div>

                    {/* Section Future Options */}
                    <div style={{
                        marginTop: 'var(--space-md)',
                        padding: 'var(--space-md)',
                        background: 'rgba(0,0,0,0.1)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px dashed var(--border-medium)'
                    }}>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                            ✨ D'autres options (Visibilité, Notifications, Thèmes) arriveront bientôt.
                        </p>
                    </div>

                    <button
                        onClick={handleUpdate}
                        className="btn btn--gold btn--pixel"
                        style={{ marginTop: 'var(--space-lg)' }}
                        disabled={loading}
                    >
                        {loading ? '...' : t('common.save')}
                    </button>
                </div>
            </div>

            {/* Info Compte */}
            <div className="panel" style={{ padding: 'var(--space-md)', fontSize: '0.8rem', opacity: 0.8 }}>
                <p><strong>Statut :</strong> <span style={{ color: 'var(--emerald)' }}>Aventurier Vérifié</span></p>
                <p><strong>Rôle :</strong> {player?.role || 'Joueur'}</p>
            </div>
        </div>
    );
}
