import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('approval_queue')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // For each queue item, fetch the thread history
  const queueWithThreads = await Promise.all((data || []).map(async (item) => {
    const { data: thread } = await supabase
      .from('email_threads')
      .select('thread_history')
      .eq('customer_id', item.customer_id)
      .single();
    return { ...item, thread_history: thread?.thread_history || [] };
  }));

  return NextResponse.json({ queue: queueWithThreads });
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, status, email_body } = await req.json();

  const updateData: any = { status };
  if (email_body) updateData.email_body = email_body;

  const { error } = await supabase
    .from('approval_queue')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}