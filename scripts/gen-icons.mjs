// Generates public/icon-192.png and public/icon-512.png
// Brand: burgundy #6b1d3b background, "DFS" white text
import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "../public");

async function makeIcon(size) {
  const fontSize = Math.round(size * 0.28);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#6b1d3b"/>
  <text
    x="50%" y="54%"
    dominant-baseline="middle"
    text-anchor="middle"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900"
    font-size="${fontSize}"
    letter-spacing="${-fontSize * 0.03}"
    fill="#f5f0ea"
  >DFS</text>
</svg>`;

  const out = join(outDir, `icon-${size}.png`);
  await sharp(Buffer.from(svg)).png().toFile(out);
  console.log(`✓ ${out}`);
}

await makeIcon(192);
await makeIcon(512);
