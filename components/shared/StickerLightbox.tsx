"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { useLightbox } from "@/lib/lightbox";
import { useCart } from "@/lib/cart";
import { CATEGORY_LABELS } from "@/lib/catalog";


export function StickerLightbox() {
  const { state, close, setIndex } = useLightbox();
  const { add } = useCart();
  const [qty, setQtyLocal] = useState(1);
  const [zoomed, setZoomed] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState({ x: 50, y: 50 });
  const touchStartX = useRef<number | null>(null);
  const imagePanelRef = useRef<HTMLDivElement>(null);

  const isOpen = state !== null;
  const sticker = state ? state.items[state.index] : null;
  const total = state ? state.items.length : 0;

  // Scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Reset qty and zoom when sticker changes
  useEffect(() => {
    setQtyLocal(1);
    setZoomed(false);
    setZoomOrigin({ x: 50, y: 50 });
  }, [state?.index]);

  const onImageMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!imagePanelRef.current) return;
    const rect = imagePanelRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setZoomOrigin({ x, y });
  }, []);

  const navigate = useCallback(
    (dir: 1 | -1) => {
      if (!state) return;
      const next = (state.index + dir + state.items.length) % state.items.length;
      setIndex(next);
    },
    [state, setIndex]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") navigate(1);
      else if (e.key === "ArrowLeft") navigate(-1);
      else if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, navigate, close]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) navigate(diff > 0 ? 1 : -1);
    touchStartX.current = null;
  };

  const handleAdd = () => {
    if (!sticker) return;
    add(sticker, qty);
    close();
  };

  return (
    <AnimatePresence>
      {isOpen && sticker && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60]"
            style={{ background: "rgba(28,42,58,0.72)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
            aria-hidden
          />

          {/* Modal */}
          <div className="fixed inset-0 z-[61] flex items-center justify-center p-4 md:p-8 pointer-events-none">
            <motion.div
              className="relative flex flex-col md:flex-row w-full pointer-events-auto overflow-hidden"
              style={{
                maxWidth: 1040,
                maxHeight: "92vh",
                background: "var(--bg)",
                borderRadius: "var(--radius-card)",
                border: "1px solid var(--border)",
                boxShadow: "0 32px 80px rgba(28,42,58,0.28)",
              }}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close */}
              <button
                onClick={close}
                className="absolute top-3 right-3 z-20 flex items-center justify-center w-8 h-8 rounded-full transition-opacity hover:opacity-60"
                style={{ background: "rgba(248,244,236,0.9)", border: "1px solid var(--border)" }}
                aria-label="Close"
              >
                <X size={14} style={{ color: "var(--text-muted)" }} />
              </button>

              {/* Image panel — locked square so fill image never shifts */}
              <div
                className="flex-shrink-0 w-full md:w-[640px] border-b md:border-b-0 md:border-r"
                style={{ background: "#ffffff", borderColor: "var(--border)" }}
                onTouchStart={onTouchStart}
                onTouchEnd={onTouchEnd}
              >
                {/* Square container — overflow hidden clips the zoom */}
                <div
                  ref={imagePanelRef}
                  className="relative"
                  style={{
                    paddingBottom: "100%",
                    overflow: "hidden",
                    cursor: zoomed ? "zoom-out" : "zoom-in",
                  }}
                  onMouseMove={onImageMouseMove}
                  onClick={() => setZoomed((z) => !z)}
                >
                  {/* Prev arrow */}
                  {total > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(-1); }}
                      className="absolute left-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full transition-opacity hover:opacity-70"
                      style={{
                        background: "rgba(255,255,255,0.9)",
                        border: "1px solid var(--border)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      }}
                      aria-label="Previous sticker"
                    >
                      <ChevronLeft size={16} style={{ color: "var(--text)" }} />
                    </button>
                  )}

                  {/* Next arrow */}
                  {total > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(1); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-8 h-8 rounded-full transition-opacity hover:opacity-70"
                      style={{
                        background: "rgba(255,255,255,0.9)",
                        border: "1px solid var(--border)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      }}
                      aria-label="Next sticker"
                    >
                      <ChevronRight size={16} style={{ color: "var(--text)" }} />
                    </button>
                  )}

                  {/* Counter */}
                  {total > 1 && (
                    <div
                      className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 text-[10px] px-2.5 py-1 rounded-full"
                      style={{
                        background: "rgba(28,42,58,0.55)",
                        color: "#fff",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {(state?.index ?? 0) + 1} / {total}
                    </div>
                  )}

                  {/* Zoom toggle button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setZoomed((z) => !z); }}
                    className="absolute top-3 left-3 z-10 flex items-center justify-center w-7 h-7 rounded-full transition-opacity hover:opacity-80"
                    style={{
                      background: "rgba(255,255,255,0.9)",
                      border: "1px solid var(--border)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                    }}
                    aria-label={zoomed ? "Zoom out" : "Zoom in"}
                  >
                    {zoomed
                      ? <ZoomOut size={13} style={{ color: "var(--text)" }} />
                      : <ZoomIn size={13} style={{ color: "var(--text)" }} />
                    }
                  </button>

                  {/* Crossfade image with zoom transform */}
                  <AnimatePresence>
                    <motion.div
                      key={sticker.id}
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{
                          transform: zoomed ? "scale(2.5)" : "scale(1)",
                          transformOrigin: `${zoomOrigin.x}% ${zoomOrigin.y}%`,
                          transition: zoomed ? "none" : "transform 0.2s ease-out",
                          willChange: "transform",
                        }}
                      >
                        <Image
                          src={`/stickers/${sticker.filename}`}
                          alt={sticker.name}
                          fill
                          className="object-contain p-5"
                          sizes="640px"
                          priority
                        />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Info panel */}
              <div className="flex flex-col flex-1 p-6 md:p-8 overflow-y-auto">
                <motion.div
                  key={sticker.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.12 }}
                  className="flex flex-col flex-1"
                >
                    {/* Eyebrow */}
                    <p
                      className="text-[10px] uppercase tracking-[0.22em] mb-3"
                      style={{ color: "var(--gold)", fontFamily: "var(--font-sans)" }}
                    >
                      {(CATEGORY_LABELS as Record<string, string>)[sticker.category] ?? sticker.category}
                    </p>

                    {/* Name */}
                    <h2
                      className="leading-tight mb-2"
                      style={{
                        fontFamily: "var(--font-serif)",
                        fontSize: "clamp(1.3rem, 2.5vw, 1.75rem)",
                        fontWeight: 400,
                        color: "var(--text)",
                      }}
                    >
                      {sticker.name}
                    </h2>

                    {/* Price */}
                    <p
                      className="mb-8"
                      style={{
                        color: "var(--brand)",
                        fontFamily: "var(--font-sans)",
                        fontSize: "1.1rem",
                        fontWeight: 500,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      ${sticker.price.toFixed(2)} each
                    </p>

                    {/* Qty stepper */}
                    <div className="mt-auto">
                      <p
                        className="text-xs mb-2"
                        style={{ color: "var(--text-muted)" }}
                      >
                        Quantity
                      </p>
                      <div className="flex items-center gap-2 mb-4">
                        <button
                          onClick={() => setQtyLocal((q) => Math.max(1, q - 1))}
                          className="flex items-center justify-center w-9 h-9 text-lg font-medium rounded-lg transition-opacity hover:opacity-70"
                          style={{
                            border: "1px solid var(--border)",
                            color: "var(--text)",
                            background: "var(--bg)",
                          }}
                          aria-label="Decrease quantity"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={qty}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            if (!isNaN(v) && v >= 1) setQtyLocal(Math.min(v, 99));
                          }}
                          className="text-center text-sm font-medium"
                          style={{
                            width: 52,
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            padding: "7px 4px",
                            background: "var(--bg)",
                            color: "var(--text)",
                            fontVariantNumeric: "tabular-nums",
                            outline: "none",
                          }}
                          aria-label="Quantity"
                        />
                        <button
                          onClick={() => setQtyLocal((q) => Math.min(99, q + 1))}
                          className="flex items-center justify-center w-9 h-9 text-lg font-medium rounded-lg transition-opacity hover:opacity-70"
                          style={{
                            border: "1px solid var(--border)",
                            color: "var(--text)",
                            background: "var(--bg)",
                          }}
                          aria-label="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <button
                        onClick={handleAdd}
                        className="w-full py-3 text-sm font-medium transition-opacity hover:opacity-85"
                        style={{
                          background: "var(--brand)",
                          color: "#fff",
                          borderRadius: "var(--radius-btn)",
                          fontFamily: "var(--font-sans)",
                        }}
                      >
                        Add to cart — ${(sticker.price * qty).toFixed(2)}
                      </button>
                    </div>
                  </motion.div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
