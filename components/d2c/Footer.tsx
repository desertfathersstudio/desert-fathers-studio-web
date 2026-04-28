import Link from "next/link";
import { Lock } from "lucide-react";
import { Logo } from "@/components/shared/Logo";

export function Footer() {
  return (
    <footer style={{ background: "var(--bg-dark)", color: "var(--text-inverse)" }}>
      {/* Wholesale CTA band */}
      <div
        className="py-14 px-6 md:px-10 text-center"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <p
          className="mb-2 text-[11px] uppercase tracking-[0.2em] font-medium"
          style={{ color: "var(--gold)" }}
        >
          Sunday Schools &amp; Parishes
        </p>
        <h3
          className="mb-5"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
            fontWeight: 300,
          }}
        >
          Ordering for a class or youth group?
        </h3>
        <p
          className="mb-6 text-sm leading-relaxed mx-auto"
          style={{ color: "rgba(248,244,236,0.55)", maxWidth: "44ch" }}
        >
          We offer bulk pricing for parishes, Sunday schools,
          and church bookstores. Fill out a quick inquiry form and we'll be in touch.
        </p>
        <Link
          href="/wholesale"
          className="inline-flex text-sm font-medium px-6 py-3 transition-opacity hover:opacity-80"
          style={{
            border: "1px solid var(--gold)",
            color: "var(--gold)",
            borderRadius: "var(--radius-btn)",
          }}
        >
          Apply for wholesale pricing →
        </Link>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-16">
        <div className="grid md:grid-cols-[2fr_1fr_1fr_1fr] gap-12">
          {/* Brand */}
          <div>
            <Logo variant="light" className="mb-5" />
            <p
              className="text-sm leading-relaxed max-w-xs mb-6"
              style={{ color: "rgba(248,244,236,0.5)" }}
            >
              Coptic Orthodox icon stickers, hand-designed for everyday faithful
              life.
            </p>
            {/* Secure checkout badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(248,244,236,0.55)",
              }}
            >
              <Lock size={11} style={{ color: "var(--gold)" }} />
              <span>Secure Checkout · SSL Encrypted</span>
            </div>
            <div
              className="flex items-center gap-2 mt-2 px-3 py-1.5 rounded-lg text-[10px] font-medium tracking-wide"
              style={{ color: "rgba(248,244,236,0.35)" }}
            >
              VISA · MASTERCARD · AMEX · DISCOVER
            </div>
          </div>

          {/* Shop */}
          <div>
            <p
              className="text-xs uppercase tracking-widest mb-4"
              style={{ color: "var(--gold)" }}
            >
              Shop
            </p>
            <ul className="space-y-3">
              {[
                { label: "All Stickers", href: "/shop" },
                { label: "Saints", href: "/shop?category=saints" },
                { label: "Holy Week Pack", href: "/shop/holy-week-pack" },
                { label: "Resurrection Pack", href: "/shop/resurrection-pack" },
                { label: "Packs", href: "/shop?category=packs" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm transition-opacity hover:opacity-60"
                    style={{ color: "rgba(248,244,236,0.65)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <p
              className="text-xs uppercase tracking-widest mb-4"
              style={{ color: "var(--gold)" }}
            >
              Community
            </p>
            <ul className="space-y-3">
              {[
                { label: "Wholesale Inquiry", href: "/wholesale" },
                { label: "Our Story", href: "#story" },
                { label: "Contact Us", href: "mailto:desertfathersstudio@gmail.com" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm transition-opacity hover:opacity-60"
                    style={{ color: "rgba(248,244,236,0.65)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p
              className="text-xs uppercase tracking-widest mb-4"
              style={{ color: "var(--gold)" }}
            >
              Legal
            </p>
            <ul className="space-y-3">
              {[
                { label: "Privacy Policy", href: "/legal/privacy" },
                { label: "Terms of Service", href: "/legal/terms" },
                { label: "Shipping Policy", href: "/legal/shipping" },
                { label: "Return Policy", href: "/legal/returns" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm transition-opacity hover:opacity-60"
                    style={{ color: "rgba(248,244,236,0.65)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(248,244,236,0.35)",
          }}
        >
          <p>© {new Date().getFullYear()} Desert Fathers Studio. All rights reserved.</p>
          <span aria-hidden style={{ color: "var(--gold)", opacity: 0.5, fontSize: "1rem" }}>☩</span>
          <p>Made with faith</p>
        </div>
      </div>
    </footer>
  );
}
