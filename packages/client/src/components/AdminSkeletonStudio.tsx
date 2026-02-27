import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../store/useGameStore';

export function AdminSkeletonStudio() {
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [color, setColor] = useState<string>('#ffffff');
    const [isDrawing, setIsDrawing] = useState(false);
    // Formulaire d'objet
    const [itemName, setItemName] = useState('');
    const [itemSlot, setItemSlot] = useState('BASE_TORSO');

    // Nouveautés d'édition / Décalquage
    const [canvasSize, setCanvasSize] = useState<number>(64);
    const [bgImage, setBgImage] = useState<string | null>(null);
    const [canvasOpacity, setCanvasOpacity] = useState<number>(0.8);

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
                    rarity: 'COMMON',
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

    const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setBgImage(event.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleSlotChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSlot = e.target.value;
        setItemSlot(newSlot);
        if (newSlot.startsWith('BASE_') || newSlot === 'CAPE') {
            setCanvasSize(64); // Les parties du corps et les grandes capes ont besoin de place
            clearCanvas();
        } else {
            setCanvasSize(32);
            clearCanvas();
        }
    };

    const colors = ['#ffffff', '#000000', '#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#8b4513', '#ffd700',
        '#2a1c24', '#8a5a44', '#b76b4a', '#dfa573', '#f4d29c', 'transparent'];

    return (
        <div className="panel" style={{ display: 'flex', gap: 'var(--space-lg)' }}>

            {/* Colonne Studio Gauche : Le Dessin */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h3 className="text-pixel" style={{ color: 'var(--gold)', marginBottom: 'var(--space-md)' }}>
                    🎨 {t('workshop.canvasTitle', { size: canvasSize })}
                </h3>

                <div style={{
                    position: 'relative',
                    width: '320px',
                    height: '320px',
                    border: '2px solid var(--border)',
                    boxShadow: '0 0 10px rgba(0,0,0,0.5)',
                    background: bgImage
                        ? `url(${bgImage})`
                        : 'url("data:image/svg+xml;utf8,<svg xmlns=\\\'http://www.w3.org/2000/svg\\\' width=\\\'16\\\' height=\\\'16\\\'><rect width=\\\'8\\\' height=\\\'8\\\' fill=\\\'%23222\\\'/><rect x=\\\'8\\\' y=\\\'8\\\' width=\\\'8\\\' height=\\\'8\\\' fill=\\\'%23222\\\'/></svg>")',
                    backgroundSize: bgImage ? 'contain' : 'auto',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}>
                    <canvas
                        ref={canvasRef}
                        width={canvasSize}
                        height={canvasSize}
                        style={{
                            width: '100%',
                            height: '100%',
                            cursor: 'crosshair',
                            imageRendering: 'pixelated',
                            opacity: canvasOpacity
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

                <div style={{ display: 'flex', flexDirection: 'column', width: '320px', marginTop: 'var(--space-md)', gap: 'var(--space-sm)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <label>{t('admin.canvasOpacityLabel')} :</label>
                        <input type="range" min="0" max="1" step="0.1" value={canvasOpacity} onChange={e => setCanvasOpacity(parseFloat(e.target.value))} />
                    </div>
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
                    <label style={{ display: 'block', marginBottom: 'var(--space-xs)', color: 'var(--text-secondary)' }}>{t('admin.skeletonPartLabel')}</label>
                    <select
                        value={itemSlot}
                        onChange={handleSlotChange}
                        style={{ width: '100%', padding: 'var(--space-sm)', background: 'var(--bg-dark)', color: 'var(--text-light)', border: '1px solid var(--border)' }}
                    >
                        <option disabled>────── {t('admin.categoryBaseBody')} (64x64) ──────</option>
                        <option value="BASE_TORSO">{t('slots.BASE_TORSO')}</option>
                        <option value="BASE_HEAD">{t('slots.BASE_HEAD')}</option>
                        <option value="BASE_ARML_UPPER">{t('slots.BASE_ARML_UPPER')}</option>
                        <option value="BASE_ARML_LOWER">{t('slots.BASE_ARML_LOWER')}</option>
                        <option value="BASE_ARMR_UPPER">{t('slots.BASE_ARMR_UPPER')}</option>
                        <option value="BASE_ARMR_LOWER">{t('slots.BASE_ARMR_LOWER')}</option>
                        <option value="BASE_LEGL_THIGH">{t('slots.BASE_LEGL_THIGH')}</option>
                        <option value="BASE_LEGL_CALF">{t('slots.BASE_LEGL_CALF')}</option>
                        <option value="BASE_LEGR_THIGH">{t('slots.BASE_LEGR_THIGH')}</option>
                        <option value="BASE_LEGR_CALF">{t('slots.BASE_LEGR_CALF')}</option>
                    </select>
                </div>

                <div>
                    <label style={{ display: 'block', marginBottom: 'var(--space-xs)', color: 'var(--text-secondary)' }}>{t('admin.bgImageLabel')}</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleBgUpload}
                        style={{ width: '100%', padding: 'var(--space-sm)', background: 'var(--bg-dark)', border: '1px solid var(--border)', color: 'var(--text-light)' }}
                    />
                </div>

                <div style={{ marginTop: 'auto' }}>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}>
                        {t('admin.skeletonDisclaimer')}
                    </p>
                    <button className="btn btn--gold" style={{ width: '100%', marginTop: 'var(--space-sm)' }} onClick={submitUGC}>
                        {t('admin.forgeSkeletonSubmit')}
                    </button>
                </div>
            </div>

        </div>
    );
}
