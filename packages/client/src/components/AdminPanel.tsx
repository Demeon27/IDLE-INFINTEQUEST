import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';
import { AdminSkeletonStudio } from './AdminSkeletonStudio';

/**
 * AdminPanel — Tableau de bord réservé aux ADMIN et MODERATOR.
 *
 * Onglets :
 * 1. 🦴 Éditeur Squelette (Dessiner les os du personnage avec décalquage)
 * 2. ⚖️ Banc des Juges (Modérer les créations UGC)
 * 3. ⚙️ Configuration Serveur (Live Config — TODO Phase 7)
 * 4. 👥 Utilisateurs (Promouvoir/Bannir — TODO Phase 7)
 */
export function AdminPanel() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'skeleton' | 'moderation' | 'config' | 'users'>('skeleton');
    const [pendingItems, setPendingItems] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [configs, setConfigs] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const addToast = useGameStore(s => s.addToast);

    // Charger les items en attente
    const fetchPending = async () => {
        setLoading(true);
        try {
            const res = await fetch('http://localhost:3000/api/workshop/pending');
            if (res.ok) {
                const data = await res.json();
                setPendingItems(data);
            }
        } catch (e) {
            console.error('Erreur récupération items en attente:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
        fetchUsers();
        fetchConfig();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/admin/users');
            if (res.ok) setUsers(await res.json());
        } catch (e) { console.error(e); }
    };

    const fetchConfig = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/admin/config');
            if (res.ok) setConfigs(await res.json());
        } catch (e) { console.error(e); }
    };

    const updateRole = async (userId: string, role: string) => {
        try {
            const res = await fetch(`http://localhost:3000/api/admin/users/${userId}/role`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role })
            });
            if (res.ok) {
                addToast('success', 'Rôle mis à jour !');
                fetchUsers();
            }
        } catch (e) { console.error(e); }
    };

    const updateConfigValue = async (key: string, value: string) => {
        try {
            const res = await fetch(`http://localhost:3000/api/admin/config/${key}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value })
            });
            if (res.ok) {
                addToast('success', 'Configuration mise à jour !');
                fetchConfig();
            }
        } catch (e) { console.error(e); }
    };

    // Actions Modérateur
    const moderateItem = async (itemId: string, action: 'approve' | 'reject') => {
        try {
            const res = await fetch(`http://localhost:3000/api/workshop/${itemId}/${action}`, { method: 'POST' });
            if (res.ok) {
                addToast(action === 'approve' ? 'success' : 'error',
                    action === 'approve' ? t('admin.toastApprove') : t('admin.toastReject'));
                fetchPending();
            }
        } catch (e: any) {
            addToast('error', t('admin.toastError', { error: e.message }));
        }
    };

    const tabs = [
        { id: 'skeleton' as const, icon: '🦴', label: t('admin.skeletonEditor') },
        { id: 'moderation' as const, icon: '⚖️', label: t('admin.moderation') },
        { id: 'config' as const, icon: '⚙️', label: t('admin.liveConfig') },
        { id: 'users' as const, icon: '👥', label: t('admin.userManagement') },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)', height: '100%' }}>

            {/* Titre */}
            <div>
                <h2 className="text-pixel" style={{ color: 'var(--fire)', marginBottom: 'var(--space-xs)' }}>
                    {t('admin.title')}
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                    {t('admin.subtitle')}
                </p>
            </div>

            {/* Tabs de navigation */}
            <div style={{
                display: 'flex', gap: 'var(--space-xs)',
                borderBottom: '2px solid var(--border-medium)',
                paddingBottom: 'var(--space-xs)'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={activeTab === tab.id ? 'btn btn--gold btn--sm' : 'btn btn--ghost btn--sm'}
                        style={{ transition: 'all 0.15s ease' }}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* Contenu par onglet */}
            <div style={{ flex: 1, overflowY: 'auto' }}>

                {/* ---- EDITEUR SQUELETTE ---- */}
                {activeTab === 'skeleton' && (
                    <div>
                        <div style={{
                            padding: 'var(--space-md)',
                            marginBottom: 'var(--space-md)',
                            background: 'rgba(196, 74, 26, 0.08)',
                            border: '1px solid var(--fire)',
                            borderRadius: 'var(--radius-md)'
                        }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                                {t('admin.skeletonHint')}
                            </p>
                        </div>
                        <AdminSkeletonStudio />
                    </div>
                )}

                {/* ---- BANC DES JUGES (Modération) ---- */}
                {activeTab === 'moderation' && (
                    <div className="panel" style={{ border: '2px dashed var(--fire)', padding: 'var(--space-md)' }}>
                        <div className="panel__header" style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            marginBottom: 'var(--space-md)'
                        }}>
                            <span className="text-pixel" style={{ fontSize: 'var(--text-xs)', color: 'var(--fire)' }}>
                                {t('admin.pendingItemsTitle')}
                            </span>
                            <button className="btn btn-- ghost btn--sm" onClick={fetchPending} disabled={loading}>
                                🔄 {t('admin.refresh')} {loading && '...'}
                            </button>
                        </div>

                        {pendingItems.length === 0 ? (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 'var(--space-xl)' }}>
                                {t('admin.noPending')}
                            </p>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                {pendingItems.map(item => (
                                    <div key={item.id} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        background: 'var(--bg-dark)', padding: 'var(--space-md)',
                                        borderRadius: 'var(--radius-md)', border: '1px solid var(--border-medium)',
                                        transition: 'border-color 0.15s ease'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                                            <img
                                                src={`http://localhost:3000${item.spriteUrl}`}
                                                alt={item.name}
                                                style={{ width: 64, height: 64, imageRendering: 'pixelated', border: '1px solid #000', background: '#111' }}
                                            />
                                            <div>
                                                <h4 style={{ color: 'var(--gold)', margin: 0, fontSize: 'var(--text-sm)' }}>{item.name}</h4>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                                    {t('admin.itemInfo', { creator: item.creator?.username || '?', slot: item.slot, rarity: item.rarity })}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                            <button className="btn btn--gold btn--sm" onClick={() => moderateItem(item.id, 'approve')}>
                                                {t('admin.approve')}
                                            </button>
                                            <button className="btn btn--danger btn--sm" onClick={() => moderateItem(item.id, 'reject')}>
                                                {t('admin.reject')}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ---- LIVE CONFIG ---- */}
                {activeTab === 'config' && (
                    <div className="panel" style={{ padding: 'var(--space-md)' }}>
                        <h3 className="text-pixel" style={{ color: 'var(--gold)', marginBottom: 'var(--space-md)' }}>
                            ⚙️ {t('admin.liveConfig')}
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                            {configs.map(cfg => (
                                <div key={cfg.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-dark)', padding: 'var(--space-sm)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
                                    <div>
                                        <div style={{ color: 'var(--gold)', fontWeight: 'bold' }}>{cfg.key}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{cfg.description}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                                        <input
                                            type="text"
                                            defaultValue={cfg.value}
                                            onBlur={(e) => updateConfigValue(cfg.key, e.target.value)}
                                            style={{ width: '80px', padding: '4px', textAlign: 'center', background: '#000', color: 'var(--gold)', border: '1px solid var(--border)' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ---- UTILISATEURS ---- */}
                {activeTab === 'users' && (
                    <div className="panel" style={{ padding: 'var(--space-md)' }}>
                        <h3 className="text-pixel" style={{ color: 'var(--gold)', marginBottom: 'var(--space-md)' }}>
                            👥 {t('admin.userManagement')}
                        </h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--text-sm)' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                                        <th style={{ padding: '8px' }}>Joueur</th>
                                        <th style={{ padding: '8px' }}>Rôle</th>
                                        <th style={{ padding: '8px' }}>Lvl</th>
                                        <th style={{ padding: '8px' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id} style={{ borderBottom: '1px solid var(--border-medium)' }}>
                                            <td style={{ padding: '8px' }}>
                                                <div style={{ fontWeight: 'bold' }}>{u.username}</div>
                                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{u.email}</div>
                                            </td>
                                            <td style={{ padding: '8px' }}>
                                                <select
                                                    value={u.role}
                                                    onChange={(e) => updateRole(u.id, e.target.value)}
                                                    style={{ background: 'var(--bg-dark)', color: 'var(--text-light)', border: '1px solid var(--border)', padding: '2px 4px' }}
                                                >
                                                    <option value="USER">USER</option>
                                                    <option value="MODERATOR">MOD</option>
                                                    <option value="ADMIN">ADMIN</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '8px' }}>{u.level}</td>
                                            <td style={{ padding: '8px' }}>
                                                <button className="btn btn--danger btn--sm" onClick={() => addToast('info', 'Ban coming soon')}>Ban</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
