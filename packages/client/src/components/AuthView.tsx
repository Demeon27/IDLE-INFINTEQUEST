import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';

export function AuthView() {
    const { t } = useTranslation();
    const setAuth = useGameStore(s => s.setAuth);
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Handle initial Google token check (if redirected back)
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
            // In a real app, we'd fetch the user profile here with the token
            // For now, we'll store it and hope the WebSocket handles the rest
            setAuth(token, 'loading...');
            window.history.replaceState({}, document.title, "/");
        }
    }, [setAuth]);

    const handleClassicSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
        const body = mode === 'login'
            ? { username, password }
            : { username, email, password };

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            let data;
            const text = await res.text();
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error(`Server error: ${res.status} ${res.statusText}`);
            }

            if (!res.ok) {
                throw new Error(data.message || 'Authentication failed');
            }

            setAuth(data.accessToken, data.user.id);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSocialLogin = (provider: 'google' | 'facebook') => {
        window.location.href = `/api/auth/${provider}`;
    };

    return (
        <div className="auth-container" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
            padding: 'var(--space-xl)'
        }}>
            <div className="panel panel--parchment" style={{
                width: '100%',
                maxWidth: '450px',
                padding: 'var(--space-xl)',
                boxShadow: 'var(--shadow-xl)',
                position: 'relative',
                border: '4px solid var(--wood-medium)'
            }}>
                <div style={{ textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
                    <h1 className="text-pixel" style={{ color: 'var(--gold)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-sm)' }}>
                        ⚔️ IDLE QUEST
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)' }}>
                        {mode === 'login' ? t('common.loginClassic') : t('common.registerClassic')}
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(196, 74, 26, 0.15)',
                        border: '1px solid var(--fire)',
                        color: 'var(--fire)',
                        padding: 'var(--space-md)',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: 'var(--space-md)',
                        fontSize: 'var(--text-sm)',
                        textAlign: 'center'
                    }}>
                        ⚠️ {error}
                    </div>
                )}

                <form onSubmit={handleClassicSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <div className="form-group">
                        <label className="label">{t('workshop.itemNameLabel')}</label>
                        <input
                            type="text"
                            className="input"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    {mode === 'register' && (
                        <div className="form-group">
                            <label className="label">Email</label>
                            <input
                                type="email"
                                className="input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <div className="form-group">
                        <label className="label">Password</label>
                        <input
                            type="password"
                            className="input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="btn btn--gold btn--pixel" style={{ width: '100%', marginTop: 'var(--space-md)' }} disabled={loading}>
                        {loading ? '...' : (mode === 'login' ? 'LOGIN' : 'JOIN THE QUEST')}
                    </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', margin: 'var(--space-xl) 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-medium)' }}></div>
                    <span style={{ padding: '0 10px', color: 'var(--text-muted)', fontSize: '0.7rem' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'var(--border-medium)' }}></div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    <button
                        onClick={() => handleSocialLogin('google')}
                        className="btn btn--ghost"
                        style={{ width: '100%', background: '#fff', color: '#333' }}
                    >
                        <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" alt="G" style={{ width: 18, height: 18, marginRight: 10 }} />
                        {t('common.loginWithGoogle')}
                    </button>

                    <button
                        onClick={() => handleSocialLogin('facebook')}
                        className="btn btn--ghost"
                        style={{ width: '100%', background: '#1877F2', color: '#fff', borderColor: '#1877F2' }}
                    >
                        <span style={{ fontSize: 18, fontWeight: 'bold', marginRight: 10 }}>f</span>
                        {t('common.loginWithFacebook')}
                    </button>
                </div>

                <div style={{ marginTop: 'var(--space-xl)', textAlign: 'center' }}>
                    <button
                        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                        style={{ background: 'none', border: 'none', color: 'var(--gold)', cursor: 'pointer', fontSize: 'var(--text-sm)', textDecoration: 'underline' }}
                    >
                        {mode === 'login' ? t('common.registerClassic') : t('common.loginClassic')}
                    </button>
                </div>
            </div>
        </div>
    );
}
