import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const { companyId, userId, transcript, title } = await req.json();

    if (!companyId || !userId || !transcript) {
      return NextResponse.json(
        { error: 'companyId, userId and transcript are required' },
        { status: 400 }
      );
    }

    // Fetch the company for grounding context
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Ask Claude to extract structured intelligence from the transcript
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: `You are the renewal assistant for a customer success manager (CSM).
You are given the transcript or notes from a meeting with a customer account.
Extract only what is actually present in the text. Never invent facts, names, or numbers.
If a category has nothing, return an empty array (or empty string for summary/next_step).

Return ONLY valid JSON, no preamble and no markdown code fences, in exactly this shape:
{
  "summary": "2-4 sentence recap of what was discussed",
  "commitments": [{ "text": "what was promised", "owner": "who owns it (the CSM, the customer, or a named person)" }],
  "risks": ["concrete churn or dissatisfaction signal raised in the meeting"],
  "upsell_signals": ["concrete sign of expansion appetite or unmet need that maps to more product"],
  "renewal_facts": ["fact that affects the renewal: budget, timing, decision-maker, contract term, competitor mentioned, etc."],
  "next_step": "ONE specific next action grounded in something actually said - an unanswered question, an unowned commitment, a deferred topic. Not generic."
}`,
      messages: [
        {
          role: 'user',
          content: `Account: ${company.name}${company.industry ? ` (${company.industry})` : ''}
Current account health: ${company.health}/100
Known upsell signals: ${(company.upsell || []).join(', ') || 'none on file'}
Known risks: ${(company.risk || []).join(', ') || 'none on file'}

Meeting transcript / notes:
"""
${transcript}
"""

Extract the structured intelligence as specified.`,
        },
      ],
    });

    const raw = message.content[0].type === 'text' ? message.content[0].text : '';

    // Robustly parse the JSON (strip fences, isolate the object)
    let parsed: any;
    try {
      const clean = raw.replace(/```json|```/g, '').trim();
      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      parsed = JSON.parse(clean.slice(firstBrace, lastBrace + 1));
    } catch (e) {
      console.error('Failed to parse extraction JSON:', raw);
      return NextResponse.json(
        { error: 'Could not parse the meeting extraction. Please try again.' },
        { status: 502 }
      );
    }

    const summary = parsed.summary || '';
    const commitments = Array.isArray(parsed.commitments) ? parsed.commitments : [];
    const risks = Array.isArray(parsed.risks) ? parsed.risks : [];
    const upsellSignals = Array.isArray(parsed.upsell_signals) ? parsed.upsell_signals : [];
    const renewalFacts = Array.isArray(parsed.renewal_facts) ? parsed.renewal_facts : [];
    const nextStep = parsed.next_step || '';

    // Save the meeting
    const { data: meeting, error: insertError } = await supabase
      .from('meetings')
      .insert({
        company_id: companyId,
        user_id: userId,
        title: title || 'Meeting',
        transcript,
        summary,
        commitments,
        risks,
        upsell_signals: upsellSignals,
        renewal_facts: renewalFacts,
        next_step: nextStep,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Meeting insert error:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Merge new signals into the company so the account gets smarter
    const mergedUpsell = Array.from(new Set([...(company.upsell || []), ...upsellSignals]));
    const mergedRisk = Array.from(new Set([...(company.risk || []), ...risks]));
    const mergedIntel = Array.from(new Set([...(company.intel || []), ...renewalFacts]));

    await supabase
      .from('companies')
      .update({ upsell: mergedUpsell, risk: mergedRisk, intel: mergedIntel })
      .eq('id', companyId);

    return NextResponse.json({ ok: true, meeting });
  } catch (err: any) {
    console.error('Meeting extraction error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}