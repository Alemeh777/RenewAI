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

  const { data } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  return NextResponse.json({ settings: data });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { hubspot_key, dynamics_url, dynamics_key } = await req.json();

  await supabase.from('user_settings').upsert({
    user_id: userId,
    hubspot_key,
    dynamics_url,
    dynamics_key,
    updated_at: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}