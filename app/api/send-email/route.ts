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

  const { data: queueItem } = await supabase
    .from('approval_queue')
    .select('*')
    .eq('id', queueId)
    .single();

  if (!queueItem) return NextResponse.json({ error: 'Email not found' }, { status: 404 });
  // Fetch CSM's custom sending domain if set
  const { data: userSettings } = await supabase
    .from('user_settings')
    .select('sending_name, sending_domain')
    .eq('user_id', userId)
    .single();

  const fromName = userSettings?.sending_name || senderName || 'Ozhenai';
  const fromAddress = userSettings?.sending_domain
    ? `${fromName} <noreply@${userSettings.sending_domain}>`
    : `${fromName} <noreply@info.ozhenai.com>`;

  try {
    // Check if a thread already exists for this customer
    let { data: thread } = await supabase
      .from('email_threads')
      .select('*')
      .eq('customer_id', queueItem.customer_id)
      .eq('user_id', userId)
      .single();

    let replyToAddress: string;
    let headers: Record<string, string> = {};

    if (thread) {
      replyToAddress = thread.reply_to_address;
      // Add threading headers if replying to an existing thread
      if (thread.last_message_id) {
  headers['In-Reply-To'] = thread.last_message_id;
  headers['References'] = thread.last_message_id;
}
    } else {
      const uniqueId = crypto.randomUUID().split('-')[0];
      replyToAddress = `reply-${uniqueId}@info.ozhenai.com`;

      await supabase.from('email_threads').insert({
        user_id: userId,
        customer_id: queueItem.customer_id,
        reply_to_address: replyToAddress,
        thread_history: [],
      });

      const { data: newThread } = await supabase
        .from('email_threads')
        .select('*')
        .eq('customer_id', queueItem.customer_id)
        .eq('user_id', userId)
        .single();
      thread = newThread;
    }

    // Send via Resend
    const sendResult = await resend.emails.send({
      from: fromAddress,
      to: queueItem.customer_email,
      subject: queueItem.email_subject,
      text: queueItem.email_body,
      replyTo: replyToAddress,
      headers,
    });
    console.log('Send result:', JSON.stringify(sendResult));

    // Save outbound email to thread history + update message ID
if (thread) {
  const updatedHistory = [
    ...(thread.thread_history || []),
    {
      from: `${senderName} (Ozhenai)`,
      body: queueItem.email_body,
      subject: queueItem.email_subject,
      direction: 'outbound',
      sent_at: new Date().toISOString()
    }
  ];

  await supabase
    .from('email_threads')
    .update({
      thread_history: updatedHistory,
      last_message_id: sendResult.data?.id ? `<${sendResult.data.id}@resend.dev>` : thread.last_message_id
    })
    .eq('id', thread.id);
}

    // Update queue status
    await supabase
      .from('approval_queue')
      .update({ status: 'approved' })
      .eq('id', queueId);

    // Update customer renewal status
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