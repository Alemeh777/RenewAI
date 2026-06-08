import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// This route can be called by a cron job or manually
export async function POST(req: Request) {
  const { userId, manual } = await req.json();
  
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get all customers due for renewal in 30 days
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', userId)
    .lte('renew_days', 30)
    .not('renewal_status', 'in', '("renewed","in_discussion")');

  if (!customers || customers.length === 0) {
    return NextResponse.json({ message: 'No customers need outreach', processed: 0 });
  }

  // Check which customers already have a pending email
  const { data: pendingEmails } = await supabase
    .from('approval_queue')
    .select('customer_id')
    .eq('user_id', userId)
    .eq('status', 'pending');

  const pendingCustomerIds = new Set(pendingEmails?.map(e => e.customer_id) || []);

  // Filter out customers already in queue
  const toProcess = customers.filter(c => !pendingCustomerIds.has(c.id));

  if (toProcess.length === 0) {
    return NextResponse.json({ message: 'All due customers already have pending emails', processed: 0 });
  }

  let processed = 0;
  const results = [];

  for (const customer of toProcess) {
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: `You are writing a renewal email on behalf of a customer success manager.
Write in first person. No corporate language. Short sentences. Max 3 paragraphs.
Never start with "I hope", "touching base", or "checking in".
After the email body, write: Subject: [subject here]`,
        messages: [{
          role: 'user',
          content: `Write a personalised renewal email for:
Name: ${customer.name}
Company: ${customer.company}
Plan: ${customer.plan || 'unknown'} — ${customer.currency || '€'}${customer.arr || 0}/yr
Renewal in: ${customer.renew_days} days
Health score: ${customer.health}/100
Latest news: ${customer.latest_news || 'None'}
Upsell signals: ${(customer.upsell || []).join(', ') || 'None'}
Risk signals: ${(customer.risk || []).join(', ') || 'None'}`
        }]
      });

      const text = message.content[0].type === 'text' ? message.content[0].text : '';
      const subjectMatch = text.match(/Subject:\s*(.+)/i);
      const subject = subjectMatch ? subjectMatch[1].trim() : `Renewal — ${customer.company}`;
      const body = text.replace(/Subject:\s*.+/i, '').trim();

      await supabase.from('approval_queue').insert({
        user_id: userId,
        customer_id: customer.id,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_company: customer.company,
        email_subject: subject,
        email_body: body,
        email_type: 'renewal',
        status: 'pending',
      });

      // Update renewal status to in_discussion
      await supabase.from('customers')
        .update({ renewal_status: 'in_discussion' })
        .eq('id', customer.id);

      processed++;
      results.push({ company: customer.company, status: 'queued' });
    } catch (err: any) {
      results.push({ company: customer.company, status: 'error', error: err.message });
    }
  }

  return NextResponse.json({ 
    message: `Processed ${processed} customers`,
    processed,
    results
  });
}