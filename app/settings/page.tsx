'use client';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const { user } = useUser();
  const [hubspotKey, setHubspotKey] = useState('');
  const [dynamicsUrl, setDynamicsUrl] = useState('');
  const [dynamicsKey, setDynamicsKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) loadSettings();
  }, [user]);

  async function loadSettings() {
    const res = await fetch('/api/settings');
    const data = await res.json();
    if (data.settings) {
      setHubspotKey(data.settings.hubspot_key || '');
      setDynamicsUrl(data.settings.dynamics_url || '');
      setDynamicsKey(data.settings.dynamics_key || '');
    }
  }

  async function saveSettings() {
    setSaving(true);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        hubspot_key: hubspotKey,
        dynamics_url: dynamicsUrl,
        dynamics_key: dynamicsKey,
      })
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <main style={{ fontFamily: 'Georgia, serif', background: '#0d0d0f', color: '#e8e4dc', minHeight: '100vh' }}>
      <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: '#c9a84c' }}>Ozhenai</div>
        <div style={{ display: 'flex', gap: 20 }}>
          <a href="/dashboard" style={{ color: '#a8a49c', textDecoration: 'none', fontSize: 14 }}>Dashboard</a>
          <a href="/inbox" style={{ color: '#a8a49c', textDecoration: 'none', fontSize: 14 }}>Inbox</a>
          <a href="/timeline" style={{ color: '#a8a49c', textDecoration: 'none', fontSize: 14 }}>Timeline</a>
          <a href="/settings" style={{ color: '#c9a84c', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>Settings</a>
        </div>
      </nav>

      <div style={{ padding: '40px', maxWidth: 700, margin: '0 auto' }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Settings</h1>
          <p style={{ color: '#a8a49c', fontSize: 15 }}>Connect your CRM to enrich AI-generated emails with real customer data.</p>
        </div>

        {/* HubSpot */}
        <div style={{ background: '#161619', border: '1px solid rgba(201,168,76,0.13)', borderRadius: 16, padding: '28px', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 24 }}>🟠</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>HubSpot</div>
              <div style={{ fontSize: 12, color: '#a8a49c' }}>Pull contact history, deal stage, and notes</div>
            </div>
            {hubspotKey && <span style={{ marginLeft: 'auto', fontSize: 11, background: 'rgba(76,175,125,0.15)', color: '#4caf7d', padding: '3px 10px', borderRadius: 20 }}>Connected ✓</span>}
          </div>
          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 12, color: '#a8a49c', display: 'block', marginBottom: 6 }}>Private App Token</label>
            <input
              type="password"
              value={hubspotKey}
              onChange={e => setHubspotKey(e.target.value)}
              placeholder="pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              style={{ width: '100%', padding: '10px 14px', background: '#0d0d0f', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, color: '#e8e4dc', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 11, color: '#6a675f', marginTop: 6 }}>
              Get your token from HubSpot → Settings → Integrations → Private Apps
            </div>
          </div>
        </div>

        {/* Microsoft Dynamics */}
        <div style={{ background: '#161619', border: '1px solid rgba(201,168,76,0.13)', borderRadius: 16, padding: '28px', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ fontSize: 24 }}>🔵</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>Microsoft Dynamics 365</div>
              <div style={{ fontSize: 12, color: '#a8a49c' }}>Pull contacts and account data</div>
            </div>
            {dynamicsKey && <span style={{ marginLeft: 'auto', fontSize: 11, background: 'rgba(76,175,125,0.15)', color: '#4caf7d', padding: '3px 10px', borderRadius: 20 }}>Connected ✓</span>}
          </div>
          <div style={{ marginTop: 16 }}>
            <label style={{ fontSize: 12, color: '#a8a49c', display: 'block', marginBottom: 6 }}>Dynamics URL</label>
            <input
              type="text"
              value={dynamicsUrl}
              onChange={e => setDynamicsUrl(e.target.value)}
              placeholder="https://yourorg.crm.dynamics.com"
              style={{ width: '100%', padding: '10px 14px', background: '#0d0d0f', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, color: '#e8e4dc', fontSize: 13, outline: 'none', boxSizing: 'border-box', marginBottom: 12 }}
            />
            <label style={{ fontSize: 12, color: '#a8a49c', display: 'block', marginBottom: 6 }}>API Key / Bearer Token</label>
            <input
              type="password"
              value={dynamicsKey}
              onChange={e => setDynamicsKey(e.target.value)}
              placeholder="Bearer token from Azure AD"
              style={{ width: '100%', padding: '10px 14px', background: '#0d0d0f', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 8, color: '#e8e4dc', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ fontSize: 11, color: '#6a675f', marginTop: 6 }}>
              Get your token from Azure Portal → App Registrations → your app → Certificates & Secrets
            </div>
          </div>
        </div>

        <button
          onClick={saveSettings}
          disabled={saving}
          style={{ background: '#c9a84c', color: '#0d0d0f', padding: '12px 32px', borderRadius: 10, fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer' }}>
          {saving ? 'Saving...' : saved ? '✓ Saved!' : 'Save Settings'}
        </button>
      </div>
    </main>
  );
}