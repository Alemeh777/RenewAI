"use client";
import { useUser, useClerk } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Contact = {
  id: string;
  name: string;
  email: string;
  job_title: string;
};

type Contract = {
  id: string;
  plan: string;
  arr: number;
  currency: string;
  renew_days: number;
  renewal_status: string;
  contact_id: string;
};

type Company = {
  id: string;
  name: string;
  domain: string;
  industry: string;
  size: string;
  health: number;
  intel: string[];
  latest_news: string;
  upsell: string[];
  risk: string[];
  contacts: Contact[];
  contracts: Contract[];
  meeting_count?: number;
};

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
  const [schedulerRunning, setSchedulerRunning] = useState(false);
  const [filter, setFilter] = useState<"all" | "urgent" | "upsell" | "risk">("all");
  const [form, setForm] = useState({ name: "", domain: "", industry: "", size: "" });

  useEffect(() => {
    if (isLoaded && !user) router.push("/sign-in");
    if (user) fetchCompanies();
  }, [user, isLoaded]);

  async function fetchCompanies() {
    const res = await fetch("/api/companies");
    const data = await res.json();
    setCompanies(data.companies || []);
    setLoading(false);
  }

  async function addCompany() {
    if (!form.name) return;
    if (adding) return;
    setAdding(true);
    const res = await fetch("/api/companies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    const data = await res.json();

    if (data.company && form.domain) {
      try {
        const searchRes = await fetch("/api/search-company", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ company: form.name, domain: form.domain })
        });
        const searchData = await searchRes.json();
        if (searchData.news) {
          await fetch(`/api/companies/${data.company.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              latest_news: searchData.news,
              intel: searchData.intel || [],
              upsell: searchData.upsell_hints || [],
            })
          });
        }
      } catch (e) {}
    }

    setForm({ name: "", domain: "", industry: "", size: "" });
    setShowAdd(false);
    setAdding(false);
    fetchCompanies();
  }

  async function deleteCompany(id: string, name: string) {
    if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
    await fetch("/api/companies", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    });
    fetchCompanies();
  }

  async function runScheduler() {
    setSchedulerRunning(true);
    try {
      const res = await fetch('/api/scheduler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id, manual: true })
      });
      const data = await res.json();
      alert(data.message);
      fetchCompanies();
    } catch (e) {
      alert('Scheduler error. Please try again.');
    }
    setSchedulerRunning(false);
  }

  function daysColor(d: number) {
    return d <= 14 ? "#e05c5c" : d <= 40 ? "#c9a84c" : "#4caf7d";
  }

  // Pipeline stats
  const totalARR = companies.reduce((sum, c) =>
    sum + c.contracts.reduce((s, ct) => s + (ct.arr || 0), 0), 0);
  const urgentCompanies = companies.filter(c =>
    c.contracts.some(ct => ct.renew_days <= 30 && ct.renewal_status !== 'renewed'));
  const urgentARR = urgentCompanies.reduce((sum, c) =>
    sum + c.contracts.filter(ct => ct.renew_days <= 30 && ct.renewal_status !== 'renewed').reduce((s, ct) => s + (ct.arr || 0), 0), 0);
  const upsellCompanies = companies.filter(c => c.upsell?.length > 0);
  const riskCompanies = companies.filter(c => c.risk?.length > 0);
  const renewedCount = companies.filter(c => c.contracts.some(ct => ct.renewal_status === 'renewed')).length;
  const avgHealth = Math.round(companies.reduce((s, c) => s + (c.health || 0), 0) / (companies.length || 1));

  // Filter logic
  const filtered = companies.filter(c => {
    if (filter === "urgent") return c.contracts.some(ct => ct.renew_days <= 30 && ct.renewal_status !== 'renewed');
    if (filter === "upsell") return c.upsell?.length > 0;
    if (filter === "risk") return c.risk?.length > 0;
    return true;
  });

  // Sort: urgent first, then by days to renewal
  const sorted = [...filtered].sort((a, b) => {
    const aMin = a.contracts.length ? Math.min(...a.contracts.map(ct => ct.renew_days)) : 999;
    const bMin = b.contracts.length ? Math.min(...b.contracts.map(ct => ct.renew_days)) : 999;
    return aMin - bMin;
  });

  if (!isLoaded || !user) return null;

  return (
    <main style={{ fontFamily: "Georgia, serif", background: "#0d0d0f", color: "#e8e4dc", minHeight: "100vh" }}>

      {/* NAV */}
      <nav style={{ padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(201,168,76,0.15)", background: "#161619", position: "sticky", top: 0, zIndex: 40 }}>
        <a href="/" style={{ fontWeight: 700, fontSize: 16, color: "#c9a84c", textDecoration: "none", letterSpacing: "-0.01em" }}>Ozhenai</a>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {[
            { label: "Timeline", href: "/timeline" },
            { label: "Inbox", href: "/inbox" },
            { label: "Settings", href: "/settings" },
          ].map(l => (
            <a key={l.label} href={l.href} style={{ fontSize: 13, color: "#a8a49c", textDecoration: "none", padding: "6px 12px", borderRadius: 6 }}>{l.label}</a>
          ))}
          <div style={{ width: 1, height: 16, background: "rgba(201,168,76,0.15)", margin: "0 6px" }} />
          <span style={{ fontSize: 12, color: "#6a675f" }}>{user.emailAddresses[0].emailAddress}</span>
          <button onClick={() => signOut(() => router.push("/"))}
            style={{ fontSize: 11, color: "#c9a84c", background: "transparent", border: "none", cursor: "pointer", fontFamily: "monospace", marginLeft: 4 }}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* PAGE HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
              {user?.firstName ? `${user.firstName}'s pipeline` : "Pipeline"}
            </h1>
            <p style={{ fontSize: 12, color: "#6a675f", fontFamily: "monospace" }}>
              {companies.length} {companies.length === 1 ? "company" : "companies"} · {renewedCount} renewed this cycle
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={runScheduler} disabled={schedulerRunning}
              style={{ background: "rgba(76,175,125,0.12)", color: "#4caf7d", padding: "8px 18px", borderRadius: 8, fontWeight: 700, fontSize: 12, border: "1px solid rgba(76,175,125,0.25)", cursor: "pointer", fontFamily: "monospace" }}>
              {schedulerRunning ? "Running..." : "⚡ Run scheduler"}
            </button>
            <button onClick={() => setShowAdd(true)}
              style={{ background: "#c9a84c", color: "#0d0d0f", padding: "8px 20px", borderRadius: 8, fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer" }}>
              + Add company
            </button>
          </div>
        </div>

        {/* PIPELINE HEALTH BAR */}
        {companies.length > 0 && (
          <div style={{ background: "#161619", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 14, padding: "20px 24px", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#6a675f", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em" }}>Pipeline health</div>
              <div style={{ fontSize: 12, color: "#a8a49c" }}>€{totalARR.toLocaleString()} total ARR</div>
            </div>
            {/* Health bar */}
            <div style={{ height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ height: "100%", width: `${avgHealth}%`, background: avgHealth > 75 ? "#4caf7d" : avgHealth > 55 ? "#c9a84c" : "#e05c5c", borderRadius: 4, transition: "width 0.6s ease" }} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0 }}>
              {[
                { label: "Avg health", value: `${avgHealth}/100`, color: avgHealth > 75 ? "#4caf7d" : avgHealth > 55 ? "#c9a84c" : "#e05c5c" },
                { label: "Urgent renewals", value: urgentCompanies.length, color: urgentCompanies.length > 0 ? "#e05c5c" : "#4caf7d", sub: urgentARR > 0 ? `€${urgentARR.toLocaleString()} at risk` : null },
                { label: "Upsell signals", value: upsellCompanies.length, color: "#4caf7d", sub: "accounts" },
                { label: "Risk signals", value: riskCompanies.length, color: riskCompanies.length > 0 ? "#c9a84c" : "#6a675f", sub: "accounts" },
              ].map((s, i) => (
                <div key={s.label} style={{ paddingLeft: i > 0 ? 20 : 0, borderLeft: i > 0 ? "1px solid rgba(201,168,76,0.08)" : "none" }}>
                  <div style={{ fontSize: 10, color: "#6a675f", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "monospace", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: s.color, letterSpacing: "-0.02em" }}>{s.value}</div>
                  {s.sub && <div style={{ fontSize: 11, color: "#6a675f", fontFamily: "monospace", marginTop: 1 }}>{s.sub}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FILTER TABS */}
        {companies.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {[
              { key: "all", label: `All (${companies.length})` },
              { key: "urgent", label: `🔴 Urgent (${urgentCompanies.length})` },
              { key: "upsell", label: `🚀 Upsell (${upsellCompanies.length})` },
              { key: "risk", label: `⚠️ Risk (${riskCompanies.length})` },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key as any)}
                style={{
                  background: filter === f.key ? "rgba(201,168,76,0.15)" : "transparent",
                  color: filter === f.key ? "#c9a84c" : "#6a675f",
                  border: filter === f.key ? "1px solid rgba(201,168,76,0.3)" : "1px solid rgba(201,168,76,0.1)",
                  padding: "6px 14px", borderRadius: 8, fontSize: 12, cursor: "pointer", fontFamily: "monospace"
                }}>
                {f.label}
              </button>
            ))}
          </div>
        )}

        {/* COMPANY LIST */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#6a675f", fontFamily: "monospace", fontSize: 13 }}>Loading pipeline...</div>
        ) : companies.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 40px", background: "#161619", borderRadius: 16, border: "1px solid rgba(201,168,76,0.1)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>No companies yet</h2>
            <p style={{ color: "#a8a49c", fontSize: 14, marginBottom: 24, lineHeight: 1.7, maxWidth: 360, margin: "0 auto 24px" }}>
              Add your first account and Ozhenai will start tracking renewal signals, meeting intelligence, and email opportunities.
            </p>
            <button onClick={() => setShowAdd(true)}
              style={{ background: "#c9a84c", color: "#0d0d0f", padding: "12px 28px", borderRadius: 8, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
              Add first company
            </button>
          </div>
        ) : sorted.length === 0 ? (
          <div style={{ textAlign: "center", padding: "48px", color: "#6a675f", fontFamily: "monospace", fontSize: 13 }}>
            No accounts match this filter.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {sorted.map(company => {
              const totalContractARR = company.contracts.reduce((s, ct) => s + (ct.arr || 0), 0);
              const isUrgent = company.contracts.some(ct => ct.renew_days <= 30 && ct.renewal_status !== 'renewed');
              const isRenewed = company.contracts.length > 0 && company.contracts.every(ct => ct.renewal_status === 'renewed');
              const nextRenewal = company.contracts.length > 0 ? Math.min(...company.contracts.map(ct => ct.renew_days)) : null;
              const hasUpsell = company.upsell?.length > 0;
              const hasRisk = company.risk?.length > 0;

              return (
                <div key={company.id}
                  onClick={() => router.push(`/company/${company.id}`)}
                  style={{
                    background: "#161619",
                    border: isUrgent ? "1px solid rgba(224,92,92,0.25)" : isRenewed ? "1px solid rgba(76,175,125,0.2)" : "1px solid rgba(201,168,76,0.08)",
                    borderRadius: 12,
                    padding: "18px 22px",
                    cursor: "pointer",
                    display: "grid",
                    gridTemplateColumns: "1fr auto",
                    gap: 20,
                    alignItems: "center",
                    transition: "border-color 0.2s, background 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#1a1a1e")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#161619")}
                >
                  <div>
                    {/* Company name row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{company.name}</div>
                      {company.domain && <div style={{ fontSize: 11, color: "#4a4740", fontFamily: "monospace" }}>{company.domain}</div>}
                      {isUrgent && <span style={{ fontSize: 10, background: "rgba(224,92,92,0.15)", color: "#e05c5c", padding: "2px 8px", borderRadius: 20, fontFamily: "monospace", fontWeight: 700 }}>URGENT</span>}
                      {isRenewed && <span style={{ fontSize: 10, background: "rgba(76,175,125,0.12)", color: "#4caf7d", padding: "2px 8px", borderRadius: 20, fontFamily: "monospace" }}>RENEWED ✓</span>}
                    </div>

                    {/* Signal tags */}
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      {company.industry && <span style={{ fontSize: 12, color: "#6a675f" }}>{company.industry}</span>}
                      {hasUpsell && (
                        <span style={{ fontSize: 11, background: "rgba(76,175,125,0.1)", color: "#4caf7d", padding: "2px 9px", borderRadius: 20, fontFamily: "monospace" }}>
                          🚀 {company.upsell.length} upsell {company.upsell.length === 1 ? "signal" : "signals"}
                        </span>
                      )}
                      {hasRisk && (
                        <span style={{ fontSize: 11, background: "rgba(224,92,92,0.08)", color: "#e05c5c", padding: "2px 9px", borderRadius: 20, fontFamily: "monospace" }}>
                          ⚠️ {company.risk.length} {company.risk.length === 1 ? "risk" : "risks"}
                        </span>
                      )}
                      {company.latest_news && (
                        <span style={{ fontSize: 11, color: "#4a4740", maxWidth: 280, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          📰 {company.latest_news}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right metrics */}
                  <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
                    {nextRenewal !== null && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: "#6a675f", fontFamily: "monospace", marginBottom: 2, textTransform: "uppercase" }}>Renewal</div>
                        <div style={{ fontSize: 18, fontWeight: 700, color: daysColor(nextRenewal), letterSpacing: "-0.02em" }}>{nextRenewal}d</div>
                      </div>
                    )}
                    {totalContractARR > 0 && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 10, color: "#6a675f", fontFamily: "monospace", marginBottom: 2, textTransform: "uppercase" }}>ARR</div>
                        <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em" }}>€{totalContractARR.toLocaleString()}</div>
                      </div>
                    )}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, color: "#6a675f", fontFamily: "monospace", marginBottom: 2, textTransform: "uppercase" }}>Health</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: company.health > 80 ? "#4caf7d" : company.health > 60 ? "#c9a84c" : "#e05c5c", letterSpacing: "-0.02em" }}>{company.health}/100</div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteCompany(company.id, company.name); }}
                      style={{ background: "rgba(224,92,92,0.08)", color: "#e05c5c", border: "1px solid rgba(224,92,92,0.15)", padding: "5px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD COMPANY MODAL */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#161619", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 16, padding: "32px", width: 480 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Add company</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: "transparent", border: "none", color: "#6a675f", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {[
                { key: "name", label: "Company name *", placeholder: "Spotify" },
                { key: "domain", label: "Domain", placeholder: "spotify.com" },
                { key: "industry", label: "Industry", placeholder: "Music streaming" },
                { key: "size", label: "Company size", placeholder: "201–500 employees" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, color: "#6a675f", fontFamily: "monospace", textTransform: "uppercase", display: "block", marginBottom: 4 }}>{f.label}</label>
                  <input
                    value={(form as any)[f.key]}
                    onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    style={{ width: "100%", padding: "9px 12px", background: "#0d0d0f", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 7, color: "#e8e4dc", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              ))}
              {adding && (
                <div style={{ fontSize: 12, color: "#c9a84c", fontFamily: "monospace", textAlign: "center", padding: "8px" }}>
                  Enriching account with latest signals...
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowAdd(false)}
                style={{ background: "transparent", color: "#6a675f", border: "1px solid rgba(201,168,76,0.15)", padding: "8px 16px", borderRadius: 7, cursor: "pointer", fontSize: 13 }}>
                Cancel
              </button>
              <button onClick={addCompany} disabled={adding}
                style={{ background: "#c9a84c", color: "#0d0d0f", border: "none", padding: "8px 24px", borderRadius: 7, fontWeight: 700, cursor: adding ? "default" : "pointer", fontSize: 13, opacity: adding ? 0.7 : 1 }}>
                {adding ? "Adding..." : "Add company"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}