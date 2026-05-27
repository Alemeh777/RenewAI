import { Resend } from "resend";
import { NextRequest, NextResponse } from "next/server";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  const { email, customers } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  try {
    await resend.emails.send({
      from: "Ozhenai <hello@ozhenai.com>",
      to: email,
      subject: "You're on the Ozhenai waitlist!",
      html: `
        <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:40px 20px;background:#0d0d0f;color:#e8e4dc;">
          <div style="font-size:22px;font-weight:700;color:#c9a84c;margin-bottom:20px;">Ozhenai</div>
          <h1 style="font-size:24px;margin-bottom:16px;">You're in. 🎉</h1>
          <p style="color:#a8a49c;line-height:1.7;margin-bottom:24px;">
            Thanks for joining the Ozhenai waitlist. We'll reach out personally when early access opens.
          </p>
          <p style="color:#6a675f;font-size:13px;">— The Ozhenai team</p>
        </div>
      `,
    });

    await resend.emails.send({
      from: "Ozhenai <hello@ozhenai.com>",
      to: "tinytalesbyale@gmail.com",
      subject: `New waitlist signup — ${customers || "unknown"} customers`,
      html: `<p>New signup: <strong>${email}</strong><br>Manages: <strong>${customers || "not specified"}</strong> customers</p>`,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}