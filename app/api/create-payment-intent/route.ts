// TAX DISABLED: Not collecting sales tax until lifetime sales cross $1,000.
// To re-enable: set automatic_tax.enabled = true in PaymentIntent,
// restore tax line in checkout UI, and ensure NC tax registration is active in Stripe Dashboard.

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { CATALOG } from "@/lib/catalog";
import { calculateShipping } from "@/lib/shipping";

export interface CartItemRequest {
  product_id: string;
  quantity: number;
}

export interface AddressRequest {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

// Validate and price items server-side — never trust client prices
function resolveItems(requestItems: CartItemRequest[]) {
  return requestItems.map((item) => {
    const product = CATALOG.find((p) => p.id === item.product_id);
    if (!product) throw new Error(`Unknown product: ${item.product_id}`);
    if (item.quantity < 1 || item.quantity > 99) throw new Error("Invalid quantity");
    return {
      product_id: product.id,
      product_name: product.name,
      quantity: item.quantity,
      unit_price_cents: Math.round(product.price * 100),
      line_total_cents: Math.round(product.price * item.quantity * 100),
    };
  });
}

// POST — create a new PaymentIntent (called on checkout page load)
// Amount starts as subtotal only; shipping added via PUT once address is known.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items: rawItems } = body as { items: CartItemRequest[] };

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const resolvedItems = resolveItems(rawItems);
    const subtotalCents = resolvedItems.reduce((sum, i) => sum + i.line_total_cents, 0);

    const pi = await stripe.paymentIntents.create({
      amount: subtotalCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        items: JSON.stringify(
          resolvedItems.map((i) => ({
            id: i.product_id,
            name: i.product_name,
            qty: i.quantity,
            unit: i.unit_price_cents,
          }))
        ).slice(0, 500),
        subtotal_cents: String(subtotalCents),
        shipping_cents: "0",
        tax_cents: "0",
      },
    });

    return NextResponse.json({
      clientSecret: pi.client_secret,
      paymentIntentId: pi.id,
      subtotalCents,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("[create-payment-intent POST]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// PUT — update existing PI when customer enters/changes their shipping address.
// Total charged = subtotal + shipping. No tax until $1K threshold (see comment above).
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      paymentIntentId,
      items: rawItems,
      address,
      customerName,
      customerEmail,
      customerPhone,
      notes,
    } = body as {
      paymentIntentId: string;
      items: CartItemRequest[];
      address: AddressRequest;
      customerName?: string;
      customerEmail?: string;
      customerPhone?: string;
      notes?: string;
    };

    if (!paymentIntentId || !address?.postal_code) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // US-only enforcement
    if (address.country !== "US") {
      return NextResponse.json(
        { error: "We currently only ship within the United States." },
        { status: 400 }
      );
    }

    const resolvedItems = resolveItems(rawItems);
    const subtotalCents = resolvedItems.reduce((sum, i) => sum + i.line_total_cents, 0);
    const subtotalDollars = subtotalCents / 100;

    // Zone-based shipping — total = subtotal + shipping (no tax)
    const shipping = calculateShipping(subtotalDollars, address.postal_code);
    const shippingCents = shipping.costCents;
    const totalCents = subtotalCents + shippingCents;

    // Update the existing PI — client_secret stays the same
    await stripe.paymentIntents.update(paymentIntentId, {
      amount: totalCents,
      shipping: {
        name: customerName || "Customer",
        address: {
          line1: address.line1,
          line2: address.line2 || undefined,
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: "US",
        },
      },
      metadata: {
        items: JSON.stringify(
          resolvedItems.map((i) => ({
            id: i.product_id,
            name: i.product_name,
            qty: i.quantity,
            unit: i.unit_price_cents,
          }))
        ).slice(0, 500),
        customer_email: customerEmail || "",
        customer_phone: (customerPhone ?? "").slice(0, 30),
        shipping_zip: address.postal_code,
        subtotal_cents: String(subtotalCents),
        shipping_cents: String(shippingCents),
        tax_cents: "0",
        notes: (notes ?? "").slice(0, 500),
      },
    });

    return NextResponse.json({
      subtotalCents,
      shippingCents,
      taxCents: 0,
      totalCents,
      isFreeShipping: shipping.isFree,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("[create-payment-intent PUT]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
