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
};

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);
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

    // Auto-enrich
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

  function daysColor(d: number) {
    return d <= 14 ? "#e05c5c" : d <= 40 ? "#c9a84c" : "#4caf7d";
  }

  const totalARR = companies.reduce((sum, c) =>
    sum + c.contracts.reduce((s, ct) => s + (ct.arr || 0), 0), 0);
  const urgentCount = companies.filter(c =>
    c.contracts.some(ct => ct.renew_days <= 30 && ct.renewal_status !== 'renewed')).length;

  if (!isLoaded || !user) return null;

  return (
    <main style={{ fontFamily: "Georgia, serif", background: "#0d0d0f", color: "#e8e4dc", minHeight: "100vh" }}>
      <nav style={{ padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(201,168,76,0.15)", background: "#161619" }}>
        <a href="/" style={{ fontWeight: 700, fontSize: 16, color: "#c9a84c", textDecoration: "none" }}>Ozhenai</a>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a href="/timeline" style={{ fontSize: 13, color: "#a8a49c", textDecoration: "none" }}>Timeline</a>
          <a href="/inbox" style={{ fontSize: 13, color: "#a8a49c", textDecoration: "none" }}>Inbox</a>
          <a href="/settings" style={{ fontSize: 13, color: "#a8a49c", textDecoration: "none" }}>Settings</a>
          <span style={{ fontSize: 12, color: "#6a675f" }}>{user.emailAddresses[0].emailAddress}</span>
          <button onClick={() => signOut(() => router.push("/"))}
            style={{ fontSize: 11, color: "#c9a84c", background: "transparent", border: "none", cursor: "pointer", fontFamily: "monospace" }}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e8e4dc" }}>
              {user?.firstName ? `${user.firstName}'s Dashboard` : "Dashboard"}
            </h1>
            <p style={{ fontSize: 12, color: "#6a675f", marginTop: 4, fontFamily: "monospace" }}>
              {companies.length} companies
            </p>
          </div>
          <button onClick={() => setShowAdd(true)}
            style={{ background: "#c9a84c", color: "#0d0d0f", padding: "9px 20px", borderRadius: 8, fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer" }}>
            + Add Company
          </button>
        </div>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 28 }}>
          {[
            { label: "Total Companies", value: companies.length },
            { label: "Urgent Renewals", value: urgentCount },
            { label: "Total ARR", value: "€" + totalARR.toLocaleString() },
            { label: "Avg Health", value: Math.round(companies.reduce((s, c) => s + (c.health || 0), 0) / (companies.length || 1)) + "/100" }
          ].map(s => (
            <div key={s.label} style={{ background: "#161619", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 10, padding: "16px 20px" }}>
              <div style={{ fontSize: 10, color: "#6a675f", textTransform: "uppercase", letterSpacing: "0.1em", fontFamily: "monospace", marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* COMPANY LIST */}
        {loading ? (
          <p style={{ color: "#a8a49c" }}>Loading...</p>
        ) : companies.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 40px", background: "#161619", borderRadius: 16, border: "1px solid rgba(201,168,76,0.1)" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
            <h2 style={{ fontSize: 20, marginBottom: 8 }}>No companies yet</h2>
            <p style={{ color: "#a8a49c", fontSize: 15, marginBottom: 24 }}>Add your first company to start the agent</p>
            <button onClick={() => setShowAdd(true)}
              style={{ background: "#c9a84c", color: "#0d0d0f", padding: "12px 28px", borderRadius: 8, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
              Add first company
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {companies.map(company => {
              const totalContractARR = company.contracts.reduce((s, ct) => s + (ct.arr || 0), 0);
              const urgentContract = company.contracts.find(ct => ct.renew_days <= 30 && ct.renewal_status !== 'renewed');
              const nextRenewal = company.contracts.length > 0
                ? Math.min(...company.contracts.map(ct => ct.renew_days))
                : null;

              return (
                <div key={company.id}
                  onClick={() => router.push(`/company/${company.id}`)}
                  style={{ background: "#161619", border: urgentContract ? "1px solid rgba(224,92,92,0.3)" : "1px solid rgba(201,168,76,0.1)", borderRadius: 12, padding: "20px 24px", cursor: "pointer", display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: 16 }}>{company.name}</div>
                      {company.domain && <div style={{ fontSize: 11, color: "#6a675f", fontFamily: "monospace" }}>{company.domain}</div>}
                      {urgentContract && <span style={{ fontSize: 10, background: "rgba(224,92,92,0.15)", color: "#e05c5c", padding: "2px 8px", borderRadius: 20, fontFamily: "monospace" }}>URGENT</span>}
                    </div>
                    <div style={{ display: "flex", gap: 20, fontSize: 13, color: "#a8a49c" }}>
                      {company.industry && <span>{company.industry}</span>}
                      <span>{company.contacts.length} contact{company.contacts.length !== 1 ? 's' : ''}</span>
                      <span>{company.contracts.length} contract{company.contracts.length !== 1 ? 's' : ''}</span>
                      {company.latest_news && <span style={{ color: "#6a675f", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📰 {company.latest_news}</span>}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
                    {nextRenewal !== null && (
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 11, color: "#6a675f", fontFamily: "monospace", marginBottom: 2 }}>NEXT RENEWAL</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: daysColor(nextRenewal) }}>{nextRenewal}d</div>
                      </div>
                    )}
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "#6a675f", fontFamily: "monospace", marginBottom: 2 }}>ARR</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>€{totalContractARR.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 11, color: "#6a675f", fontFamily: "monospace", marginBottom: 2 }}>HEALTH</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: company.health > 80 ? "#4caf7d" : company.health > 60 ? "#c9a84c" : "#e05c5c" }}>{company.health}/100</div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); deleteCompany(company.id, company.name); }}
                      style={{ background: "rgba(224,92,92,0.1)", color: "#e05c5c", border: "1px solid rgba(224,92,92,0.2)", padding: "5px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#161619", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 14, padding: "32px", width: 480 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Add Company</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {[
                { key: "name", label: "Company Name *", placeholder: "Spotify" },
                { key: "domain", label: "Domain", placeholder: "spotify.com" },
                { key: "industry", label: "Industry", placeholder: "Music Streaming" },
                { key: "size", label: "Company Size", placeholder: "Large / Enterprise" },
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
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowAdd(false)}
                style={{ background: "transparent", color: "#6a675f", border: "1px solid rgba(201,168,76,0.2)", padding: "8px 16px", borderRadius: 7, cursor: "pointer", fontSize: 12 }}>
                Cancel
              </button>
              <button onClick={addCompany} disabled={adding}
                style={{ background: "#c9a84c", color: "#0d0d0f", border: "none", padding: "8px 20px", borderRadius: 7, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>
                {adding ? "Adding..." : "Add Company"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}