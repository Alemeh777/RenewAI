import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { customer, senderName, senderEmail, businessName, tone, userId } = await req.json();

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

  const system = `You are writing a renewal email on behalf of ${senderName || "a customer success manager"} at ${businessName || "a SaaS company"}.

You are NOT an AI assistant writing an email. You ARE ${senderName || "the sender"} — write in first person as if you are them.

Rules you must follow without exception:
- Never start with "I hope", "I wanted to reach out", "touching base", "checking in", "I'm writing to"
- No corporate language. No buzzwords. No "value proposition" or "synergy" or "leverage"
- Short sentences. Short paragraphs. Maximum 3 paragraphs total.
- Start with something specific and direct — a question, an observation, or a fact about them
- If you don't have much information about the customer, ask one genuine question rather than pretending you know everything
- Sound like an email written by a real person in 5 minutes on a Tuesday morning
- One clear ask at the end — a call, a reply, a yes or no. Nothing more.
- Use the latest news only as one natural sentence if relevant — never as the main topic
- The email is about their renewal and your relationship — not about features or benefits

Tone: ${toneDesc}

After the email body, on a new line write: Subject: [subject here]`;

  const userPrompt = `Write a personalised renewal email for:

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

  // CRM enrichment
  let crmContext = '';
  if (userId) {
    try {
      const enrichRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/crm-enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          customerEmail: customer.email, 
          customerCompany: customer.company,
          userId 
        })
      });
      const enrichData = await enrichRes.json();
      if (enrichData.enrichment?.hubspot) {
        const h = enrichData.enrichment.hubspot;
        crmContext += `\nHubSpot data: Job title: ${h.job_title || 'unknown'}, Last contacted: ${h.last_contacted || 'unknown'}, Contact count: ${h.contact_count || 0}`;
      }
      if (enrichData.enrichment?.hubspot_company) {
        const c = enrichData.enrichment.hubspot_company;
        crmContext += `\nCompany data: Industry: ${c.industry || 'unknown'}, Employees: ${c.employees || 'unknown'}`;
      }
      if (enrichData.enrichment?.dynamics) {
        const d = enrichData.enrichment.dynamics;
        crmContext += `\nDynamics data: Job title: ${d.job_title || 'unknown'}`;
      }
    } catch (err) {
      console.error('CRM enrichment failed:', err);
    }
  }

  // Append CRM context to user prompt if available
  const finalUserPrompt = crmContext 
    ? userPrompt + `\n\nCRM Intelligence:${crmContext}` 
    : userPrompt;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: finalUserPrompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // Extract subject line
    const subjectMatch = text.match(/Subject:\s*(.+)/i);
    const subject = subjectMatch ? subjectMatch[1].trim() : `Renewal — ${customer.company}`;
    const body = text.replace(/Subject:\s*.+/i, "").trim();

    // Save to approval queue
    if (userId) {
      const { error: queueError } = await supabase.from("approval_queue").insert({
        user_id: userId,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_company: customer.company,
        email_subject: subject,
        email_body: body,
        email_type: "renewal",
        status: "pending",
      });
      if (queueError) console.error("Queue insert error:", queueError);
else console.log("Saved to queue successfully");
    }

    return NextResponse.json({ email: text });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}