import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import Anthropic from '@anthropic-ai/sdk';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  try {
    const event = await req.json();

    if (event.type !== 'email.received') {
      return NextResponse.json({ received: true });
    }

    console.log('Full inbound event:', JSON.stringify(event, null, 2));
const { from, to, subject, email_id } = event.data;

// Fetch the full email body using the Receiving API
const emailRes = await fetch(`https://api.resend.com/emails/receiving/${email_id}`, {
  headers: {
    'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
  }
});
const emailData = await emailRes.json();
const text = emailData.text || emailData.html || '';
// Strip quoted reply text - only keep the actual reply
// Take only the part before the quoted reply
const cleanText = text
  .split(/\nOn [\s\S]+?wrote:/)[0]
  .split('\n')
  .filter((line: string) => !line.startsWith('>'))
  .join('\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim();
    // Extract the unique reply ID from the "to" address
    // Format: reply-{uniqueId}@info.ozhenai.com
    const toAddress = Array.isArray(to) ? to[0] : to;
    const match = toAddress.match(/reply-([a-zA-Z0-9-]+)@/);

    if (!match) {
      console.log('No reply ID found in:', toAddress);
      return NextResponse.json({ received: true });
    }

    const replyId = match[1];

    // Find the thread
    const { data: thread } = await supabase
      .from('email_threads')
      .select('*')
      .eq('reply_to_address', toAddress)
      .single();

    if (!thread) {
      console.log('No thread found for:', toAddress);
      return NextResponse.json({ received: true });
    }
    console.log('Thread found:', thread.id, 'customer_id:', thread.customer_id);

    // Try customers table first, then contracts
let customer: any = null;
let customerEmail = '';
let customerName = '';
let customerCompany = '';

const { data: oldCustomer } = await supabase
  .from('customers')
  .select('*')
  .eq('id', thread.customer_id)
  .single();

if (oldCustomer) {
  customer = oldCustomer;
  customerEmail = oldCustomer.email;
  customerName = oldCustomer.name;
  customerCompany = oldCustomer.company;
} else {
  // Try new contracts table
  const { data: contract } = await supabase
    .from('contracts')
    .select('*, contacts(*), companies(*)')
    .eq('id', thread.customer_id)
    .single();

  if (contract) {
    customer = contract;
    const contact = contract.contacts;
    const company = contract.companies;
    customerEmail = contact?.email || '';
    customerName = contact?.name || '';
  customerCompany = company?.name || '';
  }
}

console.log('Customer lookup result - name:', customerName, 'email:', customerEmail, 'company:', customerCompany);

if (!customer) {
  console.log('No customer or contract found for thread:', thread.customer_id);
  return NextResponse.json({ received: true });
}
// Save customer's message ID for threading
const customerMessageId = event.data?.message_id;
if (customerMessageId && thread) {
  await supabase
    .from('email_threads')
    .update({ last_message_id: customerMessageId })
    .eq('id', thread.id);
}
    // Update thread history
    const updatedHistory = [
      ...(thread.thread_history || []),
      { from, body: cleanText, received_at: new Date().toISOString() }
    ];

    await supabase
      .from('email_threads')
      .update({ thread_history: updatedHistory, updated_at: new Date().toISOString() })
      .eq('id', thread.id);

    // Generate AI draft response
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: `You are writing a follow-up email on behalf of a customer success manager.
The customer just replied to a renewal email. Write a thoughtful, personal response based on what they said.
No corporate language. Short paragraphs. Sound like a real person.
After the email body, write: Subject: [subject here]`,
      messages: [{
        role: 'user',
        content: `Customer: ${customerName} at ${customerCompany}
Their reply: "${cleanText}"

Account context:
Renewal status: ${customer.renewal_status}
Health score: ${customer.health}/100
Upsell signals: ${(customer.upsell || []).join(', ') || 'None'}

Write a response to their reply.`
      }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const draftBody = responseText.replace(/Subject:\s*.+/i, '').trim();
    const cleanSubject = subject.replace(/^(Re:\s*)+/i, '').trim();
const draftSubject = `Re: ${cleanSubject}`;

    // Save draft to approval queue with reply context
    await supabase.from('approval_queue').insert({
  user_id: thread.user_id,
  customer_id: thread.customer_id,
  customer_name: customerName,
  customer_email: customerEmail,
  customer_company: customerCompany,
  email_subject: draftSubject,
  email_body: draftBody,
  email_type: 'reply',
  status: 'pending',
});

    return NextResponse.json({ received: true, processed: true });
  } catch (err: any) {
    console.error('Inbound email error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}