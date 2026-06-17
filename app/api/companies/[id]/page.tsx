"use client";
import { useUser, useClerk } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

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

export default function CompanyPage() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddContract, setShowAddContract] = useState(false);
  const [contactForm, setContactForm] = useState({ name: "", email: "", job_title: "" });
  const [contractForm, setContractForm] = useState({ plan: "", arr: "", currency: "€", renew_days: "90", contact_id: "" });
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [analysingFor, setAnalysingFor] = useState<string | null>(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [generatedEmail, setGeneratedEmail] = useState("");
  const [signals, setSignals] = useState<any>(null);
  const [showSignalsModal, setShowSignalsModal] = useState(false);

  useEffect(() => {
    if (isLoaded && !user) router.push("/sign-in");
    if (user && id) fetchCompany();
  }, [user, isLoaded, id]);

  async function fetchCompany() {
    const res = await fetch(`/api/companies/${id}`);
    const data = await res.json();
    setCompany(data.company);
    setLoading(false);
  }

  async function addContact() {
    if (!contactForm.name || !contactForm.email) return;
    await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...contactForm, company_id: id })
    });
    setContactForm({ name: "", email: "", job_title: "" });
    setShowAddContact(false);
    fetchCompany();
  }

  async function deleteContact(contactId: string) {
    if (!confirm("Delete this contact?")) return;
    await fetch("/api/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: contactId })
    });
    fetchCompany();
  }

  async function addContract() {
    if (!contractForm.plan || !contractForm.arr) return;
    await fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...contractForm,
        arr: parseFloat(contractForm.arr),
        renew_days: parseInt(contractForm.renew_days),
        company_id: id
      })
    });
    setContractForm({ plan: "", arr: "", currency: "€", renew_days: "90", contact_id: "" });
    setShowAddContract(false);
    fetchCompany();
  }

  async function deleteContract(contractId: string) {
    if (!confirm("Delete this contract?")) return;
    await fetch("/api/contracts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: contractId })
    });
    fetchCompany();
  }

  async function updateRenewalStatus(contractId: string, status: string) {
    await fetch("/api/contracts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: contractId, renewal_status: status })
    });
    fetchCompany();
  }

  async function generateEmail(contract: Contract) {
    const contact = company?.contacts.find(c => c.id === contract.contact_id);
    if (!contact) {
      alert("Please assign a contact to this contract first.");
      return;
    }
    setGeneratingFor(contract.id);
    setGeneratedEmail("");
    setShowEmailModal(true);
    try {
      const res = await fetch("/api/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            id: contract.id,
            name: contact.name,
            company: company?.name,
            email: contact.email,
            plan: contract.plan,
            arr: contract.arr,
            currency: contract.currency,
            renew_days: contract.renew_days,
            health: company?.health || 75,
            intel: company?.intel || [],
            latest_news: company?.latest_news || "",
            upsell: company?.upsell || [],
            risk: company?.risk || [],
            renewal_status: contract.renewal_status,
          },
          senderName: user?.firstName + " " + user?.lastName,
          senderEmail: user?.emailAddresses[0].emailAddress,
          businessName: "Ozhenai",
          tone: "warm",
          userId: user?.id
        })
      });
      const data = await res.json();
      setGeneratedEmail(data.email || data.error);
    } catch (e) {
      setGeneratedEmail("Error generating email. Please try again.");
    }
    setGeneratingFor(null);
  }

  async function analyseCompany() {
    setAnalysingFor(id);
    try {
      const res = await fetch("/api/upsell-signals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: id, isCompany: true })
      });
      const data = await res.json();
      setSignals(data);
      setShowSignalsModal(true);
    } catch (e) {
      alert("Error analysing company.");
    }
    setAnalysingFor(null);
  }

  function daysColor(d: number) {
    return d <= 14 ? "#e05c5c" : d <= 40 ? "#c9a84c" : "#4caf7d";
  }

  if (!isLoaded || !user) return null;
  if (loading) return <main style={{ background: "#0d0d0f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#a8a49c", fontFamily: "Georgia, serif" }}>Loading...</main>;
  if (!company) return <main style={{ background: "#0d0d0f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#e05c5c", fontFamily: "Georgia, serif" }}>Company not found.</main>;

  return (
    <main style={{ fontFamily: "Georgia, serif", background: "#0d0d0f", color: "#e8e4dc", minHeight: "100vh" }}>
      <nav style={{ padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(201,168,76,0.15)", background: "#161619" }}>
        <a href="/dashboard" style={{ fontWeight: 700, fontSize: 16, color: "#c9a84c", textDecoration: "none" }}>← Ozhenai</a>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <a href="/inbox" style={{ fontSize: 13, color: "#a8a49c", textDecoration: "none" }}>Inbox</a>
          <a href="/timeline" style={{ fontSize: 13, color: "#a8a49c", textDecoration: "none" }}>Timeline</a>
          <button onClick={() => signOut(() => router.push("/"))}
            style={{ fontSize: 11, color: "#c9a84c", background: "transparent", border: "none", cursor: "pointer", fontFamily: "monospace" }}>
            Sign out
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* COMPANY HEADER */}
        <div style={{ background: "#161619", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 14, padding: "28px 32px", marginBottom: 24, display: "grid", gridTemplateColumns: "1fr auto", gap: 24, alignItems: "start" }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>{company.name}</h1>
            <div style={{ display: "flex", gap: 16, fontSize: 13, color: "#a8a49c", marginBottom: 16 }}>
              {company.domain && <span>{company.domain}</span>}
              {company.industry && <span>{company.industry}</span>}
              {company.size && <span>{company.size}</span>}
            </div>
            {company.latest_news && (
              <div style={{ fontSize: 13, color: "#6a675f", fontStyle: "italic", marginBottom: 12 }}>
                📰 {company.latest_news}
              </div>
            )}
            {company.intel?.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {company.intel.slice(0, 3).map((item, i) => (
                  <span key={i} style={{ fontSize: 11, background: "rgba(201,168,76,0.1)", color: "#c9a84c", padding: "3px 10px", borderRadius: 20 }}>{item}</span>
                ))}
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "#6a675f", fontFamily: "monospace", marginBottom: 2 }}>HEALTH</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: company.health > 80 ? "#4caf7d" : company.health > 60 ? "#c9a84c" : "#e05c5c" }}>{company.health}/100</div>
            </div>
            <button onClick={analyseCompany} disabled={analysingFor === id}
              style={{ background: "rgba(76,175,125,0.15)", color: "#4caf7d", border: "1px solid rgba(76,175,125,0.3)", padding: "7px 16px", borderRadius: 7, fontSize: 12, cursor: "pointer", fontFamily: "monospace" }}>
              {analysingFor === id ? "Analysing..." : "⚡ Analyse"}
            </button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>

          {/* CONTACTS */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Contacts</h2>
              <button onClick={() => setShowAddContact(true)}
                style={{ background: "rgba(201,168,76,0.15)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.3)", padding: "5px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>
                + Add Contact
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {company.contacts.length === 0 ? (
                <div style={{ background: "#161619", border: "1px solid rgba(201,168,76,0.08)", borderRadius: 10, padding: "20px", textAlign: "center", color: "#6a675f", fontSize: 13 }}>
                  No contacts yet
                </div>
              ) : company.contacts.map(contact => (
                <div key={contact.id} style={{ background: "#161619", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{contact.name}</div>
                    <div style={{ fontSize: 12, color: "#a8a49c" }}>{contact.email}</div>
                    {contact.job_title && <div style={{ fontSize: 11, color: "#6a675f", fontFamily: "monospace" }}>{contact.job_title}</div>}
                  </div>
                  <button onClick={() => deleteContact(contact.id)}
                    style={{ background: "transparent", color: "#e05c5c", border: "none", cursor: "pointer", fontSize: 16 }}>✕</button>
                </div>
              ))}
            </div>
          </div>

          {/* CONTRACTS */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Contracts</h2>
              <button onClick={() => setShowAddContract(true)}
                style={{ background: "rgba(201,168,76,0.15)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.3)", padding: "5px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>
                + Add Contract
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {company.contracts.length === 0 ? (
                <div style={{ background: "#161619", border: "1px solid rgba(201,168,76,0.08)", borderRadius: 10, padding: "20px", textAlign: "center", color: "#6a675f", fontSize: 13 }}>
                  No contracts yet
                </div>
              ) : company.contracts.map(contract => {
                const contact = company.contacts.find(c => c.id === contract.contact_id);
                return (
                  <div key={contract.id} style={{ background: "#161619", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 10, padding: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>{contract.plan || "Unnamed plan"}</div>
                        {contact && <div style={{ fontSize: 12, color: "#a8a49c" }}>Contact: {contact.name}</div>}
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 18, fontWeight: 700 }}>{contract.currency}{(contract.arr || 0).toLocaleString()}</div>
                        <div style={{ fontSize: 13, color: daysColor(contract.renew_days), fontWeight: 700 }}>{contract.renew_days}d</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <select
                        value={contract.renewal_status || 'not_started'}
                        onChange={e => updateRenewalStatus(contract.id, e.target.value)}
                        style={{
                          background: contract.renewal_status === 'renewed' ? 'rgba(76,175,125,0.15)' : contract.renewal_status === 'in_discussion' ? 'rgba(201,168,76,0.15)' : 'rgba(224,92,92,0.1)',
                          color: contract.renewal_status === 'renewed' ? '#4caf7d' : contract.renewal_status === 'in_discussion' ? '#c9a84c' : '#e05c5c',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '4px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'monospace'
                        }}>
                        <option value="not_started">not started</option>
                        <option value="in_discussion">in discussion</option>
                        <option value="renewed">renewed ✓</option>
                      </select>
                      <button onClick={() => generateEmail(contract)} disabled={generatingFor === contract.id}
                        style={{ background: "rgba(201,168,76,0.15)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.3)", padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>
                        {generatingFor === contract.id ? "..." : "Generate Email"}
                      </button>
                      <button onClick={() => deleteContract(contract.id)}
                        style={{ background: "rgba(224,92,92,0.1)", color: "#e05c5c", border: "1px solid rgba(224,92,92,0.2)", padding: "4px 10px", borderRadius: 6, fontSize: 11, cursor: "pointer", fontFamily: "monospace" }}>
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* UPSELL / RISK SIGNALS */}
        {(company.upsell?.length > 0 || company.risk?.length > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginTop: 24 }}>
            {company.upsell?.length > 0 && (
              <div style={{ background: "rgba(76,175,125,0.05)", border: "1px solid rgba(76,175,125,0.15)", borderRadius: 12, padding: "20px" }}>
                <div style={{ fontSize: 12, color: "#4caf7d", fontFamily: "monospace", textTransform: "uppercase", marginBottom: 12 }}>🚀 Upsell Signals</div>
                {company.upsell.map((s, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#e8e4dc", marginBottom: 6 }}>— {s}</div>
                ))}
              </div>
            )}
            {company.risk?.length > 0 && (
              <div style={{ background: "rgba(224,92,92,0.05)", border: "1px solid rgba(224,92,92,0.15)", borderRadius: 12, padding: "20px" }}>
                <div style={{ fontSize: 12, color: "#e05c5c", fontFamily: "monospace", textTransform: "uppercase", marginBottom: 12 }}>⚠️ Risk Signals</div>
                {company.risk.map((s, i) => (
                  <div key={i} style={{ fontSize: 13, color: "#e8e4dc", marginBottom: 6 }}>— {s}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ADD CONTACT MODAL */}
      {showAddContact && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#161619", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 14, padding: "32px", width: 420 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Add Contact</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              {[
                { key: "name", label: "Name *", placeholder: "John Smith" },
                { key: "email", label: "Email *", placeholder: "john@company.com" },
                { key: "job_title", label: "Job Title", placeholder: "VP of Engineering" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, color: "#6a675f", fontFamily: "monospace", textTransform: "uppercase", display: "block", marginBottom: 4 }}>{f.label}</label>
                  <input value={(contactForm as any)[f.key]} onChange={e => setContactForm({ ...contactForm, [f.key]: e.target.value })}
                    placeholder={f.placeholder}
                    style={{ width: "100%", padding: "9px 12px", background: "#0d0d0f", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 7, color: "#e8e4dc", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowAddContact(false)} style={{ background: "transparent", color: "#6a675f", border: "1px solid rgba(201,168,76,0.2)", padding: "8px 16px", borderRadius: 7, cursor: "pointer", fontSize: 12 }}>Cancel</button>
              <button onClick={addContact} style={{ background: "#c9a84c", color: "#0d0d0f", border: "none", padding: "8px 20px", borderRadius: 7, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Add Contact</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD CONTRACT MODAL */}
      {showAddContract && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#161619", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 14, padding: "32px", width: 420 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24 }}>Add Contract</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              <div>
                <label style={{ fontSize: 11, color: "#6a675f", fontFamily: "monospace", textTransform: "uppercase", display: "block", marginBottom: 4 }}>Contact</label>
                <select value={contractForm.contact_id} onChange={e => setContractForm({ ...contractForm, contact_id: e.target.value })}
                  style={{ width: "100%", padding: "9px 12px", background: "#0d0d0f", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 7, color: "#e8e4dc", fontSize: 13, outline: "none" }}>
                  <option value="">Select contact...</option>
                  {company.contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {[
                { key: "plan", label: "Plan Name *", placeholder: "Annual Pro" },
                { key: "arr", label: "ARR *", placeholder: "7000" },
                { key: "renew_days", label: "Days to Renewal", placeholder: "90" },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: 11, color: "#6a675f", fontFamily: "monospace", textTransform: "uppercase", display: "block", marginBottom: 4 }}>{f.label}</label>
                  <input value={(contractForm as any)[f.key]} onChange={e => setContractForm({ ...contractForm, [f.key]: e.target.value })}
                    placeholder={f.placeholder} type={f.key === "arr" || f.key === "renew_days" ? "number" : "text"}
                    style={{ width: "100%", padding: "9px 12px", background: "#0d0d0f", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 7, color: "#e8e4dc", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowAddContract(false)} style={{ background: "transparent", color: "#6a675f", border: "1px solid rgba(201,168,76,0.2)", padding: "8px 16px", borderRadius: 7, cursor: "pointer", fontSize: 12 }}>Cancel</button>
              <button onClick={addContract} style={{ background: "#c9a84c", color: "#0d0d0f", border: "none", padding: "8px 20px", borderRadius: 7, fontWeight: 700, cursor: "pointer", fontSize: 12 }}>Add Contract</button>
            </div>
          </div>
        </div>
      )}

      {/* EMAIL MODAL */}
      {showEmailModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#161619", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 14, padding: "28px", width: 560, maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700 }}>Generated Email</h2>
              <button onClick={() => setShowEmailModal(false)} style={{ background: "transparent", border: "none", color: "#a8a49c", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            {generatingFor ? (
              <p style={{ color: "#a8a49c" }}>Generating...</p>
            ) : (
              <>
                <div style={{ fontSize: 13, lineHeight: 1.8, whiteSpace: "pre-wrap", color: "#e8e4dc", marginBottom: 20 }}>{generatedEmail}</div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { navigator.clipboard.writeText(generatedEmail); alert("Copied!"); }}
                    style={{ flex: 1, background: "rgba(201,168,76,0.15)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.3)", padding: "10px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    Copy
                  </button>
                  <button onClick={() => { setShowEmailModal(false); router.push("/inbox"); }}
                    style={{ flex: 1, background: "#c9a84c", color: "#0d0d0f", border: "none", padding: "10px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    Review in Inbox →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* SIGNALS MODAL */}
      {showSignalsModal && signals && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#161619", border: "1px solid rgba(201,168,76,0.3)", borderRadius: 14, padding: "32px", width: 560, maxHeight: "80vh", overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700 }}>{company.name} — Intelligence</h2>
              <button onClick={() => setShowSignalsModal(false)} style={{ background: "transparent", border: "none", color: "#a8a49c", fontSize: 20, cursor: "pointer" }}>✕</button>
            </div>
            {signals.upsell_signals?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "#4caf7d", fontFamily: "monospace", textTransform: "uppercase", marginBottom: 10 }}>🚀 Upsell Signals</div>
                {signals.upsell_signals.map((s: string, i: number) => (
                  <div key={i} style={{ background: "rgba(76,175,125,0.08)", border: "1px solid rgba(76,175,125,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 8, fontSize: 13 }}>{s}</div>
                ))}
              </div>
            )}
            {signals.risk_signals?.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "#e05c5c", fontFamily: "monospace", textTransform: "uppercase", marginBottom: 10 }}>⚠️ Risk Signals</div>
                {signals.risk_signals.map((s: string, i: number) => (
                  <div key={i} style={{ background: "rgba(224,92,92,0.08)", border: "1px solid rgba(224,92,92,0.2)", borderRadius: 8, padding: "10px 14px", marginBottom: 8, fontSize: 13 }}>{s}</div>
                ))}
              </div>
            )}
            {signals.action_reason && (
              <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)", borderRadius: 8, padding: "14px", marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "#c9a84c", fontFamily: "monospace", textTransform: "uppercase", marginBottom: 6 }}>Action</div>
                <div style={{ fontSize: 13 }}>{signals.action_reason}</div>
              </div>
            )}
            <button onClick={() => setShowSignalsModal(false)}
              style={{ width: "100%", background: "#c9a84c", color: "#0d0d0f", padding: "12px", borderRadius: 10, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}