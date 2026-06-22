import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const { userId, manual } = await req.json();

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get all contracts due for renewal in 30 days, not yet renewed or in discussion
  const { data: contracts } = await supabase
    .from('contracts')
    .select(`
      *,
      companies(*),
      contacts(*)
    `)
    .eq('user_id', userId)
    .lte('renew_days', 30)
    .not('renewal_status', 'in', '("renewed","in_discussion")');

  if (!contracts || contracts.length === 0) {
    return NextResponse.json({ message: 'No contracts need outreach', processed: 0 });
  }

  // Check which contracts already have a pending email
  const { data: pendingEmails } = await supabase
    .from('approval_queue')
    .select('customer_id')
    .eq('user_id', userId)
    .eq('status', 'pending');

  const pendingIds = new Set(pendingEmails?.map(e => e.customer_id) || []);

  // Filter out contracts already in queue
  const toProcess = contracts.filter(c => !pendingIds.has(c.id));

  if (toProcess.length === 0) {
    return NextResponse.json({ message: 'All due contracts already have pending emails', processed: 0 });
  }

  let processed = 0;
  const results = [];

  for (const contract of toProcess) {
    const company = contract.companies;
    const contact = contract.contacts;

    if (!company || !contact) {
      results.push({ contract: contract.id, status: 'skipped - missing company or contact' });
      continue;
    }

    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: `You are writing a renewal email on behalf of a customer success manager.
Write in first person. No corporate language. Short sentences. Max 3 paragraphs.
Never start with "I hope", "touching base", or "checking in".
Never mention contract value, ARR, or price directly.
After the email body, write: Subject: [subject here]`,
        messages: [{
          role: 'user',
          content: `Write a personalised renewal email for:
Name: ${contact.name}
Company: ${company.name}
Plan: ${contract.plan || 'unknown'}
Renewal in: ${contract.renew_days} days
Health score: ${company.health || 75}/100
Latest news: ${company.latest_news || 'None'}
Upsell signals: ${(company.upsell || []).join(', ') || 'None'}
Risk signals: ${(company.risk || []).join(', ') || 'None'}`
        }]
      });

      const text = message.content[0].type === 'text' ? message.content[0].text : '';
      const subjectMatch = text.match(/Subject:\s*(.+)/i);
      const subject = subjectMatch ? subjectMatch[1].trim() : `Renewal — ${company.name}`;
      const body = text.replace(/Subject:\s*.+/i, '').trim();

      // Save to approval queue
      await supabase.from('approval_queue').insert({
        user_id: userId,
        customer_id: contract.id,
        customer_name: contact.name,
        customer_email: contact.email,
        customer_company: company.name,
        email_subject: subject,
        email_body: body,
        email_type: 'renewal',
        status: 'pending',
      });

      // Update contract renewal status to in_discussion
      await supabase.from('contracts')
        .update({ renewal_status: 'in_discussion' })
        .eq('id', contract.id);

      processed++;
      results.push({ company: company.name, contact: contact.name, status: 'queued' });
    } catch (err: any) {
      results.push({ company: company?.name, status: 'error', error: err.message });
    }
  }

  return NextResponse.json({
    message: `Processed ${processed} contracts`,
    processed,
    results
  });
}