import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import type { WholesaleOrderItem } from "@/types/wholesale";

interface PdfOpts {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: WholesaleOrderItem[];
  grandTotal: number;
  asap: boolean;
  date: string;
}

export function generateOrderPdf(opts: PdfOpts): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const { orderId, customerName, customerEmail, items, grandTotal, asap, date } = opts;

    const doc = new PDFDocument({ margin: 0, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const M = 50;                        // left/right margin
    const PW = doc.page.width;           // 595.28
    const CW = PW - M * 2;              // content width
    const BRAND = "#6B1F2A";
    const GOLD  = "#c9a84c";
    const TEXT  = "#1a0d08";
    const MUTED = "#7a6a5a";

    // ── Header bar ──────────────────────────────────────────────
    const HEADER_H = 82;
    doc.rect(0, 0, PW, HEADER_H).fill(BRAND);

    // Gold bottom rule on header
    doc.rect(0, HEADER_H, PW, 3).fill(GOLD);

    // Logo (left side)
    const logoPath = path.join(process.cwd(), "public", "icon-192.png");
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, M, 11, { width: 60, height: 60 });
    }

    // Order meta (right side)
    const metaX = M + 74;
    const metaW = CW - 74;
    doc.fillColor("rgba(255,255,255,0.55)").fontSize(7).font("Helvetica")
      .text("DESERT FATHERS STUDIO", metaX, 18, { width: metaW, align: "right", characterSpacing: 1.2 });
    doc.fillColor("#fff").fontSize(13).font("Helvetica-Bold")
      .text(orderId, metaX, 31, { width: metaW, align: "right" });
    doc.fillColor("rgba(255,255,255,0.65)").fontSize(8.5).font("Helvetica")
      .text(date, metaX, 50, { width: metaW, align: "right" });
    doc.fillColor("rgba(255,255,255,0.45)").fontSize(7.5).font("Helvetica")
      .text("Wholesale Order Receipt", metaX, 64, { width: metaW, align: "right" });

    let y = HEADER_H + 30;

    // ── Customer card ────────────────────────────────────────────
    const CARD_H = 58;
    doc.roundedRect(M, y, CW, CARD_H, 6).fill("#f5f0ea");
    doc.fillColor(MUTED).fontSize(7).font("Helvetica-Bold")
      .text("ORDER PLACED BY", M + 18, y + 13, { characterSpacing: 1.1 });
    doc.fillColor(TEXT).fontSize(11).font("Helvetica-Bold")
      .text(customerName, M + 18, y + 25);
    doc.fillColor(MUTED).fontSize(8.5).font("Helvetica")
      .text(customerEmail, M + 18, y + 40);
    y += CARD_H + 22;

    // ── ASAP banner ──────────────────────────────────────────────
    if (asap) {
      doc.rect(M, y, CW, 28).fill("#fff3cd");
      doc.fillColor("#856404").fontSize(9).font("Helvetica-Bold")
        .text("ASAP — stock is critically low. Please prioritize.", M + 14, y + 9);
      y += 40;
    }

    // ── Table ────────────────────────────────────────────────────
    const C = {
      name:  M,
      sku:   M + 200,
      qty:   M + 300,
      unit:  M + 355,
      total: M + 420,
    };
    const CWS = {
      name:  190,
      sku:   92,
      qty:   48,
      unit:  58,
      total: CW - 420 + M,
    };

    // Header row
    const TH = 26;
    doc.rect(M, y, CW, TH).fill(BRAND);
    doc.fillColor("#fff").fontSize(8).font("Helvetica-Bold");
    doc.text("Design",  C.name + 10, y + 9, { width: CWS.name });
    doc.text("SKU",     C.sku,        y + 9, { width: CWS.sku,   align: "center" });
    doc.text("Qty",     C.qty,        y + 9, { width: CWS.qty,   align: "center" });
    doc.text("Unit",    C.unit,       y + 9, { width: CWS.unit,  align: "center" });
    doc.text("Total",   C.total,      y + 9, { width: CWS.total, align: "right" });
    y += TH;

    // Data rows
    doc.fontSize(8.5);
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const ROW_H = 26;
      if (y + ROW_H > doc.page.height - 90) { doc.addPage(); y = 50; }

      if (i % 2 === 1) doc.rect(M, y, CW, ROW_H).fill("#f8f4ee");

      doc.fillColor(TEXT).font("Helvetica")
        .text(item.designName, C.name + 10, y + 9, { width: CWS.name - 10, ellipsis: true });
      doc.fillColor(MUTED).fontSize(8)
        .text(item.productId,  C.sku,  y + 9, { width: CWS.sku,  align: "center" });
      doc.fillColor(TEXT).fontSize(8.5)
        .text(String(item.qty),            C.qty,  y + 9, { width: CWS.qty,  align: "center" })
        .text(`$${item.unitPrice.toFixed(2)}`, C.unit, y + 9, { width: CWS.unit, align: "center" });
      doc.fillColor(BRAND).font("Helvetica-Bold")
        .text(`$${item.lineTotal.toFixed(2)}`, C.total, y + 9, { width: CWS.total, align: "right" });
      y += ROW_H;
    }

    // Gold separator before grand total
    y += 6;
    doc.moveTo(M, y).lineTo(M + CW, y).strokeColor(GOLD).lineWidth(1.5).stroke();
    y += 10;

    // Grand total row
    doc.fillColor(TEXT).fontSize(10).font("Helvetica-Bold")
      .text("Grand Total", M, y, { width: CW - CWS.total - 6, align: "right" });
    doc.fillColor(GOLD).fontSize(13).font("Helvetica-Bold")
      .text(`$${grandTotal.toFixed(2)}`, C.total, y - 1, { width: CWS.total, align: "right" });

    // ── Footer ───────────────────────────────────────────────────
    const FY = doc.page.height - 48;
    doc.moveTo(M, FY).lineTo(M + CW, FY).strokeColor("#e0d4c8").lineWidth(0.5).stroke();
    doc.fillColor(MUTED).fontSize(7.5).font("Helvetica")
      .text("Desert Fathers Studio  ·  desertfathersstudio.com  ·  desertfathersstudio@gmail.com",
        M, FY + 9, { align: "center", width: CW });
    doc.fillColor("#b0a090").fontSize(7).font("Helvetica-Oblique")
      .text("Thank you for your order — God bless your ministry",
        M, FY + 22, { align: "center", width: CW });

    doc.end();
  });
}
