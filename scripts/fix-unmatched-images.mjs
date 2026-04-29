/**
 * Manually fixes the 7 images that the fuzzy matcher couldn't place.
 * Searches for the product by a keyword and sets its image_url.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BUCKET = "products";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// file → keyword to search in product name (case-insensitive ILIKE)
const MANUAL = [
  { file: "03 - Mary Magdalene.png",       keyword: "magdalene" },
  { file: "04 - Myrrhbearers.png",         keyword: "myrrh" },
  { file: "06 - Emmuas Disciples.png",     keyword: "emmaus" },
  { file: "12 - Judas_ Betrayal.png",      keyword: "betrayal" },
  { file: "15 - Jesus_ Scourging.png",     keyword: "scourg" },
  { file: "Pantokrator.png",               keyword: "pantokrator" },
  // Holy Week Pack BACK.png is not an individual product — skip
];

for (const { file, keyword } of MANUAL) {
  const storagePath = `stickers/${file}`;
  const { data: { publicUrl } } = sb.storage.from(BUCKET).getPublicUrl(storagePath);

  const { data: products } = await sb
    .from("products")
    .select("id, name")
    .ilike("name", `%${keyword}%`)
    .limit(1);

  if (!products || products.length === 0) {
    console.log(`  ⚠  No product found for keyword "${keyword}" (${file})`);
    continue;
  }

  const p = products[0];
  const { error } = await sb.from("products").update({ image_url: publicUrl }).eq("id", p.id);
  if (error) {
    console.error(`  ❌ ${p.name}: ${error.message}`);
  } else {
    console.log(`  ✓ ${file.padEnd(40)} → ${p.name}`);
  }
}

console.log("\n✅ Manual fixes done");
