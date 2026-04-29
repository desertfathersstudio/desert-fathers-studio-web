export type ReviewStatus = "approved" | "under_review" | "rejected";
export type InventoryStatus = "in_stock" | "low" | "sold_out";
export type OrderStatus = "ordered" | "shipped" | "delivered" | "canceled";
export type ItemType = "full_batch" | "sample" | "proof" | "reprint";

export const GIVEAWAY_REASONS = [
  "Gift",
  "Sample",
  "Promotion",
  "Donation",
  "Church-Ministry",
  "Family-Friend",
  "Damaged-Misprint",
  "Other",
] as const;
export type GiveawayReason = (typeof GIVEAWAY_REASONS)[number];

export const IDEA_CATEGORIES = [
  "Saints",
  "Feasts",
  "Parables",
  "Miracles",
  "Text / WordArt",
  "Other",
] as const;
export type IdeaCategory = (typeof IDEA_CATEGORIES)[number];

export interface Category {
  id: string;
  name: string;
}

export interface InventoryRow {
  id: string;
  product_id: string;
  on_hand: number;
  incoming: number;
  low_stock_threshold: number;
  status: InventoryStatus;
  last_updated: string | null;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category_id: string | null;
  pack_id: string | null;
  can_buy_individually: boolean;
  size: string | null;
  description: string | null;
  image_url: string | null;
  drive_link: string | null;
  retail_price: number;
  review_status: ReviewStatus;
  review_comments: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductWithInventory extends Product {
  categories: { name: string } | null;
  inventory: InventoryRow | null;
}

export interface MfgOrderItem {
  id: string;
  mfg_order_id: string;
  product_id: string;
  qty_ordered: number;
  item_type: ItemType;
  unit_cost: number | null;
  line_base_cost: number | null;
  shipping_allocation: number;
  extra_cost_allocation: number;
  total_line_cost: number | null;
  received: boolean;
  notes: string | null;
  products?: { name: string; sku: string; image_url: string | null } | null;
}

export interface MfgOrder {
  id: string;
  order_id: string;
  supplier_id: string | null;
  order_date: string;
  arrival_date: string | null;
  total_qty: number | null;
  base_cost: number | null;
  shipping: number;
  extra_costs: number;
  total_cost: number | null;
  status: OrderStatus;
  tracking_number: string | null;
  notes: string | null;
  created_at: string;
  suppliers?: { id: string; name: string } | null;
  mfg_order_items?: MfgOrderItem[];
}

export interface GiftsLog {
  id: string;
  date: string;
  product_id: string;
  pack_id: string | null;
  qty: number;
  recipient: string | null;
  reason: string;
  notes: string | null;
  products?: { name: string; sku: string } | null;
}

export interface DesignIdea {
  id: string;
  category: string;
  idea: string;
  notes: string | null;
  source: string;
  done: boolean;
  date_done: string | null;
  created_at: string;
}

export interface PublicSuggestion {
  id: string;
  name: string | null;
  email: string | null;
  message: string;
  reviewed: boolean;
  converted_to_idea_id: string | null;
  created_at: string;
}

export interface WholesaleAccount {
  id: string;
  user_id: string | null;
  business_name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  pricing_tier_id: string | null;
  custom_pricing_notes: string | null;
  consignment: boolean;
  payment_terms: string | null;
  approved: boolean;
  notes: string | null;
  created_at: string;
  pricing_tiers?: { name: string } | null;
}

export interface PricingTier {
  id: string;
  name: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_info: string | null;
  notes: string | null;
}

export interface AdminStats {
  total: number;
  approved: number;
  pendingReview: number;
  lowStock: number;
  soldOut: number;
  needReorder: number;
  onHandNow: number;
  everOrdered: number;
  totalSold: number;
}
