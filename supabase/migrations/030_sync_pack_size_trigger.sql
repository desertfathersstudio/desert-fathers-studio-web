-- Keep sticker_packs.pack_size automatically in sync with the live count of
-- active constituent sticker products (sku NOT matching PK-\d+) linked to
-- each pack via products.pack_id.
--
-- Fires after any INSERT or UPDATE that changes pack_id or active on products.
-- This means:
--   • Archiving a sticker (active = false)  → decrements its pack's count
--   • Restoring a sticker (active = true)   → increments its pack's count
--   • Linking a sticker to a pack           → increments the new pack's count
--   • Moving a sticker between packs        → decrements old, increments new

CREATE OR REPLACE FUNCTION sync_sticker_pack_size()
RETURNS TRIGGER AS $$
BEGIN
  -- When a sticker is moved out of a pack (pack_id changed), update the old pack
  IF TG_OP = 'UPDATE'
     AND OLD.pack_id IS NOT NULL
     AND OLD.pack_id IS DISTINCT FROM NEW.pack_id
  THEN
    UPDATE sticker_packs
    SET pack_size = (
      SELECT COUNT(*)::integer
      FROM products
      WHERE pack_id = OLD.pack_id
        AND active = true
        AND sku !~ '^PK-\d+$'
    )
    WHERE id = OLD.pack_id;
  END IF;

  -- Update the current (new) pack whenever pack_id or active changes
  IF NEW.pack_id IS NOT NULL THEN
    UPDATE sticker_packs
    SET pack_size = (
      SELECT COUNT(*)::integer
      FROM products
      WHERE pack_id = NEW.pack_id
        AND active = true
        AND sku !~ '^PK-\d+$'
    )
    WHERE id = NEW.pack_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_sticker_pack_size ON products;

CREATE TRIGGER trg_sync_sticker_pack_size
AFTER INSERT OR UPDATE OF pack_id, active ON products
FOR EACH ROW EXECUTE FUNCTION sync_sticker_pack_size();
