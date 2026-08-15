import { NextRequest, NextResponse } from "next/server";

type LeadPayload = {
  formType: "translation-quote" | "introduction";
  name: string;
  email: string;
  company?: string;
  details: string;
  sourceLanguage?: string;
  targetLanguage?: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as LeadPayload;

  if (!body.name || !body.email || !body.details) {
    return NextResponse.json(
      { error: "Name, email, and details are required." },
      { status: 400 }
    );
  }

  const resendKey = process.env.RESEND_API_KEY;
  const notifyTo = process.env.LEAD_NOTIFY_EMAIL;

  if (resendKey && notifyTo) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendKey);
      await resend.emails.send({
        from: "Verba Connect <leads@verbaconnect.com>",
        to: notifyTo,
        replyTo: body.email,
        subject:
          body.formType === "translation-quote"
            ? `New translation quote request — ${body.name}`
            : `New introduction request — ${body.name}`,
        text: [
          `Type: ${body.formType}`,
          `Name: ${body.name}`,
          `Email: ${body.email}`,
          body.company ? `Company: ${body.company}` : "",
          body.sourceLanguage ? `From language: ${body.sourceLanguage}` : "",
          body.targetLanguage ? `To language: ${body.targetLanguage}` : "",
          "",
          "Details:",
          body.details,
        ]
          .filter(Boolean)
          .join("\n"),
      });
    } catch (err) {
      console.error("Resend email failed:", err);
    }
  }

  console.log("New lead received:", body);

  return NextResponse.json({ ok: true });
}
