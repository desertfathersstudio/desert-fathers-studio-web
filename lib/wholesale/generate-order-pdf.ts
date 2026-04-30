import PDFDocument from "pdfkit";
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

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const brand = "#6B1F2A";
    const muted = "#7a6a5a";
    const pageW = doc.page.width - 100; // usable width

    // Header bar
    doc.rect(50, 50, doc.page.width - 100, 56).fill(brand);
    doc.fillColor("#fff")
      .fontSize(8)
      .font("Helvetica")
      .text("DESERT FATHERS STUDIO", 66, 62, { characterSpacing: 1.5 });
    doc.fontSize(14)
      .font("Helvetica")
      .text(`${asap ? "⚡ ASAP — " : ""}Wholesale Order Receipt`, 66, 76);

    // Order meta
    doc.fillColor(muted).fontSize(8).font("Helvetica")
      .text(orderId, doc.page.width - 150, 62, { align: "right", width: 100 })
      .text(date, doc.page.width - 150, 74, { align: "right", width: 100 });

    let y = 130;

    // Customer block
    doc.fillColor("#2a1a0e").fontSize(9).font("Helvetica-Bold").text("Order placed by", 50, y);
    y += 14;
    doc.font("Helvetica").fillColor("#2a1a0e")
      .text(customerName, 50, y)
      .text(customerEmail, 50, y + 12);
    y += 40;

    if (asap) {
      doc.rect(50, y, pageW, 28).fill("#fff3cd");
      doc.fillColor("#856404").fontSize(9).font("Helvetica-Bold")
        .text("⚡ ASAP — stock is critically low. Please prioritize.", 58, y + 9);
      y += 40;
    }

    // Table header
    const colX = { img: 50, name: 50, sku: 270, qty: 340, unit: 390, total: 470 };
    doc.rect(50, y, pageW, 22).fill("#f0e8dc");
    doc.fillColor("#2a1a0e").fontSize(8).font("Helvetica-Bold");
    doc.text("Design", colX.name, y + 7, { width: 200 });
    doc.text("SKU", colX.sku, y + 7, { width: 60, align: "center" });
    doc.text("Qty", colX.qty, y + 7, { width: 40, align: "center" });
    doc.text("Unit", colX.unit, y + 7, { width: 60, align: "center" });
    doc.text("Total", colX.total, y + 7, { width: 60, align: "right" });
    y += 22;

    // Table rows
    doc.font("Helvetica").fontSize(8);
    for (const item of items) {
      const rowH = 24;
      if (y + rowH > doc.page.height - 80) {
        doc.addPage();
        y = 60;
      }
      doc.fillColor("#2a1a0e").text(item.designName, colX.name, y + 7, { width: 210, ellipsis: true });
      doc.fillColor(muted).text(item.productId, colX.sku, y + 7, { width: 60, align: "center" });
      doc.fillColor("#2a1a0e").text(String(item.qty), colX.qty, y + 7, { width: 40, align: "center" });
      doc.text(`$${item.unitPrice.toFixed(2)}`, colX.unit, y + 7, { width: 60, align: "center" });
      doc.fillColor(brand).font("Helvetica-Bold")
        .text(`$${item.lineTotal.toFixed(2)}`, colX.total, y + 7, { width: 60, align: "right" });
      doc.font("Helvetica").fillColor("#2a1a0e");
      doc.moveTo(50, y + rowH).lineTo(50 + pageW, y + rowH).strokeColor("#f0e8dc").lineWidth(0.5).stroke();
      y += rowH;
    }

    // Grand total
    y += 10;
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#2a1a0e")
      .text("Grand Total", colX.unit - 30, y, { width: 110, align: "right" });
    doc.fillColor(brand)
      .text(`$${grandTotal.toFixed(2)}`, colX.total, y, { width: 60, align: "right" });

    // Footer
    const footerY = doc.page.height - 55;
    doc.moveTo(50, footerY).lineTo(50 + pageW, footerY).strokeColor("#f0e8dc").lineWidth(0.5).stroke();
    doc.font("Helvetica").fontSize(7.5).fillColor(muted)
      .text("Desert Fathers Studio · desertfathersstudio.com · desertfathersstudio@gmail.com", 50, footerY + 8, {
        align: "center", width: pageW,
      });

    doc.end();
  });
}
