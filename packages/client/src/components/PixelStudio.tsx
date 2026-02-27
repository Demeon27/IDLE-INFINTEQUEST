import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';

export function PixelStudio() {
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [color, setColor] = useState<string>('#ffffff');
    const [isDrawing, setIsDrawing] = useState(false);
    // Formulaire d'objet
    const [itemName, setItemName] = useState('');
    const [itemSlot, setItemSlot] = useState('WEAPON');
    const [itemRarity, setItemRarity] = useState('COMMON');

    const playerId = useGameStore(s => s.playerId);
    const addToast = useGameStore(s => s.addToast);

    // Initialisation du canvas (matrice 32x32 transparente)
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, []);

    const getMousePosition = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();

        let clientX, clientY;
        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = e.clientX;
            clientY = e.clientY;
        }

        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;

        return {
            x: Math.floor((clientX - rect.left) * scaleX),
            y: Math.floor((clientY - rect.top) * scaleY)
        };
    };

    const drawPixel = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { x, y } = getMousePosition(e);

        // On dessine "en gros pixels" s'il fallait simuler 32x32 sur une plus grande résolution,
        // mais ici le canvas lui-même fait 32x32 pour avoir un Base64 très léger.
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 1);
    };

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        drawPixel(e);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        drawPixel(e);
    };

    const handleMouseUp = () => setIsDrawing(false);

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const submitUGC = async () => {
        if (!itemName.trim()) {
            addToast('error', t('workshop.errorName'));
            return;
        }
        if (!playerId) {
            addToast('error', t('workshop.errorProfile'));
            return;
        }

        const canvas = canvasRef.current;
        if (!canvas) return;
        const base64Image = canvas.toDataURL('image/png');

        try {
            const res = await fetch('http://localhost:3000/api/workshop/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    creatorId: playerId,
                    name: itemName,
                    slot: itemSlot,
                    rarity: itemRarity,
                    base64Image,
                    // Stats par défaut selon la rareté (on pourrait laisser le joueur les entrer)
                    attack: itemSlot === 'WEAPON' ? 10 : 0,
                    defense: ['BODY', 'HEAD', 'LEGS', 'SHIELD'].includes(itemSlot) ? 10 : 0,
                    price: 200,
                })
            });

            if (!res.ok) throw new Error('Échec de la soumission');

            addToast('success', t('workshop.successSubmit'));
            setItemName('');
            clearCanvas();
        } catch (e: any) {
            addToast('error', `Erreur de publication : ${e.message}`);
        }
    };

    const colors = ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#8b4513', '#ffd700'];

    return (
        <div className="panel" style={{ display: 'flex', gap: 'var(--space-lg)' }}>

            {/* Colonne Studio Gauche : Le Dessin */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 className="text-pixel" style={{ color: 'var(--gold)', marginBottom: 'var(--space-md)' }}>
                    🎨 {t('workshop.canvasTitle', { size: '32x32' })}
                </h3>

                <div style={{
                    border: '2px solid var(--border)',
                    background: 'url("data:image/svg+xml;utf8,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\' width=\\\'16\\\' height=\\\'16\\\'><rect width=\\\'8\\\' height=\\\'8\\\' fill=\\\'%23222\\\'/><rect x=\\\'8\\\' y=\\\'8\\\' width=\\\'8\\\' height=\\\'8\\\' fill=\\\'%23222\\\'/></svg>")',
                    boxShadow: '0 0 10px rgba(0,0,0,0.5)'
                }}>
                    <canvas
                        ref={canvasRef}
                        width={32}
                        height={32}
                        style={{
                            width: '256px',  /* Agrandi 8x visuellement (32 * 8 = 256) */
                            height: '256px',
                            cursor: 'crosshair',
                            imageRendering: 'pixelated' /* Essentiel pour que les pixels restent nets ! */
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onTouchStart={handleMouseDown}
                        onTouchMove={handleMouseMove}
                        onTouchEnd={handleMouseUp}
                    />
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-xs)', marginTop: 'var(--space-md)', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '320px' }}>
                    {colors.map(c => (
                        <div
                            key={c}
                            onClick={() => setColor(c)}
                            style={{
                                width: 24, height: 24, backgroundColor: c,
                                cursor: 'pointer', border: color === c ? '2px solid var(--gold)' : '2px solid #000'
                            }}
                        />
                    ))}
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        style={{ width: 24, height: 24, padding: 0, border: 'none', cursor: 'crosshair' }}
                    />
                </div>

                <button className="btn btn--ghost btn--sm" style={{ marginTop: 'var(--space-md)' }} onClick={clearCanvas}>
                    {t('workshop.clearCanvas')}
                </button>
            </div>

            {/* Colonne Studio Droite : Le Registre */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: 'var(--space-xs)', color: 'var(--text-secondary)' }}>{t('workshop.itemNameLabel')}</label>
                    <input
                        type="text"
                        value={itemName}
                        onChange={e => setItemName(e.target.value)}
                        placeholder={t('workshop.itemNamePlaceholder')}
                        style={{ width: '100%', padding: 'var(--space-sm)', background: 'var(--bg-dark)', color: 'var(--text-light)', border: '1px solid var(--border)' }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: 'var(--space-xs)', color: 'var(--text-secondary)' }}>{t('workshop.itemTypeLabel')}</label>
                    <select
                        value={itemSlot}
                        onChange={e => setItemSlot(e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-sm)', background: 'var(--bg-dark)', color: 'var(--text-light)', border: '1px solid var(--border)' }}
                    >
                        <option value="WEAPON">{t('slots.WEAPON')}</option>
                        <option value="SHIELD">{t('slots.SHIELD')}</option>
                        <option value="HEAD">{t('slots.HEAD')}</option>
                        <option value="BODY">{t('slots.BODY')}</option>
                        <option value="RING">{t('slots.RING')}</option>
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: 'var(--space-xs)', color: 'var(--text-secondary)' }}>{t('workshop.rarityLabel')}</label>
                    <select
                        value={itemRarity}
                        onChange={e => setItemRarity(e.target.value)}
                        style={{ width: '100%', padding: 'var(--space-sm)', background: 'var(--bg-dark)', color: 'var(--text-light)', border: '1px solid var(--border)' }}
                    >
                        <option value="COMMON">{t('rarity.COMMON')} ({t('rarity.COMMON_COLOR')})</option>
                        <option value="UNCOMMON">{t('rarity.UNCOMMON')} ({t('rarity.UNCOMMON_COLOR')})</option>
                        <option value="RARE">{t('rarity.RARE')} ({t('rarity.RARE_COLOR')})</option>
                        <option value="EPIC">{t('rarity.EPIC')} ({t('rarity.EPIC_COLOR')})</option>
                        <option value="LEGENDARY">{t('rarity.LEGENDARY')} ({t('rarity.LEGENDARY_COLOR')})</option>
                    </select>
                </div>

                <div style={{ marginTop: 'auto' }}>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        {t('workshop.ugcDisclaimer')}
                    </p>
                    <button className="btn btn--gold" style={{ width: '100%', marginTop: 'var(--space-sm)' }} onClick={submitUGC}>
                        {t('workshop.forgeSubmit')}
                    </button>
                </div>
            </div>

        </div>
    );
}
