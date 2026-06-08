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
 try { const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { customerId } = await req.json();

  const { data: customer } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (!customer) return NextResponse.json({ error: 'Customer not found' }, { status: 404 });

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    system: `You are a customer success analyst. Analyze customer data and identify upsell opportunities and risks.
    
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
      content: `Analyze this customer:
Name: ${customer.name}
Company: ${customer.company}
Plan: ${customer.plan}
ARR: ${customer.currency}${customer.arr}/year
Renewal in: ${customer.renew_days} days
Current health: ${customer.health}/100
Latest news: ${customer.latest_news || 'None'}
Existing intel: ${(customer.intel || []).join(', ') || 'None'}

Identify upsell opportunities (max 3) and risk signals (max 3). Be specific and actionable.`
    }]
  });

  const text = message.content[0].type === 'text' ? message.content[0].text : '{}';
  
  try {
    const signals = JSON.parse(text);
    
    await supabase.from('customers').update({
      upsell: signals.upsell_signals || [],
      risk: signals.risk_signals || [],
      health: signals.health_score || customer.health,
    }).eq('id', customerId);

    return NextResponse.json(signals);
  } catch (err) {
    console.error('Upsell signals error:', err, 'Raw text:', text);
    return NextResponse.json({ error: 'Failed to parse signals' }, { status: 500 });
  }
  await supabase.from('customers').update({
      upsell: signals.upsell_signals || [],
      risk: signals.risk_signals || [],
      health: signals.health_score || customer.health,
    }).eq('id', customerId);

    return NextResponse.json(signals);
  } catch (err) {
    console.error('Upsell signals error:', err, 'Raw text:', text);
    return NextResponse.json({ error: 'Failed to parse signals' }, { status: 500 });
  }
} catch (err: any) {
  console.error('Upsell route error:', err.message);
  return NextResponse.json({ error: err.message }, { status: 500 });
}
}