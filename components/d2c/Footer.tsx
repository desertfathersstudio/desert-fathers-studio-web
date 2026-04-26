import Link from "next/link";
import { Logo } from "@/components/shared/Logo";

export function Footer() {
  return (
    <footer style={{ background: "var(--bg-dark)", color: "var(--text-inverse)" }}>

      {/* Wholesale CTA band */}
      <div
        className="py-12 px-6 md:px-10 text-center"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}
      >
        <p
          className="mb-2 text-[11px] uppercase tracking-[0.2em] font-medium"
          style={{ color: "var(--gold)" }}
        >
          Sunday Schools &amp; Parishes
        </p>
        <h3
          className="mb-4"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: "clamp(1.5rem, 3vw, 2.2rem)",
            fontWeight: 300,
          }}
        >
          Ordering for a class or youth group?
        </h3>
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
              className="text-sm leading-relaxed max-w-xs"
              style={{ color: "rgba(250,247,242,0.5)" }}
            >
              Coptic Orthodox icon stickers, hand-designed for everyday faithful life.
            </p>
          </div>

          {/* Shop */}
          <div>
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "var(--gold)" }}>
              Shop
            </p>
            <ul className="space-y-3">
              {["All Stickers", "Saints", "Feasts", "Holy Week Pack", "Resurrection Pack"].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-sm transition-opacity hover:opacity-60"
                    style={{ color: "rgba(250,247,242,0.65)" }}
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "var(--gold)" }}>
              Community
            </p>
            <ul className="space-y-3">
              {[
                { label: "Sunday Schools", href: "/wholesale" },
                { label: "Our Story", href: "#story" },
                { label: "Etsy Shop", href: "https://etsy.com" },
                { label: "Contact", href: "mailto:hello@desertfathersstudio.com" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm transition-opacity hover:opacity-60"
                    style={{ color: "rgba(250,247,242,0.65)" }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "var(--gold)" }}>
              Legal
            </p>
            <ul className="space-y-3">
              {["Privacy Policy", "Terms of Service", "Shipping Policy"].map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-sm transition-opacity hover:opacity-60"
                    style={{ color: "rgba(250,247,242,0.65)" }}
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="mt-16 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs"
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(250,247,242,0.35)",
          }}
        >
          <p>© {new Date().getFullYear()} Desert Fathers Studio. All rights reserved.</p>
          <p>Made with faith in Chicago, IL</p>
        </div>
      </div>
    </footer>
  );
}
