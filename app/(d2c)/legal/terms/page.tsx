import { Nav } from "@/components/d2c/Nav";
import { Footer } from "@/components/d2c/Footer";

export const metadata = { title: "Terms of Service — Desert Fathers Studio" };

export default function TermsPage() {
  return (
    <>
      <Nav />
      <main style={{ background: "var(--bg)", paddingTop: 64 }}>
        <LegalPage title="Terms of Service" updated="April 27, 2026">
          <Section title="1. Acceptance of Terms">
            <p>By accessing or purchasing from desertfathersstudio.com, you agree to be bound by these Terms of Service. If you do not agree, please do not use the site.</p>
          </Section>

          <Section title="2. Products">
            <p>Desert Fathers Studio sells physical vinyl icon stickers. All product descriptions, pricing, and images are provided in good faith. We reserve the right to correct errors and to limit quantities.</p>
            <p>Colors on screen may vary slightly from the printed product due to monitor calibration differences.</p>
          </Section>

          <Section title="3. Ordering & Payment">
            <p>By placing an order you represent that you are at least 18 years old and authorized to use the payment method provided. All prices are in US dollars.</p>
            <p>Payment is processed securely through Stripe. We do not store payment card details on our servers.</p>
            <p>We reserve the right to cancel or refuse any order at our discretion, including in cases of suspected fraud, pricing errors, or unavailability.</p>
          </Section>

          <Section title="4. Intellectual Property">
            <p>All artwork, designs, and content on this site are original works and are the exclusive property of Desert Fathers Studio, protected under US copyright law. Designs are inspired by Coptic iconographic tradition and are not in the public domain.</p>
            <p>You may not reproduce, resell, or distribute our designs without written permission.</p>
          </Section>

          <Section title="5. Wholesale Accounts">
            <p>Wholesale pricing is available to approved institutions (parishes, Sunday schools, church bookstores). Wholesale accounts are subject to separate pricing agreements and minimum order requirements. We reserve the right to revoke wholesale status at any time.</p>
          </Section>

          <Section title="6. Limitation of Liability">
            <p>To the fullest extent permitted by law, Desert Fathers Studio shall not be liable for any indirect, incidental, or consequential damages arising from your use of our products or website. Our total liability for any claim shall not exceed the amount you paid for the order in question.</p>
          </Section>

          <Section title="7. Governing Law">
            <p>These Terms are governed by the laws of the State of North Carolina, USA, without regard to conflict of law principles. Any disputes shall be resolved in the courts of North Carolina.</p>
          </Section>

          <Section title="8. Changes to These Terms">
            <p>We may update these Terms at any time. The updated date at the top of this page will reflect changes. Your continued use of the site after any changes constitutes acceptance.</p>
          </Section>

          <Section title="9. Contact">
            <p>Questions about these Terms? Email <a href="mailto:desertfathersstudio@gmail.com">desertfathersstudio@gmail.com</a></p>
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
