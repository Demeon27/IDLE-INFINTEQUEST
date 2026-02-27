import { useTranslation } from 'react-i18next';
import { PixelStudio } from './PixelStudio';

export function WorkshopView() {
    const { t } = useTranslation();
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>

            {/* Titre Principal */}
            <div>
                <h2 className="text-pixel" style={{ color: 'var(--gold)', marginBottom: 'var(--space-xs)' }}>
                    {t('workshop.title')}
                </h2>
                <p style={{ color: 'var(--text-muted)' }}>
                    {t('workshop.subtitle')}
                </p>
            </div>

            {/* Studio de Création */}
            <PixelStudio />

            {/* Info */}
            <div className="panel" style={{ padding: 'var(--space-md)', background: 'rgba(212, 168, 85, 0.05)' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', textAlign: 'center' }}>
                    {t('workshop.judgesHint')}
                </p>
            </div>

        </div>
    );
}
