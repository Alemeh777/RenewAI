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
    // Send via Resend
    await resend.emails.send({
      from: `${senderName || 'Ozhenai'} <noreply@info.ozhenai.com>`,
      to: queueItem.customer_email,
      subject: queueItem.email_subject,
      text: queueItem.email_body,
      replyTo: senderEmail,
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