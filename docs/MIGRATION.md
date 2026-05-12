# Database Migration Log

All migrations live in `supabase/migrations/` and must be run manually in the Supabase SQL Editor in order.

## Running a migration

1. Open Supabase Dashboard → SQL Editor
2. Paste the migration file contents
3. Run it
4. Verify no errors in the output

---

## Migration history

| # | File | Description | Status |
|---|------|-------------|--------|
| 001 | `001_admin_passkeys.sql` | Admin passkey auth tables | ✅ Applied |
| 002 | `002_rls_policies.sql` | Row-level security policies | ✅ Applied |
| 003 | `003_rpc_deliver_order.sql` | RPC to deliver wholesale orders | ✅ Applied |
| 004 | `004_rpc_log_giveaway.sql` | RPC to log giveaways | ✅ Applied |
| 005 | `005_misc_expenses.sql` | Misc expenses table | ✅ Applied |
| 006 | `006_fix_rpc_generated_status.sql` | Fix generated inventory status column | ✅ Applied |
| 007 | `007_incoming_rpc_and_backfill.sql` | increment_incoming RPC + backfill | ✅ Applied |
| 008 | `008_wholesale_portal.sql` | Wholesale orders table + RLS | ✅ Applied |
| 009 | `009_wholesale_payment_received.sql` | payment_received column | ✅ Applied |
| 010 | `010_wholesale_inventory_revenue.sql` | Inventory/revenue tracking | ✅ Applied |
| 011–018 | (various) | Product metadata, image, categories | ✅ Applied |
| 019 | `019_image_updated_at.sql` | image_updated_at + featured columns | ✅ Applied |
| 020 | `020_wholesale_order_notes.sql` | notes field on wholesale_orders | ✅ Applied |
| 021 | `021_pack_metadata.sql` | sticker_packs rich metadata (name, sku, slug, retail_price, etc.) | ✅ Applied |
| 022 | `022_category_door_of_prophecies.sql` | Add "Door of Prophecies Pack" category | ✅ Applied |
| 023 | `023_approved_to_coming_soon.sql` | Retroactively mark zero-stock approved products as coming_soon | ✅ Applied |
| 024 | `024_order_discount.sql` | discount_amount column on wholesale_orders | ✅ Applied |
| 025 | `025_discount_note.sql` | discount_note column on wholesale_orders | ✅ Applied |
| 026 | `026_mfg_order_cost_breakdown.sql` | tax_amount, samples_cost, per_unit_cost on mfg_orders | ✅ Applied |
| 027 | `027_retail_price_2_dollars.sql` | Update all retail_price = 1.50 → 2.00 | ✅ Applied |
| 028 | `028_pk3_coming_soon.sql` | Mark PK-3+ pack products as coming_soon (fixes shop leak) | **⏳ Needs run** |

---

## Notes

- Migration 023 only caught `can_buy_individually = true` products. Pack headers (PK-3+) were missed because they have `can_buy_individually = false`. Migration 028 closes that gap.
- The `inventory.status` column is **generated** — never UPDATE it directly.
- After running any migration, redeploy on Vercel to pick up changes (or the app will auto-pick up on next request since it uses service-role client).
