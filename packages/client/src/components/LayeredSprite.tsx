import React from 'react';
import './LayeredSprite.css';

export interface SpriteLayer {
    id: string;
    url: string | null;
    zIndex: number;
    slot?: string;
    hueRotate?: number | null;
    brightness?: number | null;
    saturate?: number | null;
}

interface LayeredSpriteProps {
    layers: SpriteLayer[];
    animation: 'idle' | 'attack' | 'attack-sword' | 'attack-bow' | 'attack-staff' | 'hit' | 'dead';
    direction: 'left' | 'right';
    scale?: number;
}

export const LayeredSprite: React.FC<LayeredSpriteProps> = ({
    layers,
    animation,
    direction,
    scale = 1
}) => {
    // Trier par zIndex du plus bas au plus haut
    const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);

    // Regrouper par os (bones) pour l'animation CSS Squelettique
    const boneGroups: Record<string, SpriteLayer[]> = {
        'bone-torso': [],
        'bone-head': [],
        'bone-armL-upper': [],
        'bone-armL-lower': [],
        'bone-armR-upper': [],
        'bone-armR-lower': [],
        'bone-legL-thigh': [],
        'bone-legL-calf': [],
        'bone-legR-thigh': [],
        'bone-legR-calf': [],
        'bone-torso-base': []
    };

    sortedLayers.forEach(layer => {
        if (!layer.slot) boneGroups['bone-torso-base'].push(layer);
        else if (layer.slot === 'BASE_HEAD') boneGroups['bone-head'].push(layer);
        else if (layer.slot === 'BASE_TORSO') boneGroups['bone-torso'].push(layer);
        else if (layer.slot === 'BASE_ARML_UPPER') boneGroups['bone-armL-upper'].push(layer);
        else if (layer.slot === 'BASE_ARML_LOWER') boneGroups['bone-armL-lower'].push(layer);
        else if (layer.slot === 'BASE_ARMR_UPPER') boneGroups['bone-armR-upper'].push(layer);
        else if (layer.slot === 'BASE_ARMR_LOWER') boneGroups['bone-armR-lower'].push(layer);
        else if (layer.slot === 'BASE_LEGL_THIGH') boneGroups['bone-legL-thigh'].push(layer);
        else if (layer.slot === 'BASE_LEGL_CALF') boneGroups['bone-legL-calf'].push(layer);
        else if (layer.slot === 'BASE_LEGR_THIGH') boneGroups['bone-legR-thigh'].push(layer);
        else if (layer.slot === 'BASE_LEGR_CALF') boneGroups['bone-legR-calf'].push(layer);
        else if (['BODY', 'CAPE'].includes(layer.slot)) boneGroups['bone-torso'].push(layer);
        else if (['HEAD'].includes(layer.slot)) boneGroups['bone-head'].push(layer);
        else if (['WEAPON'].includes(layer.slot)) boneGroups['bone-armR-lower'].push(layer);
        else if (['SHIELD'].includes(layer.slot)) boneGroups['bone-armL-lower'].push(layer);
        else if (['LEGS', 'FEET'].includes(layer.slot)) boneGroups['bone-torso'].push(layer);
        else boneGroups['bone-torso'].push(layer); // Slot inconnu va sur le torse
    });

    const renderLayers = (layersInBone: SpriteLayer[]) => {
        return layersInBone.map(layer => {
            if (!layer.url) {
                return <div key={layer.id} className="layered-sprite__layer placeholder" style={{ zIndex: layer.zIndex }} />;
            }
            const filterBase = [];
            if (layer.hueRotate) filterBase.push(`hue-rotate(${layer.hueRotate}deg)`);
            if (layer.brightness) filterBase.push(`brightness(${layer.brightness})`);
            if (layer.saturate) filterBase.push(`saturate(${layer.saturate})`);

            const srcUrl = layer.url.startsWith('/sprites/base') ? layer.url : `http://localhost:3000${layer.url}`;

            return (
                <img
                    key={layer.id}
                    src={srcUrl}
                    alt={layer.id}
                    className="layered-sprite__layer"
                    style={{
                        zIndex: layer.zIndex,
                        filter: filterBase.length > 0 ? filterBase.join(' ') : 'none'
                    }}
                />
            );
        });
    };

    return (
        <div
            className="layered-sprite-wrapper"
            style={{
                transform: `scale(${scale}) ${direction === 'right' ? 'scaleX(-1)' : ''}`,
            }}
        >
            <div className={`layered-sprite layered-sprite--${animation}`}>
                <div className="bone-root">

                    {/* Jambe Arrière (L) */}
                    <div className="bone bone-legL-thigh">
                        {renderLayers(boneGroups['bone-legL-thigh'])}
                        <div className="bone bone-legL-calf">
                            {renderLayers(boneGroups['bone-legL-calf'])}
                        </div>
                    </div>

                    {/* Torso & enfants (Tête, Bras) */}
                    <div className="bone bone-torso">

                        {/* Bras Arrière (L) */}
                        <div className="bone bone-armL-upper">
                            {renderLayers(boneGroups['bone-armL-upper'])}
                            <div className="bone bone-armL-lower">
                                {renderLayers(boneGroups['bone-armL-lower'])}
                            </div>
                        </div>

                        {renderLayers(boneGroups['bone-torso-base'])}
                        {renderLayers(boneGroups['bone-torso'])}

                        <div className="bone bone-head">
                            {renderLayers(boneGroups['bone-head'])}
                        </div>

                        {/* Bras Avant (R) */}
                        <div className="bone bone-armR-upper">
                            {renderLayers(boneGroups['bone-armR-upper'])}
                            <div className="bone bone-armR-lower">
                                {renderLayers(boneGroups['bone-armR-lower'])}
                            </div>
                        </div>
                    </div>

                    {/* Jambe Avant (R) */}
                    <div className="bone bone-legR-thigh">
                        {renderLayers(boneGroups['bone-legR-thigh'])}
                        <div className="bone bone-legR-calf">
                            {renderLayers(boneGroups['bone-legR-calf'])}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
