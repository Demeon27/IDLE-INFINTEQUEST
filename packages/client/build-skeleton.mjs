import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outDir = path.join(__dirname, 'public', 'sprites', 'monsters');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

// ============================================================
// Palette squelette — tons os/ivoire verdâtre
// ============================================================
const C = {
    '0': null,            // Transparent
    '1': '#1a1a12',       // Outline noir-verdâtre
    '2': '#3a3a28',       // Os ombre profonde
    '3': '#5a5a3a',       // Os ombre
    '4': '#8a8a5a',       // Os base  
    '5': '#b0b080',       // Os highlight
    '6': '#c8c8a0',       // Os reflet max
    '7': '#2a3a1a',       // Herbe sombre
    '8': '#4a5a2a',       // Herbe claire
    '9': '#6a6a4a',       // Pierre tombale
};

// ============================================================
// Pixel art du squelette (32x48 pixels, sera rendu dans un 64x64 SVG)
// Inspiré de la référence Slynyrd — pose menaçante, penché en avant
// ============================================================
const skeletonArt = [
    // Ligne 0-3: Crâne (8x6)
    "        11111       ",
    "       145541      ",
    "      14555641     ",
    "      15556641     ",
    "      11151141     ",
    "       143341      ",
    "        1441       ",
    "         11        ",
    // Ligne 4-7: Cou + épaules
    "        1331       ",
    "       14431       ",
    "     1143344311    ",
    "    133344443331   ",
    // Ligne 8-14: Cage thoracique (côtes visibles)
    "   1344411144431   ",
    "   134410000443 1  ",
    "    13441114431    ",
    "    1344100431     ",
    "     1341 1431     ",
    "     13411431      ",
    "      134431       ",
    // Ligne 15-17: Bassin
    "      134431       ",
    "     13444431      ",
    "     13411431      ",
    "      11   11      ",
    // Ligne 18-24: Bras (pendants des deux côtés)
    // + Jambes hautes
    "   132    2431     ",
    "   132   13431     ",
    "    12   1431      ",
    "    12    131      ",
    "    12    131      ",
    "     1     11      ",
    "     1      1      ",
    // Ligne 25-32: Jambes basses + pieds
    "      1331         ",
    "     13431         ",
    "     13431         ",
    "      1341         ",
    "      1341         ",
    "       131         ",
    "       1431        ",
    "      14431        ",
    // Jambe droite (décalée)
    "          1331     ",
    "         13431     ",
    "         13431     ",
    "          1341     ",
    "          1341     ",
    "           131     ",
    "          1431     ",
    "         14531     ",
    // Pieds  
    "      111111       ",
    "         111111    ",
    // Sol herbe + pierre tombale
    "  7788   99  788   ",
    "  78887 1991 8887  ",
];

function createSvg(art, width, height, palette) {
    let rects = '';
    for (let y = 0; y < art.length; y++) {
        for (let x = 0; x < art[y].length; x++) {
            const char = art[y][x];
            if (char !== '0' && char !== ' ' && palette[char]) {
                rects += `<rect x="${x}" y="${y}" width="1.05" height="1.05" fill="${palette[char]}" />`;
            }
        }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" shape-rendering="crispEdges">${rects}</svg>`;
}

// Le squelette fait environ 20px de large × 44px de haut
// On le centre dans un viewport de 24x48
const svg = createSvg(skeletonArt, 24, 48, C);
const outPath = path.join(outDir, 'skeleton.svg');
fs.writeFileSync(outPath, svg);
console.log(`💀 Skeleton sprite generated: ${outPath}`);
console.log(`   Size: 24×48 viewport, ${skeletonArt.length} rows`);
