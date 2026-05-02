import { z } from "zod";

// ── Wholesale ──────────────────────────────────────────────────────────────

export const WholesaleAuthSchema = z.object({
  pin: z.string().min(1).max(20),
});

export const WholesaleOrderItemSchema = z.object({
  productId:  z.string().uuid(),
  designName: z.string().min(1).max(200),
  category:   z.string().max(100).optional(),
  size:       z.string().max(50).optional(),
  imageUrl:   z.string().max(500).optional(),
  qty:        z.number().int().min(1).max(999),
  unitPrice:  z.number().min(0).max(10000),
  lineTotal:  z.number().min(0).max(10000),
  asap:       z.boolean().optional(),
});

export const WholesaleOrderPostSchema = z.object({
  accountId:     z.string().min(1).max(50),
  customerName:  z.string().min(1).max(200),
  customerEmail: z.string().email().max(300),
  items:         z.array(WholesaleOrderItemSchema).min(1).max(500),
  grandTotal:    z.number().min(0).max(100_000),
  asap:          z.boolean().optional(),
  notes:         z.string().max(2000).nullable().optional(),
});

export const WholesaleSuggestionSchema = z.object({
  accountId:     z.string().min(1).max(50),
  type:          z.string().max(100).optional(),
  priority:      z.string().max(50).optional(),
  relatedDesign: z.string().max(200).optional(),
  message:       z.string().min(1).max(5000),
});

export const WholesaleApproveSchema = z.object({
  accountId: z.string().min(1).max(50),
  productId: z.string().uuid(),
  action:    z.enum(["approve", "unapprove"]),
});

export const WholesaleCommentSchema = z.object({
  accountId: z.string().min(1).max(50),
  productId: z.string().uuid(),
  comment:   z.string().min(1).max(5000),
});

// ── D2C checkout ───────────────────────────────────────────────────────────

export const CheckoutItemSchema = z.object({
  product_id: z.string().min(1).max(100),
  quantity:   z.number().int().min(1).max(99),
});

export const CheckoutAddressSchema = z.object({
  line1:       z.string().min(1).max(200),
  line2:       z.string().max(200).optional(),
  city:        z.string().min(1).max(100),
  state:       z.string().min(2).max(50),
  postal_code: z.string().min(5).max(10),
  country:     z.literal("US"),
});

export const CheckoutCustomerSchema = z.object({
  firstName:      z.string().min(1).max(100),
  lastName:       z.string().min(1).max(100),
  email:          z.string().email().max(300),
  phone:          z.string().max(20).optional(),
  notes:          z.string().max(1000).optional(),
  marketingOptIn: z.boolean(),
  address:        CheckoutAddressSchema,
});

export const CheckoutSessionSchema = z.object({
  items:        z.array(CheckoutItemSchema).min(1).max(50),
  customerInfo: CheckoutCustomerSchema,
});

// ── Public suggestions ─────────────────────────────────────────────────────

export const PublicSuggestionSchema = z.object({
  message:      z.string().min(1).max(5000),
  contactEmail: z.string().email().max(300).optional(),
});
