import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY ?? "placeholder");
  const { name, email, message } = await req.json();

  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }

  const from = process.env.RESEND_FROM_EMAIL ?? "noreply@desertfathersstudio.com";

  const { error } = await resend.emails.send({
    from,
    to: "desertfathersstudio@gmail.com",
    subject: "New Suggestion — Desert Fathers Studio",
    text: [
      name ? `From: ${name}` : "From: (anonymous)",
      email ? `Email: ${email}` : null,
      "",
      message.trim(),
    ]
      .filter((l) => l !== null)
      .join("\n"),
  });

  if (error) {
    return NextResponse.json({ error: "Failed to send." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
