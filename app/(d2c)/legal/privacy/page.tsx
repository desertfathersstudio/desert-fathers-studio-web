import { Nav } from "@/components/d2c/Nav";
import { Footer } from "@/components/d2c/Footer";

export const metadata = { title: "Privacy Policy — Desert Fathers Studio" };

export default function PrivacyPage() {
  return (
    <>
      <Nav />
      <main style={{ background: "var(--bg)", paddingTop: 64 }}>
        <LegalPage title="Privacy Policy" updated="April 27, 2026">
          <Section title="1. Who We Are">
            <p>Desert Fathers Studio ("we," "our," or "us") is a small Coptic Christian art business based in Chicago, Illinois. We sell hand-designed icon stickers at desertfathersstudio.com.</p>
            <p>Questions? Reach us at <a href="mailto:desertfathersstudio@gmail.com">desertfathersstudio@gmail.com</a></p>
          </Section>

          <Section title="2. Information We Collect">
            <p>We collect information you give us directly when you place an order or contact us:</p>
            <ul>
              <li><strong>Identity:</strong> name</li>
              <li><strong>Contact:</strong> email address, phone number (if provided)</li>
              <li><strong>Shipping:</strong> delivery address</li>
              <li><strong>Payment:</strong> credit or debit card details — processed securely by Stripe. We never see or store your raw card number.</li>
            </ul>
            <p>We also collect basic analytics data (pages visited, browser type, country) through our hosting provider, Vercel. This data is anonymized and not tied to individuals.</p>
          </Section>

          <Section title="3. How We Use Your Information">
            <ul>
              <li>To process and fulfill your order</li>
              <li>To send order confirmations and shipping updates</li>
              <li>To respond to your questions or wholesale inquiries</li>
              <li>To improve our website and product offerings</li>
            </ul>
            <p>We do not send marketing emails without your explicit consent.</p>
          </Section>

          <Section title="4. Sharing Your Information">
            <p>We do not sell, rent, or trade your personal information. We share data only with:</p>
            <ul>
              <li><strong>Stripe</strong> — payment processing (<a href="https://stripe.com/privacy" target="_blank" rel="noopener">stripe.com/privacy</a>)</li>
              <li><strong>USPS / shipping carriers</strong> — to deliver your order</li>
              <li><strong>Vercel</strong> — our hosting provider</li>
            </ul>
          </Section>

          <Section title="5. Cookies">
            <p>Our site uses only functional cookies necessary for the shopping cart and session management. We do not use tracking cookies or third-party ad cookies.</p>
          </Section>

          <Section title="6. Data Retention">
            <p>We retain order information for 3 years for accounting and legal compliance. You may request deletion of your personal data at any time by contacting us — we will honor all requests that do not conflict with legal obligations.</p>
          </Section>

          <Section title="7. Your Rights">
            <p>You have the right to access, correct, or delete the personal information we hold about you. To exercise any of these rights, email us at <a href="mailto:desertfathersstudio@gmail.com">desertfathersstudio@gmail.com</a>.</p>
          </Section>

          <Section title="8. Children's Privacy">
            <p>Our website is not directed to children under 13. We do not knowingly collect personal data from children.</p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>We may update this policy occasionally. The date at the top of this page reflects the most recent revision. Continued use of the site after changes constitutes acceptance.</p>
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
      <div className="prose-legal">{children}</div>
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
