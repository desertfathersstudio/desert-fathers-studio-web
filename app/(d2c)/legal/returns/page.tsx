import { Nav } from "@/components/d2c/Nav";
import { Footer } from "@/components/d2c/Footer";

export const metadata = { title: "Return Policy — Desert Fathers Studio" };

export default function ReturnsPage() {
  return (
    <>
      <Nav />
      <main style={{ background: "var(--bg)", paddingTop: 64 }}>
        <LegalPage title="Return &amp; Refund Policy" updated="April 27, 2026">
          <Section title="Our Policy">
            <p>Because stickers are a personal-use consumable item, <strong>all sales are final</strong>. We are unable to accept returns or exchanges on opened orders.</p>
            <p>That said, we stand behind every sticker we ship. If something went wrong on our end, we will make it right.</p>
          </Section>

          <Section title="Damaged or Incorrect Items">
            <p>If your order arrives damaged, defective, or if we sent the wrong item, please contact us within <strong>7 days of delivery</strong> with:</p>
            <ul>
              <li>Your order number</li>
              <li>A clear photo of the damaged or incorrect item(s)</li>
              <li>A brief description of the issue</li>
            </ul>
            <p>We will ship a replacement at no charge or issue a full refund — your choice. We do not require you to return the damaged item.</p>
          </Section>

          <Section title="Lost Packages">
            <p>If your package is confirmed lost by the carrier (not just delayed), we will reship your order or issue a full refund. Please report potential losses within 30 days of the ship date. See our <a href="/legal/shipping">Shipping Policy</a> for details.</p>
          </Section>

          <Section title="Cancellations">
            <p>Orders can be cancelled within <strong>24 hours</strong> of placement, provided they have not yet been shipped. Email us immediately at <a href="mailto:desertfathersstudio@gmail.com">desertfathersstudio@gmail.com</a> with your order number.</p>
            <p>Once an order has shipped, it cannot be cancelled.</p>
          </Section>

          <Section title="Wholesale Orders">
            <p>Wholesale orders are subject to separate terms agreed upon at the time of the order. Bulk orders that have been fulfilled are non-refundable except in cases of damage or error.</p>
          </Section>

          <Section title="How to Contact Us">
            <p>Email <a href="mailto:desertfathersstudio@gmail.com">desertfathersstudio@gmail.com</a> with your order number and we'll respond within 1–2 business days.</p>
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
      <h1
        dangerouslySetInnerHTML={{ __html: title }}
        style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(1.8rem, 3.5vw, 2.6rem)", fontWeight: 300, color: "var(--text)", marginBottom: "0.5rem" }}
      />
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
