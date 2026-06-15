import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { queueId, senderName, senderEmail } = await req.json();

  // Get the email from the queue
  const { data: queueItem } = await supabase
    .from('approval_queue')
    .select('*')
    .eq('id', queueId)
    .single();

  if (!queueItem) return NextResponse.json({ error: 'Email not found' }, { status: 404 });

  try {
    // Check if a thread already exists for this customer
    let { data: thread } = await supabase
      .from('email_threads')
      .select('*')
      .eq('customer_id', queueItem.customer_id)
      .eq('user_id', userId)
      .single();

    let replyToAddress: string;

    if (thread) {
      replyToAddress = thread.reply_to_address;
    } else {
      // Create a unique reply address
      const uniqueId = crypto.randomUUID().split('-')[0];
      replyToAddress = `reply-${uniqueId}@info.ozhenai.com`;

      await supabase.from('email_threads').insert({
        user_id: userId,
        customer_id: queueItem.customer_id,
        reply_to_address: replyToAddress,
        thread_history: [],
      });
    }

    // Send via Resend
    await resend.emails.send({
      from: `${senderName || 'Ozhenai'} <noreply@info.ozhenai.com>`,
      to: queueItem.customer_email,
      subject: queueItem.email_subject,
      text: queueItem.email_body,
      replyTo: replyToAddress,
    });

    // Update queue status to approved
    await supabase
      .from('approval_queue')
      .update({ status: 'approved' })
      .eq('id', queueId);

    // Update customer renewal status to in_discussion
    await supabase
      .from('customers')
      .update({ renewal_status: 'in_discussion' })
      .eq('id', queueItem.customer_id);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Send email error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}