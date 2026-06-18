'use client';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';



type ThreadMessage = {
  from?: string;
  body: string;
  received_at?: string;
  sent_at?: string;
  direction?: string;
  subject?: string;
};

type QueueItem = {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_company: string;
  email_subject: string;
  email_body: string;
  email_type: string;
  status: string;
  created_at: string;
  thread_history: ThreadMessage[];
};

export default function InboxPage() {
  const { user } = useUser();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<QueueItem | null>(null);
  const [sending, setSending] = useState(false);
  const [editing, setEditing] = useState(false);
const [editedBody, setEditedBody] = useState('');

  useEffect(() => {
    if (user) fetchQueue();
  }, [user]);

 async function fetchQueue() {
  const res = await fetch('/api/queue');
  const data = await res.json();
  setQueue(data.queue || []);
  setLoading(false);
}

async function approveAndSend(item: QueueItem) {
  setSending(true);
  const finalBody = editing ? editedBody : item.email_body;

  // Update body if edited
  if (editing) {
    await fetch('/api/queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, status: 'pending', email_body: finalBody })
    });
  }

  // Actually send the email
  const res = await fetch('/api/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      queueId: item.id,
      senderName: user?.firstName + ' ' + user?.lastName,
      senderEmail: user?.emailAddresses[0].emailAddress,
    })
  });

  const data = await res.json();

  if (data.success) {
    setQueue(q => q.filter(i => i.id !== item.id));
    setSelected(null);
    setEditing(false);
    alert(`Email sent to ${item.customer_email}!`);
  } else {
    alert(`Failed to send: ${data.error}`);
  }
  setSending(false);
}

async function reject(item: QueueItem) {
  await fetch('/api/queue', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: item.id, status: 'rejected' })
  });
  setQueue(q => q.filter(i => i.id !== item.id));
  setSelected(null);
}
  return (
    <main style={{ fontFamily: 'Georgia, serif', background: '#0d0d0f', color: '#e8e4dc', minHeight: '100vh' }}>
      <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: '#c9a84c' }}>Ozhenai</div>
        <div style={{ display: 'flex', gap: 20 }}>
          <a href="/dashboard" style={{ color: '#a8a49c', textDecoration: 'none', fontSize: 14 }}>Dashboard</a>
          <a href="/inbox" style={{ color: '#c9a84c', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>Inbox</a>
        </div>
      </nav>

      <div style={{ padding: '40px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Approval Inbox</h1>
          <p style={{ color: '#a8a49c', fontSize: 15 }}>Review and approve AI-generated emails before they send.</p>
        </div>

        {loading ? (
          <p style={{ color: '#a8a49c' }}>Loading...</p>
        ) : queue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 40px', background: '#161619', borderRadius: 16, border: '1px solid rgba(201,168,76,0.1)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>All caught up!</h2>
            <p style={{ color: '#a8a49c', fontSize: 15 }}>No emails waiting for approval.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.5fr' : '1fr', gap: 24 }}>
            {/* Queue list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {queue.map(item => (
                <div
                  key={item.id}
                  onClick={() => { setSelected(item); setEditing(false); }}
                  style={{
                    background: selected?.id === item.id ? '#1e1e22' : '#161619',
                    border: selected?.id === item.id ? '1px solid #c9a84c' : '1px solid rgba(201,168,76,0.13)',
                    borderRadius: 12,
                    padding: '20px 24px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{item.customer_name}</div>
                      <div style={{ color: '#a8a49c', fontSize: 13 }}>{item.customer_company}</div>
                    </div>
                    <span style={{ background: 'rgba(201,168,76,0.15)', color: '#c9a84c', fontSize: 11, padding: '3px 10px', borderRadius: 20, fontFamily: 'monospace' }}>
                      {item.email_type}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: '#e8e4dc', marginBottom: 4, fontWeight: 600 }}>{item.email_subject}</div>
                  <div style={{ fontSize: 12, color: '#6a675f' }}>
                    {new Date(item.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))}
            </div>

            {/* Email preview */}
            {selected && (
              <div style={{ background: '#161619', border: '1px solid rgba(201,168,76,0.13)', borderRadius: 16, padding: '32px', position: 'sticky', top: 24 }}>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, color: '#a8a49c', marginBottom: 4, fontFamily: 'monospace', textTransform: 'uppercase' }}>To</div>
                  <div style={{ fontSize: 14 }}>{selected.customer_name} — {selected.customer_email}</div>
                </div>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 12, color: '#a8a49c', marginBottom: 4, fontFamily: 'monospace', textTransform: 'uppercase' }}>Subject</div>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{selected.email_subject}</div>
                  <button
  onClick={() => { setEditing(!editing); setEditedBody(selected.email_body); }}
  style={{ background: 'transparent', color: '#c9a84c', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 8, padding: '4px 12px', fontSize: 12, cursor: 'pointer', marginTop: 8 }}
>
  {editing ? 'Cancel edit' : '✏️ Edit'}
</button>
                </div>
            
                {selected.thread_history?.length > 0 && (
  <div style={{ marginBottom: 24 }}>
    <div style={{ fontSize: 12, color: '#a8a49c', marginBottom: 12, fontFamily: 'monospace', textTransform: 'uppercase' }}>Conversation history</div>
    {selected.thread_history.map((msg: any, i: number) => (
      <div key={i} style={{
        background: msg.direction === 'outbound' ? 'rgba(201,168,76,0.06)' : '#0d0d0f',
        border: msg.direction === 'outbound' ? '1px solid rgba(201,168,76,0.2)' : '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10, padding: '14px 16px', marginBottom: 8
      }}>
        <div style={{ fontSize: 11, color: msg.direction === 'outbound' ? '#c9a84c' : '#6a675f', marginBottom: 6, fontFamily: 'monospace', display: 'flex', justifyContent: 'space-between' }}>
          <span>{msg.direction === 'outbound' ? '→ You sent' : `← ${msg.from}`}</span>
          <span>{new Date(msg.sent_at || msg.received_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div style={{ fontSize: 13, color: '#e8e4dc', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{msg.body}</div>
      </div>
    ))}
  </div>
)}
                <div style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: 12, color: '#a8a49c', marginBottom: 12, fontFamily: 'monospace', textTransform: 'uppercase' }}>Email</div>
                  {editing ? (
  <textarea
    value={editedBody}
    onChange={e => setEditedBody(e.target.value)}
    style={{
      width: '100%', fontSize: 14, lineHeight: 1.8, color: '#e8e4dc',
      background: '#0d0d0f', border: '1px solid rgba(201,168,76,0.3)',
      borderRadius: 8, padding: 12, minHeight: 200, resize: 'vertical',
      fontFamily: 'Georgia, serif', outline: 'none'
    }}
  />
) : (
  <div style={{ fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: '#e8e4dc' }}>{selected.email_body}</div>
)}
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    onClick={() => approveAndSend(selected)}
                    disabled={sending}
                    style={{ flex: 1, background: '#c9a84c', color: '#0d0d0f', padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}
                  >
                    {sending ? 'Sending...' : '✓ Approve & Send'}
                  </button>
                  <button
                    onClick={() => reject(selected)}
                    style={{ flex: 1, background: 'transparent', color: '#a8a49c', padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 14, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
                  >
                    ✕ Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}