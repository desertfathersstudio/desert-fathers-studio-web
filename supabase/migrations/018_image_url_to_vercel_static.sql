-- Migrate product image_url from Supabase Storage to Vercel static files.
--
-- Before: https://wzzdynhsjiskqfpwghdn.supabase.co/storage/v1/object/public/products/stickers/Good Shepherd.png
-- After:  /stickers/Good Shepherd.png
--
-- Images already exist in /public/stickers/ and are served by Vercel CDN.
-- This stops all Supabase Storage egress for the sticker catalog.

UPDATE products
SET image_url = '/stickers/' || split_part(image_url, '/stickers/', 2)
WHERE image_url LIKE '%supabase.co/storage/v1/object/public/products/stickers/%';
