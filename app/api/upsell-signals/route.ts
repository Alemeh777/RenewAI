import { auth } from '@clerk/nextjs/server';
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
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { customerId, isCompany } = await req.json();

    const tableName = isCompany ? 'companies' : 'customers';
    const { data: customer } = await supabase
      .from(tableName)
      .select('*')
      .eq('id', customerId)
      .single();

    if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `You are a customer success analyst. Analyze account data and identify upsell opportunities and risks.

CRITICAL RULES for writing signals:
- Every signal must describe the ACCOUNT or CONTRACT, never a named person or individual.
- Wrong: "Sarah has not logged in this month" → Right: "Login activity dropped in the last 30 days"
- Wrong: "Two team members have not activated" → Right: "2 of 25 seats unactivated — onboarding incomplete"
- Wrong: "The CFO is unhappy with pricing" → Right: "Pricing concerns raised during last renewal discussion"
- Use concrete account facts: seat counts, ARR figures, renewal timelines, plan limits, usage rates.
- Never mention names, job titles, or personal attributes.

Always respond with valid JSON only, no other text:
{
  "upsell_signals": ["signal 1", "signal 2"],
  "risk_signals": ["risk 1", "risk 2"],
  "health_score": 75,
  "recommended_action": "upgrade|renew|save|nurture",
  "action_reason": "brief reason"
}`,
      messages: [{
        role: 'user',
        content: `Analyze this account:
Company: ${customer.name || customer.company}
Plan: ${customer.plan || 'Unknown'}
ARR: ${customer.currency || '€'}${customer.arr || 0}/year
Days to renewal: ${customer.renew_days || customer.renewal_date || 'Unknown'}
Current health: ${customer.health || 75}/100
Latest news: ${customer.latest_news || 'None'}
Existing intel: ${(customer.intel || []).join(', ') || 'None'}
Known upsell signals: ${(customer.upsell || []).join(', ') || 'None'}
Known risks: ${(customer.risk || []).join(', ') || 'None'}

Identify upsell opportunities (max 3) and risk signals (max 3).
Write every signal about the account, not about any individual person.
Be specific — use numbers and facts where available.`
      }]
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}';

    try {
      const clean = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const signals = JSON.parse(clean);

      // Save signals back to the correct table
      await supabase.from(tableName).update({
        upsell: signals.upsell_signals || [],
        risk: signals.risk_signals || [],
        health: signals.health_score || customer.health,
      }).eq('id', customerId);

      return NextResponse.json(signals);
    } catch (err) {
      console.error('Upsell signals parse error:', err, 'Raw text:', text);
      return NextResponse.json({ error: 'Failed to parse signals' }, { status: 500 });
    }
  } catch (err: any) {
    console.error('Upsell route error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}