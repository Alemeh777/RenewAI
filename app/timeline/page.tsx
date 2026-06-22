'use client';
import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Contract = {
  id: string;
  plan: string;
  arr: number;
  currency: string;
  renew_days: number;
  renewal_status: string;
};

type Company = {
  id: string;
  name: string;
  domain: string;
  health: number;
  upsell: string[];
  risk: string[];
  contracts: Contract[];
};

export default function TimelinePage() {
  const { user } = useUser();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchCompanies();
  }, [user]);

  async function fetchCompanies() {
    const res = await fetch('/api/companies');
    const data = await res.json();
    setCompanies(data.companies || []);
    setLoading(false);
  }

  const buckets = [
    { label: '🔴 Urgent', sublabel: '0–30 days', min: 0, max: 30, color: '#e05c5c', bg: 'rgba(224,92,92,0.08)', border: 'rgba(224,92,92,0.2)' },
    { label: '🟡 Soon', sublabel: '31–60 days', min: 31, max: 60, color: '#c9a84c', bg: 'rgba(201,168,76,0.08)', border: 'rgba(201,168,76,0.2)' },
    { label: '🟢 Upcoming', sublabel: '61–90 days', min: 61, max: 90, color: '#4caf7d', bg: 'rgba(76,175,125,0.08)', border: 'rgba(76,175,125,0.2)' },
    { label: '⚪ Later', sublabel: '90+ days', min: 91, max: 9999, color: '#a8a49c', bg: 'rgba(168,164,156,0.05)', border: 'rgba(168,164,156,0.15)' },
  ];

  // Flatten companies into contract rows for timeline
  type TimelineItem = {
    companyId: string;
    companyName: string;
    health: number;
    upsell: string[];
    risk: string[];
    contract: Contract;
  };

  const allItems: TimelineItem[] = companies.flatMap(company =>
    company.contracts.map(contract => ({
      companyId: company.id,
      companyName: company.name,
      health: company.health,
      upsell: company.upsell || [],
      risk: company.risk || [],
      contract,
    }))
  ).filter(item => item.contract.renewal_status !== 'renewed');

  function getBucketItems(min: number, max: number) {
    return allItems.filter(item => item.contract.renew_days >= min && item.contract.renew_days <= max);
  }

  function getBucketARR(min: number, max: number) {
    return getBucketItems(min, max).reduce((sum, item) => sum + (item.contract.arr || 0), 0);
  }

  const totalARR = allItems.reduce((sum, item) => sum + (item.contract.arr || 0), 0);
  const urgentARR = getBucketARR(0, 30);

  function daysColor(d: number) {
    return d <= 30 ? '#e05c5c' : d <= 60 ? '#c9a84c' : '#4caf7d';
  }

  return (
    <main style={{ fontFamily: 'Georgia, serif', background: '#0d0d0f', color: '#e8e4dc', minHeight: '100vh' }}>
      <nav style={{ padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(201,168,76,0.15)' }}>
        <a href="/dashboard" style={{ fontWeight: 700, fontSize: 18, color: '#c9a84c', textDecoration: 'none' }}>Ozhenai</a>
        <div style={{ display: 'flex', gap: 20 }}>
          <a href="/dashboard" style={{ color: '#a8a49c', textDecoration: 'none', fontSize: 14 }}>Dashboard</a>
          <a href="/inbox" style={{ color: '#a8a49c', textDecoration: 'none', fontSize: 14 }}>Inbox</a>
          <a href="/timeline" style={{ color: '#c9a84c', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>Timeline</a>
        </div>
      </nav>

      <div style={{ padding: '40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Renewal Timeline</h1>
          <p style={{ color: '#a8a49c', fontSize: 15 }}>Track upcoming renewals and ARR at stake.</p>
        </div>

        {/* Summary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
          {[
            { label: 'Total ARR', value: `€${totalARR.toLocaleString()}`, color: '#c9a84c' },
            { label: 'At Risk (30d)', value: `€${urgentARR.toLocaleString()}`, color: '#e05c5c' },
            { label: 'Active Contracts', value: allItems.length, color: '#e8e4dc' },
            { label: 'Avg Health', value: `${Math.round(companies.reduce((s, c) => s + (c.health || 0), 0) / (companies.length || 1))}/100`, color: '#4caf7d' },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#161619', border: '1px solid rgba(201,168,76,0.1)', borderRadius: 12, padding: '20px 24px' }}>
              <div style={{ fontSize: 11, color: '#6a675f', textTransform: 'uppercase', letterSpacing: '0.1em', fontFamily: 'monospace', marginBottom: 8 }}>{stat.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {loading ? (
          <p style={{ color: '#a8a49c' }}>Loading...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 24 }}>
            {buckets.map(bucket => {
              const bucketItems = getBucketItems(bucket.min, bucket.max);
              const bucketARR = getBucketARR(bucket.min, bucket.max);
              return (
                <div key={bucket.label} style={{ background: bucket.bg, border: `1px solid ${bucket.border}`, borderRadius: 16, padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 2 }}>{bucket.label}</div>
                      <div style={{ fontSize: 12, color: '#a8a49c', fontFamily: 'monospace' }}>{bucket.sublabel}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: bucket.color }}>€{bucketARR.toLocaleString()}</div>
                      <div style={{ fontSize: 11, color: '#6a675f' }}>{bucketItems.length} contract{bucketItems.length !== 1 ? 's' : ''}</div>
                    </div>
                  </div>

                  {bucketItems.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '24px', color: '#6a675f', fontSize: 13 }}>No contracts in this window</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {bucketItems.map(item => (
                        <div
                          key={item.contract.id}
                          onClick={() => router.push(`/company/${item.companyId}`)}
                          style={{ background: '#0d0d0f', borderRadius: 10, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{item.companyName}</div>
                            <div style={{ fontSize: 12, color: '#a8a49c' }}>{item.contract.plan || 'No plan'}</div>
                            {item.upsell?.length > 0 && (
                              <div style={{ fontSize: 11, color: '#4caf7d', marginTop: 4 }}>🚀 {item.upsell[0]}</div>
                            )}
                            {item.risk?.length > 0 && (
                              <div style={{ fontSize: 11, color: '#e05c5c', marginTop: 2 }}>⚠️ {item.risk[0]}</div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{item.contract.currency}{(item.contract.arr || 0).toLocaleString()}</div>
                            <div style={{ fontSize: 12, color: daysColor(item.contract.renew_days), fontWeight: 700 }}>{item.contract.renew_days}d</div>
                            <div style={{ fontSize: 11, marginTop: 4, color: item.health > 80 ? '#4caf7d' : item.health > 60 ? '#c9a84c' : '#e05c5c' }}>
                              {item.health}/100
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}