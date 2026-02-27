import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { useTranslation } from 'react-i18next';

export function LevelUpOverlay() {
    const { t } = useTranslation();
    const levelUpFlash = useGameStore(s => s.levelUpFlash);
    const player = useGameStore(s => s.player);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (levelUpFlash) {
            setVisible(true);
            const timer = setTimeout(() => setVisible(false), 3000);
            return () => clearTimeout(timer);
        }
    }, [levelUpFlash]);

    if (!visible || !player) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            background: 'radial-gradient(circle, rgba(212,168,85,0.2) 0%, transparent 70%)',
            animation: 'fade-out 3s forwards'
        }}>
            <div style={{
                fontSize: '4rem',
                filter: 'drop-shadow(0 0 20px var(--gold))',
                animation: 'bounce-in 0.5s var(--ease-bounce)'
            }}>
                🎊
            </div>

            <h1 className="text-pixel" style={{
                color: 'var(--gold)',
                fontSize: '3rem',
                margin: '20px 0',
                textShadow: '0 0 10px rgba(0,0,0,0.8), 0 0 20px var(--gold)',
                letterSpacing: '4px'
            }}>
                LEVEL UP!
            </h1>

            <div className="text-pixel" style={{
                color: '#fff',
                fontSize: '1.5rem',
                background: 'rgba(0,0,0,0.6)',
                padding: '10px 30px',
                borderRadius: 'var(--radius-full)',
                border: '2px solid var(--gold)',
                animation: 'slide-up 0.5s both 0.2s'
            }}>
                {t('sidebar.level', { level: player.level })}
            </div>

            <style>{`
                @keyframes bounce-in {
                    0% { transform: scale(0); }
                    70% { transform: scale(1.2); }
                    100% { transform: scale(1); }
                }
                @keyframes fade-out {
                    0% { opacity: 0; }
                    10% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { opacity: 0; }
                }
                @keyframes slide-up {
                    from { transform: translateY(50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
