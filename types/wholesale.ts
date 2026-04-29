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
  | "Delivered";

export const ORDER_STAGES: OrderStage[] = [
  "Pending",
  "Processing",
  "Printed",
  "Packed",
  "Shipped",
  "Delivered",
];

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
  orderStage: OrderStage;
  trackingNumber: string | null;
  paymentSent: boolean;
  paymentSentDate: string | null;
  createdAt: string;
}

export interface WholesaleSession {
  accountId: string;
  displayName: string;
  hasPendingTab: boolean;
  canEditFulfillment: boolean;
}

export const SESSION_KEY = "ws_session";
export const CART_KEY_PREFIX = "ws_cart_";
