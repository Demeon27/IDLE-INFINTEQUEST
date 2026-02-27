import { useTranslation } from 'react-i18next';

const LANGUAGES = [
    { code: 'fr', label: '🇫🇷 Français', flag: '🇫🇷' },
    { code: 'en', label: '🇬🇧 English', flag: '🇬🇧' },
    // Facile d'ajouter d'autres langues ici :
    // { code: 'es', label: '🇪🇸 Español', flag: '🇪🇸' },
    // { code: 'de', label: '🇩🇪 Deutsch', flag: '🇩🇪' },
];

export function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const socket = (window as any).gameSocket; // Temporary hack to get socket or pass it as prop

    const currentLang = i18n.language?.substring(0, 2) || 'fr';

    return (
        <div className="language-switcher" style={{
            display: 'flex',
            gap: 4,
            padding: '4px',
        }}>
            {LANGUAGES.map(lang => (
                <button
                    key={lang.code}
                    onClick={() => {
                        i18n.changeLanguage(lang.code);
                        if (socket) {
                            socket.current?.emit('profile:update', { language: lang.code });
                        }
                    }}
                    title={lang.label}
                    style={{
                        background: currentLang === lang.code ? 'var(--bg-light)' : 'transparent',
                        border: currentLang === lang.code ? '1px solid var(--gold)' : '1px solid transparent',
                        borderRadius: 'var(--radius-sm)',
                        padding: '2px 6px',
                        fontSize: 16,
                        cursor: 'pointer',
                        opacity: currentLang === lang.code ? 1 : 0.5,
                        transition: 'all 0.2s ease',
                    }}
                >
                    {lang.flag}
                </button>
            ))}
        </div>
    );
}
