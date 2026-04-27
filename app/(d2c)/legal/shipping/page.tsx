import { Nav } from "@/components/d2c/Nav";
import { Footer } from "@/components/d2c/Footer";

export const metadata = { title: "Shipping Policy — Desert Fathers Studio" };

export default function ShippingPage() {
  return (
    <>
      <Nav />
      <main style={{ background: "var(--bg)", paddingTop: 64 }}>
        <LegalPage title="Shipping Policy" updated="April 27, 2026">
          <Section title="Processing Time">
            <p>Orders are processed within <strong>1–3 business days</strong> (Monday–Friday, excluding US federal holidays) from our studio in Chicago, IL. During peak seasons (Christmas, Holy Week, Pascha) please allow an extra 1–2 days.</p>
            <p>You'll receive an email with tracking information once your order ships.</p>
          </Section>

          <Section title="Domestic Shipping (United States)">
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", textAlign: "left" }}>
                  <th style={{ padding: "8px 0", color: "var(--text)" }}>Method</th>
                  <th style={{ padding: "8px 0", color: "var(--text)" }}>Estimated Delivery</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 0" }}>USPS First Class</td>
                  <td style={{ padding: "10px 0" }}>5–7 business days</td>
                </tr>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 0" }}>USPS Priority Mail</td>
                  <td style={{ padding: "10px 0" }}>2–3 business days</td>
                </tr>
              </tbody>
            </table>
            <p style={{ marginTop: "1rem" }}>Delivery estimates are provided by USPS and are not guaranteed. Weather delays and carrier backlogs are outside our control.</p>
          </Section>

          <Section title="International Shipping">
            <p>We currently ship to select international destinations. International orders typically arrive within <strong>10–21 business days</strong> after dispatch, depending on the destination country and customs processing.</p>
            <p><strong>Important:</strong> Import duties, taxes, and customs fees are the buyer's responsibility. We are not responsible for packages held by customs or additional charges imposed by your country.</p>
          </Section>

          <Section title="Wholesale / Bulk Orders">
            <p>Wholesale orders (100+ stickers) are packed in protective mailer boxes and shipped via USPS Priority Mail or UPS Ground. Tracking is always included. Contact us if you need expedited shipping for an event.</p>
          </Section>

          <Section title="Address Accuracy">
            <p>Please double-check your shipping address before placing your order. We are not responsible for packages delivered to an incorrect address as entered at checkout. If you notice an error, email us immediately at <a href="mailto:desertfathersstudio@gmail.com">desertfathersstudio@gmail.com</a> — we'll do our best to correct it before the order ships.</p>
          </Section>

          <Section title="Lost or Delayed Packages">
            <p>If your package has not arrived within the estimated window, please check your tracking link first. If it shows delivered but you haven't received it, check with neighbors and your local post office.</p>
            <p>Contact us within <strong>30 days of the ship date</strong> if your package appears to be lost. We will work with USPS to resolve the issue and, if confirmed lost, will reship or issue a refund.</p>
          </Section>

          <Section title="Questions">
            <p>Email <a href="mailto:desertfathersstudio@gmail.com">desertfathersstudio@gmail.com</a> and include your order number.</p>
          </Section>
        </LegalPage>
      </main>
      <Footer />
    </>
  );
}

function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <div className="max-w-2xl mx-auto px-6 md:px-10 py-20 md:py-28">
      <p className="text-[11px] uppercase tracking-[0.22em] font-medium mb-3" style={{ color: "var(--gold)" }}>Legal</p>
      <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 300, color: "var(--text)", marginBottom: "0.5rem" }}>
        {title}
      </h1>
      <p className="text-sm mb-12" style={{ color: "var(--text-muted)" }}>Last updated: {updated}</p>
      <div>{children}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.15rem", fontWeight: 400, color: "var(--text)", marginBottom: "0.75rem" }}>{title}</h2>
      <div style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.75 }}>{children}</div>
    </div>
  );
}
