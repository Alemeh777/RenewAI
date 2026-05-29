import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  const { customer, senderName, senderEmail, businessName, tone } = await req.json();

  if (!customer) {
    return NextResponse.json({ error: "Customer required" }, { status: 400 });
  }

  const toneDescMap: { [key: string]: string } = {
  warm: "warm, personal and genuinely caring — like a trusted friend in business",
  professional: "professional and direct",
  founder: "casual founder-to-founder peer",
  consultative: "consultative and data-driven advisor"
};
const toneDesc = toneDescMap[tone || "warm"] || "warm and personal";

  const system = `You are an expert customer success email writer for ${businessName || "a SaaS company"}.
Sender: ${senderName || "The team"} (${senderEmail || ""})
Tone: ${toneDesc}

Write hyper-personalised renewal and upsell emails that feel like a HUMAN wrote them specifically for this customer. Reference their actual situation, growth, pain points. Be specific. Be real. Be concise. Never use templates or generic phrases like "I hope this email finds you well" or "checking in".

After the email body, add one final line: Subject: [your subject here]`;

  const user = `Write a personalised renewal email for:

Name: ${customer.name}
Company: ${customer.company}
Email: ${customer.email}
Plan: ${customer.plan || "unknown"} — ${customer.currency || "€"}${customer.arr || 0}/yr
Renewal in: ${customer.renew_days || 30} days
Health score: ${customer.health || 75}/100

Intelligence:
${(customer.intel || []).map((i: string) => "- " + i).join("\n") || "No intel yet"}

Latest news: ${customer.latest_news || "None"}
Upsell opportunities: ${(customer.upsell || []).join(", ") || "None"}
Risk signals: ${(customer.risk || []).join(", ") || "None"}

Write the email. Make it feel hand-written and specific to this person only.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: user }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    
    return NextResponse.json({ email: text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}