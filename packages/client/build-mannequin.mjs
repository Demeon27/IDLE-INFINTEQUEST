import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = path.join(__dirname, 'public', 'sprites', 'base');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

// ============================================================
// Palette – fidèle à la référence Slynyrd  
// 4 tons peau + outline + ombre rosée + sous-vêtement
// ============================================================
const colorMap = {
    '0': 'transparent',
    '1': '#6b3a3a', // Outline (brun-rosé sombre)
    '2': '#a0614e', // Ombre profonde
    '3': '#c48468', // Ombre claire / peau médiane
    '4': '#e0aa82', // Peau base
    '5': '#f0c8a0', // Highlight peau
    '6': '#5a3040', // Sous-vêtement outline
    '7': '#7a4858', // Sous-vêtement base
    '8': '#f5d8b8', // Highlight max (reflets)
    '9': '#884838', // Ombre muscles profonde
};

// ============================================================
// Utilitaires SVG — Chaque pièce est un SVG 64×64 indépendant
// ============================================================
function createSvg(grid) {
    let rects = '';
    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
            const char = grid[y][x];
            if (char !== '0' && char !== ' ' && colorMap[char]) {
                rects += `<rect x="${x}" y="${y}" width="1.05" height="1.05" fill="${colorMap[char]}" />`;
            }
        }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" shape-rendering="crispEdges">${rects}</svg>`;
}

function makeGrid() {
    return Array.from({ length: 64 }, () => '0'.repeat(64).split(''));
}

function draw(grid, startX, startY, art) {
    for (let y = 0; y < art.length; y++) {
        for (let x = 0; x < art[y].length; x++) {
            if (art[y][x] !== '0' && art[y][x] !== ' ') {
                const gx = startX + x;
                const gy = startY + y;
                if (gx >= 0 && gx < 64 && gy >= 0 && gy < 64) {
                    grid[gy][gx] = art[y][x];
                }
            }
        }
    }
}

// ============================================================
// PIXEL ART — Basé sur la référence Slynyrd
//
// Le personnage fait ~40px de haut (y:10 → y:50), centré sur x:32
// Proportions : tête 8px, torse 14px, jambes 18px
// Vue ¾ légère — épaule droite plus visible
// ============================================================

// --- TÊTE (9×8px) — Crâne arrondi, yeux, nez, mâchoire ---
// Positionnée à x:27, y:10 → centre du cou à ~x:31, y:18
const headArt = [
    "  11111  ",
    " 1555541 ",
    "155884441",
    "154484441",
    "143134431",
    " 1444431 ",
    "  14431  ",
    "   131   ",
];

// --- TORSE (11×14px) — Épaules larges, pectoraux, taille ---
// Pivot d'épaules à y:22, pivot de hanches à y:36
const torsoArt = [
    "   11111   ",
    "  1544451  ",
    " 15444451  ",
    "154444451  ",
    "1544444511 ",
    "15444443311",
    "154444433 1",
    " 14444431  ",
    " 13444431  ",
    "  1344431  ",
    "  1344431  ",
    "  1166611  ",
    "  1677761  ",
    "  1167711  ",
];

// --- BRAS GAUCHE HAUT (4×8px) — Épaule à coude, vue arrière ---
// Pivot épaule x:26, y:22
const armL_upperArt = [
    " 11 ",
    "1331",
    "1331",
    "1331",
    "1321",
    "1321",
    "1321",
    " 11 ",
];

// --- BRAS GAUCHE BAS (5×7px) — Coude à main, poing fermé ---
// Pivot coude x:25, y:30
const armL_lowerArt = [
    " 11  ",
    "1321 ",
    "1321 ",
    "1321 ",
    "1321 ",
    "13211",
    " 1111",
];

// --- BRAS DROIT HAUT (5×8px) — Épaule à coude, vue avant ---
// Pivot épaule x:37, y:22
const armR_upperArt = [
    "  11 ",
    " 1451",
    " 1451",
    " 1451",
    " 1451",
    "1451 ",
    "1451 ",
    " 11  ",
];

