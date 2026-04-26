import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  variant?: "light" | "dark";
}

export function Logo({ className, variant = "dark" }: LogoProps) {
  const color = variant === "light" ? "var(--text-inverse)" : "var(--brand)";
  return (
    <Link href="/" className={cn("flex items-center gap-2.5 no-underline", className)}>
      {/* Cross mark */}
      <span
        aria-hidden
        className="text-xl leading-none select-none"
        style={{ color: "var(--gold)", fontFamily: "serif" }}
      >
        ☩
      </span>
      <span
        className="text-[15px] font-medium tracking-wide uppercase leading-none"
        style={{ color, fontFamily: "var(--font-inter)", letterSpacing: "0.12em" }}
      >
        Desert Fathers Studio
      </span>
    </Link>
  );
}
