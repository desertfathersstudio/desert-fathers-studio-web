"use server";

export interface WholesaleFormState {
  success?: boolean;
  error?: string;
}

export async function sendWholesaleInquiry(
  _prev: WholesaleFormState,
  formData: FormData
): Promise<WholesaleFormState> {
  const fields = {
    name: (formData.get("name") as string)?.trim(),
    church: (formData.get("church") as string)?.trim(),
    email: (formData.get("email") as string)?.trim(),
    phone: (formData.get("phone") as string)?.trim(),
    location: (formData.get("location") as string)?.trim(),
    grades: (formData.get("grades") as string)?.trim(),
    quantity: (formData.get("quantity") as string)?.trim(),
    frequency: (formData.get("frequency") as string)?.trim(),
    designs: (formData.get("designs") as string)?.trim(),
    notes: (formData.get("notes") as string)?.trim(),
  };

  if (!fields.name || !fields.email || !fields.church) {
    return { error: "Name, church, and email are required." };
  }

  const emailBody = `
New Wholesale Inquiry — Desert Fathers Studio
=============================================

Contact Name:        ${fields.name}
Church / Org:        ${fields.church}
Email:               ${fields.email}
Phone:               ${fields.phone || "—"}
City & State:        ${fields.location || "—"}

About the Order
---------------
Grades / Age group:  ${fields.grades || "—"}
Est. qty per order:  ${fields.quantity || "—"}
Order frequency:     ${fields.frequency || "—"}
Designs interested:  ${fields.designs || "—"}

Additional Notes
----------------
${fields.notes || "None"}

=============================================
Reply directly to this email to respond.
  `.trim();

  const html = `
<div style="font-family:sans-serif;max-width:600px;color:#2a1a0e">
  <h2 style="color:#6B1F2A;border-bottom:1px solid #e5d9c8;padding-bottom:12px">
    New Wholesale Inquiry
  </h2>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr><td style="padding:6px 0;color:#888;width:160px">Contact Name</td><td><strong>${fields.name}</strong></td></tr>
    <tr><td style="padding:6px 0;color:#888">Church / Org</td><td><strong>${fields.church}</strong></td></tr>
    <tr><td style="padding:6px 0;color:#888">Email</td><td><a href="mailto:${fields.email}">${fields.email}</a></td></tr>
    <tr><td style="padding:6px 0;color:#888">Phone</td><td>${fields.phone || "—"}</td></tr>
    <tr><td style="padding:6px 0;color:#888">City &amp; State</td><td>${fields.location || "—"}</td></tr>
  </table>
  <h3 style="margin-top:24px;color:#6B1F2A">Order Details</h3>
  <table style="width:100%;border-collapse:collapse;font-size:14px">
    <tr><td style="padding:6px 0;color:#888;width:160px">Grades / Age</td><td>${fields.grades || "—"}</td></tr>
    <tr><td style="padding:6px 0;color:#888">Est. qty / order</td><td>${fields.quantity || "—"}</td></tr>
    <tr><td style="padding:6px 0;color:#888">Frequency</td><td>${fields.frequency || "—"}</td></tr>
    <tr><td style="padding:6px 0;color:#888">Designs</td><td>${fields.designs || "—"}</td></tr>
  </table>
  ${fields.notes ? `<h3 style="margin-top:24px;color:#6B1F2A">Notes</h3><p style="font-size:14px">${fields.notes}</p>` : ""}
</div>
  `.trim();

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    // Dev fallback — log to console so nothing is lost during development
    console.log("[wholesale inquiry]", emailBody);
    return { success: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: "Desert Fathers Studio <inquiries@desertfathersstudio.com>",
        to: "desertfathersstudio@gmail.com",
        reply_to: fields.email,
        subject: `Wholesale Inquiry — ${fields.church || fields.name}`,
        text: emailBody,
        html,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("Resend error:", body);
      return { error: "Failed to send. Please email us directly at desertfathersstudio@gmail.com" };
    }

    return { success: true };
  } catch {
    return { error: "Network error. Please email us directly at desertfathersstudio@gmail.com" };
  }
}
