// Generates public/icon-192.png and public/icon-512.png from Logo.png
import sharp from "sharp";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir   = join(__dirname, "../public");
const logoPath = "/Users/jerome/Stickers Project - SMSMA/Logo.png";

async function makeIcon(size) {
  const out = join(outDir, `icon-${size}.png`);
  const pad = Math.round(size * 0.08);
  const inner = size - pad * 2;

  // White background, logo centered with padding
  await sharp({
    create: {
      width:      size,
      height:     size,
      channels:   4,
      background: { r: 245, g: 240, b: 234, alpha: 1 }, // #f5f0ea
    },
  })
    .composite([{
      input: await sharp(logoPath).resize(inner, inner, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer(),
      top:   pad,
      left:  pad,
    }])
    .png()
    .toFile(out);

  console.log(`✓ ${out}`);
}

await makeIcon(192);
await makeIcon(512);
