export type PackType = "HWP" | "RP" | "";

export interface WholesaleProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  size: string;
  imageUrl: string;
  reviewStatus: "approved" | "under_review" | "rejected";
  reviewComments: string;
  dateAdded: string;
  packType: PackType;
  packOnly: boolean;
  standalonePackDesign: boolean;
  isPackProduct: boolean;
  categoryBg: string;
  categoryText: string;
  isNew: boolean;
}

export interface WholesaleCartLine {
  productId: string;
  designName: string;
  category: string;
  size: string;
  imageUrl: string;
  qty: number;
  unitPrice: number;
  asap: boolean;
}

export type OrderStage =
  | "Pending"
  | "Processing"
  | "Printed"
  | "Packed"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

// Linear fulfillment stages — does NOT include Cancelled (terminal dead-end state)
export const ORDER_STAGES: OrderStage[] = [
  "Pending",
  "Processing",
  "Printed",
  "Packed",
  "Shipped",
  "Delivered",
];

export const ORDER_STAGES_WITH_CANCEL: OrderStage[] = [...ORDER_STAGES, "Cancelled"];

export interface WholesaleOrderItem {
  productId: string;
  designName: string;
  category: string;
  size: string;
  imageUrl: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface WholesaleOrder {
  id: string;
  orderId: string;
  accountId: string;
  customerName: string;
  customerEmail: string;
  items: WholesaleOrderItem[];
  grandTotal: number;
  asap: boolean;
  notes: string | null;
  orderStage: OrderStage;
  trackingNumber: string | null;
  paymentSent: boolean;
  paymentSentDate: string | null;
  paymentReceived: boolean;
  paymentReceivedDate: string | null;
  createdAt: string;
}

export interface WholesaleSession {
  accountId: string;
  displayName: string;
  notifyEmail: string;
  hasPendingTab: boolean;
  canEditFulfillment: boolean;
  contactNames: string[];
  priceSingle: number;
  priceRpPack: number;
  priceHwpPack: number;
}

export const SESSION_KEY = "ws_session";
export const CART_KEY_PREFIX = "ws_cart_";

export interface ProductComment {
  id: string;
  product_id: string;
  body: string;
  author: string;
  author_type: "admin" | "reviewer";
  parent_id: string | null;
  is_resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}
