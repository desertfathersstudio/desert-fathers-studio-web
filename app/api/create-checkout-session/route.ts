import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { CATALOG } from "@/lib/catalog";
import { calculateShipping } from "@/lib/shipping";

export interface CheckoutSessionRequest {
  items: Array<{ product_id: string; quantity: number }>;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    notes?: string;
    marketingOptIn: boolean;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postal_code: string;
      country: string;
    };
  };
}

function resolveItems(rawItems: Array<{ product_id: string; quantity: number }>) {
  return rawItems.map((item) => {
    const product = CATALOG.find((p) => p.id === item.product_id);
    if (!product) throw new Error(`Unknown product: ${item.product_id}`);
    if (item.quantity < 1 || item.quantity > 99) throw new Error("Invalid quantity");
    return {
      product_id:      product.id,
      product_name:    product.name,
      filename:        product.filename,
      quantity:        item.quantity,
      unit_price_cents: Math.round(product.price * 100),
      line_total_cents: Math.round(product.price * item.quantity * 100),
    };
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as CheckoutSessionRequest;
    const { items: rawItems, customerInfo } = body;

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }
    if (!customerInfo?.email || !customerInfo?.address?.postal_code) {
      return NextResponse.json({ error: "Missing required customer info" }, { status: 400 });
    }
    if (customerInfo.address.country !== "US") {
      return NextResponse.json(
        { error: "We currently only ship within the United States." },
        { status: 400 }
      );
    }

    const resolvedItems = resolveItems(rawItems);
    const subtotalCents  = resolvedItems.reduce((sum, i) => sum + i.line_total_cents, 0);
    const subtotalDollars = subtotalCents / 100;

    // Use first 5 digits for zone lookup so ZIP+4 works correctly
    const zip5 = customerInfo.address.postal_code.replace(/\D/g, "").slice(0, 5);
    const shipping      = calculateShipping(subtotalDollars, zip5);
    const shippingCents = shipping.costCents;

    // Use || (not ??) so empty strings fall through to the next option
    const rawUrl = (
      process.env.APP_URL?.trim() ||
      process.env.NEXT_PUBLIC_APP_URL?.trim() ||
      process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
      "http://localhost:3001"
    );
    const baseUrl = rawUrl.replace(/\/$/, "");

    // Log every env source so Vercel logs show exactly what was resolved
    console.log("[create-checkout-session] APP_URL:", process.env.APP_URL ?? "(not set)");
    console.log("[create-checkout-session] NEXT_PUBLIC_APP_URL:", process.env.NEXT_PUBLIC_APP_URL ?? "(not set)");
    console.log("[create-checkout-session] NEXT_PUBLIC_SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL ?? "(not set)");
    console.log("[create-checkout-session] resolved baseUrl:", baseUrl);

    // Validate before hitting Stripe — catches misconfigured env vars immediately
    try { new URL(baseUrl); } catch {
      console.error("[create-checkout-session] baseUrl is not a valid URL:", baseUrl);
      return NextResponse.json(
        { error: `Site URL is misconfigured ("${baseUrl}"). Set APP_URL in environment variables.` },
        { status: 500 }
      );
    }

    const successUrl = `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl  = `${baseUrl}/checkout`;

    console.log("[create-checkout-session] success_url:", successUrl);
    console.log("[create-checkout-session] cancel_url:", cancelUrl);

    // Stripe requires absolute HTTPS URLs for product images; skip on localhost
    const imageBase = baseUrl.startsWith("https://") ? baseUrl : null;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: customerInfo.email,
      phone_number_collection: { enabled: true },
      shipping_address_collection: { allowed_countries: ["US"] },

      line_items: resolvedItems.map((item) => {
        const imageUrl = imageBase
          ? `${imageBase}/stickers/${encodeURIComponent(item.filename)}`
          : null;
        console.log("[create-checkout-session] image:", imageUrl ?? "(skipped — not HTTPS)");
        return {
          price_data: {
            currency: "usd",
            product_data: {
              name:   item.product_name,
              ...(imageUrl ? { images: [imageUrl] } : {}),
            },
            unit_amount: item.unit_price_cents,
          },
          quantity: item.quantity,
        };
      }),

      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: shippingCents, currency: "usd" },
            display_name: shipping.isFree ? "Free Shipping" : "USPS Ground Advantage",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 3 },
              maximum: { unit: "business_day", value: 7 },
            },
          },
        },
      ],

      metadata: {
        first_name:       customerInfo.firstName.slice(0, 100),
        last_name:        customerInfo.lastName.slice(0, 100),
        phone:            (customerInfo.phone ?? "").slice(0, 30),
        email:            customerInfo.email.slice(0, 200),
        notes:            (customerInfo.notes ?? "").slice(0, 500),
        marketing_opt_in: customerInfo.marketingOptIn ? "true" : "false",
        items: JSON.stringify(
          resolvedItems.map((i) => ({
            id:   i.product_id,
            name: i.product_name,
            qty:  i.quantity,
            unit: i.unit_price_cents,
          }))
        ).slice(0, 500),
        shipping_address: JSON.stringify(customerInfo.address).slice(0, 500),
        subtotal_cents:   String(subtotalCents),
        shipping_cents:   String(shippingCents),
      },

      success_url: successUrl,
      cancel_url:  cancelUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error";
    console.error("[create-checkout-session]", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