// --- BRAS DROIT BAS (5×8px) — Coude à main, poing fermé ---
// Pivot coude x:38, y:30
const armR_lowerArt = [
    "  11 ",
    " 1451",
    " 1451",
    " 1451",
    " 1451",
    " 1451",
    "14511",
    "11111",
];

// --- CUISSE GAUCHE (4×9px) — Hanche à genou ---
// Pivot hanche x:29, y:36
const legL_thighArt = [
    " 11 ",
    "1321",
    "1321",
    "1321",
    "1321",
    "1321",
    "1321",
    "1321",
    " 11 ",
];

// --- MOLLET GAUCHE (5×10px) — Genou à pied ---
// Pivot genou x:28, y:44
const legL_calfArt = [
    "  11 ",
    " 1321",
    " 1321",
    " 1321",
    " 1321",
    " 1321",
    " 1321",
    "13211",
    "13211",
    "11111",
];

// --- CUISSE DROITE (5×9px) — Hanche à genou ---
// Pivot hanche x:34, y:36
const legR_thighArt = [
    " 111 ",
    "14451",
    "14451",
    "14451",
    "14451",
    " 1451",
    " 1451",
    " 1451",
    "  11 ",
];

// --- MOLLET DROIT (5×10px) — Genou à pied ---
// Pivot genou x:35, y:44
const legR_calfArt = [
    " 11  ",
    "1451 ",
    "1451 ",
    "1451 ",
    "1451 ",
    "1451 ",
    "14511",
    "14511",
    "14511",
    "11111",
];

// ============================================================
// POSITIONNEMENT — Chaque pièce est placée dans un canvas 64×64
// Les transform-origins CSS doivent correspondre aux pivots
// ============================================================
const parts = [
    //                              x    y   pivot description
    { name: 'base_head', art: headArt, x: 27, y: 10 },  // Centre cou: (31, 18)
    { name: 'base_torso', art: torsoArt, x: 26, y: 22 },  // Épaules: y22, Hanches: y36
    { name: 'base_armL_upper', art: armL_upperArt, x: 23, y: 22 },  // Pivot épaule: (25, 22)
    { name: 'base_armL_lower', art: armL_lowerArt, x: 22, y: 30 },  // Pivot coude: (24, 30)
    { name: 'base_armR_upper', art: armR_upperArt, x: 36, y: 22 },  // Pivot épaule: (38, 22)
    { name: 'base_armR_lower', art: armR_lowerArt, x: 36, y: 30 },  // Pivot coude: (38, 30)
    { name: 'base_legL_thigh', art: legL_thighArt, x: 27, y: 36 },  // Pivot hanche: (29, 36)
    { name: 'base_legL_calf', art: legL_calfArt, x: 25, y: 44 },  // Pivot genou: (28, 44)
    { name: 'base_legR_thigh', art: legR_thighArt, x: 32, y: 36 },  // Pivot hanche: (34, 36)
    { name: 'base_legR_calf', art: legR_calfArt, x: 33, y: 44 },  // Pivot genou: (35, 44)
];

// ============================================================
// GENERATION
// ============================================================
console.log('🦴 Generating mannequin sprites (Slynyrd-style)...\n');
for (const part of parts) {
    const grid = makeGrid();
    draw(grid, part.x, part.y, part.art.map(row => row.split('')));
    const svg = createSvg(grid);
    fs.writeFileSync(path.join(outDir, `${part.name}.svg`), svg);
    console.log(`  ✅ ${part.name}.svg`);
}

console.log(`\n🎨 Done! ${parts.length} sprites generated in ${outDir}`);
console.log('   Palette: #6b3a3a → #a0614e → #c48468 → #e0aa82 → #f0c8a0 → #f5d8b8');
console.log('   Proportions: Head 8px, Torso 14px, Legs 19px (Total ~40px)');
