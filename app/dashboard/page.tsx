"use client";
import { useUser, useClerk } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: "", company: "", email: "", domain: "",
    plan: "", arr: "", currency: "€", renew_days: "90"
  });
  const [generatedEmail, setGeneratedEmail] = useState<string>("");
const [generatingFor, setGeneratingFor] = useState<string | null>(null);
const [showEmailModal, setShowEmailModal] = useState(false);

  useEffect(() => {
    if (user) fetchCustomers();
  }, [user]);

  async function fetchCustomers() {
    const { data } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", user!.id)
      .order("renew_days", { ascending: true });
    setCustomers(data || []);
    setLoading(false);
  }

  async function addCustomer() {
    if (!form.name || !form.company || !form.email) return;
    await supabase.from("customers").insert({
      ...form,
      arr: parseFloat(form.arr) || 0,
      renew_days: parseInt(form.renew_days) || 90,
      user_id: user!.id,
    });
    // Auto-fetch company news
try {
  const searchRes = await fetch("/api/search-company", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ company: form.company, domain: form.domain })
  });
  const searchData = await searchRes.json();
  if (searchData.news) {
    await supabase.from("customers")
      .update({ latest_news: searchData.news })
      .eq("user_id", user!.id)
      .eq("email", form.email);
  }
} catch (e) {}
    setForm({ name: "", company: "", email: "", domain: "",
      plan: "", arr: "", currency: "€", renew_days: "90" });
    setShowAdd(false);
    fetchCustomers();
  }
  async function generateEmail(customer: any) {
  setGeneratingFor(customer.id);
  setGeneratedEmail("");
  setShowEmailModal(true);
  try {
    const res = await fetch("/api/generate-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer,
        senderName: user?.firstName + " " + user?.lastName,
        senderEmail: user?.emailAddresses[0].emailAddress,
        businessName: "Ozhenai",
        tone: "warm"
      })
    });
    const data = await res.json();
    setGeneratedEmail(data.email || data.error);
  } catch (e) {
    setGeneratedEmail("Error generating email. Please try again.");
  }
  setGeneratingFor(null);
}

  function daysColor(d: number) {
    return d <= 14 ? "#e05c5c" : d <= 40 ? "#c9a84c" : "#4caf7d";
  }

  if (!isLoaded) return null;
  if (!user) {
    if (typeof window !== "undefined") window.location.href = "/";
    return null;
  }

  return (
    <div style={{ fontFamily: "Georgia, serif", background: "#0d0d0f",
                  color: "#e8e4dc", minHeight: "100vh" }}>
      {/* NAV */}
      <nav style={{ padding: "16px 32px", display: "flex",
                    justifyContent: "space-between", alignItems: "center",
                    borderBottom: "1px solid rgba(201,168,76,0.15)",
                    background: "#161619" }}>
        <a href="/" style={{ fontWeight: 700, fontSize: 16,
                              color: "#c9a84c", textDecoration: "none" }}>
          Ozhenai
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 12, color: "#6a675f" }}>
            {user.emailAddresses[0].emailAddress}
          </span>
         <button 
  onClick={() => signOut(() => router.push("/"))}
  style={{ fontSize: 11, color: "#c9a84c", background: "transparent",
           border: "none", cursor: "pointer", fontFamily: "monospace" }}>
  Sign out
</button>
        </div>
      </nav>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "center", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#e8e4dc" }}>
              Customer Intelligence
            </h1>
            <p style={{ fontSize: 12, color: "#6a675f", marginTop: 4,
                        fontFamily: "monospace" }}>
              {customers.length} registered companies
            </p>
          </div>
          <button onClick={() => setShowAdd(true)}
            style={{ background: "#c9a84c", color: "#0d0d0f",
                     padding: "9px 20px", borderRadius: 8, fontWeight: 700,
                     fontSize: 12, border: "none", cursor: "pointer" }}>
            + Add Customer
          </button>
        </div>

        {/* STATS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)",
                      gap: 12, marginBottom: 28 }}>
          {[
            { label: "Total Customers", value: customers.length },
            { label: "Urgent Renewals", value: customers.filter(c=>c.renew_days<=14).length },
            { label: "Total ARR", value: "€" + customers.reduce((s,c)=>s+(c.arr||0),0).toLocaleString() },
            { label: "Avg Health", value: Math.round(customers.reduce((s,c)=>s+(c.health||0),0)/(customers.length||1)) + "/100" }
          ].map(s => (
            <div key={s.label} style={{ background: "#161619",
                 border: "1px solid rgba(201,168,76,0.13)",
                 borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ fontSize: 10, color: "#6a675f", textTransform: "uppercase",
                            letterSpacing: "0.1em", fontFamily: "monospace",
                            marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#e8e4dc" }}>
                {s.value}
              </div>
            </div>
          ))}
        </div>

        {/* CUSTOMER LIST */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 0",
                        color: "#6a675f", fontSize: 13 }}>
            Loading customers...
          </div>
        ) : customers.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0",
                        background: "#161619",
                        border: "1px solid rgba(201,168,76,0.13)",
                        borderRadius: 12 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🧠</div>
            <div style={{ fontSize: 15, color: "#e8e4dc", marginBottom: 8 }}>
              No customers yet
            </div>
            <div style={{ fontSize: 12, color: "#6a675f", marginBottom: 20 }}>
              Add your first customer to start the agent
            </div>
            <button onClick={() => setShowAdd(true)}
              style={{ background: "#c9a84c", color: "#0d0d0f",
                       padding: "9px 20px", borderRadius: 8, fontWeight: 700,
                       fontSize: 12, border: "none", cursor: "pointer" }}>
              Add first customer
            </button>
          </div>
        ) : (
          <div style={{ background: "#161619",
                        border: "1px solid rgba(201,168,76,0.13)",
                        borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse",
                            fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(201,168,76,0.13)" }}>
                  {["Customer", "Company", "Plan", "ARR", "Renewal", "Health", "Action"].map(h => (
                    <th key={h} style={{ padding: "12px 16px", textAlign: "left",
                                         color: "#6a675f", fontWeight: 700,
                                         textTransform: "uppercase",
                                         letterSpacing: "0.08em",
                                         fontFamily: "monospace", fontSize: 10 }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((c, i) => (
                  <tr key={c.id}
                    style={{ borderBottom: i < customers.length-1
                      ? "1px solid rgba(201,168,76,0.08)" : "none" }}>
                    <td style={{ padding: "12px 16px", color: "#e8e4dc",
                                  fontWeight: 700 }}>{c.name}</td>
                    <td style={{ padding: "12px 16px", color: "#a8a49c" }}>
                      {c.company}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#a8a49c" }}>
                      {c.plan || "—"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#e8e4dc" }}>
                      {c.currency}{(c.arr||0).toLocaleString()}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ color: daysColor(c.renew_days),
                                      fontWeight: 700 }}>
                        {c.renew_days}d
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ color: c.health > 80 ? "#4caf7d"
                                    : c.health > 60 ? "#c9a84c" : "#e05c5c" }}>
                        {c.health}/100
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
  <button
    onClick={() => generateEmail(c)}
    style={{ background: "rgba(201,168,76,0.15)", color: "#c9a84c",
             border: "1px solid rgba(201,168,76,0.3)", padding: "5px 12px",
             borderRadius: 6, fontSize: 11, cursor: "pointer",
             fontFamily: "monospace" }}>
    Generate
  </button>
</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
{showEmailModal && (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 100 }}>
    <div style={{ background: "#161619", border: "1px solid rgba(201,168,76,0.3)",
                  borderRadius: 14, padding: "28px", width: 540,
                  maxWidth: "95vw", maxHeight: "90vh", overflow: "auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>Generated Email</div>
        <button onClick={() => setShowEmailModal(false)}
          style={{ background: "transparent", border: "none",
                   color: "#6a675f", cursor: "pointer", fontSize: 18 }}>✕</button>
      </div>
      {generatingFor ? (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#6a675f" }}>
          <div style={{ fontSize: 24, marginBottom: 12 }}>✨</div>
          Agent is reading customer history and writing your email...
        </div>
      ) : (
        <>
          <div style={{ background: "#0d0d0f", border: "1px solid rgba(201,168,76,0.15)",
                        borderRadius: 8, padding: "16px", fontSize: 12,
                        lineHeight: 1.8, color: "#e8e4dc", whiteSpace: "pre-wrap",
                        fontFamily: "Georgia, serif", marginBottom: 14,
                        maxHeight: 320, overflow: "auto" }}>
            {generatedEmail}
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button onClick={() => {navigator.clipboard.writeText(generatedEmail);}}
              style={{ background: "transparent", color: "#c9a84c",
                       border: "1px solid rgba(201,168,76,0.3)", padding: "8px 16px",
                       borderRadius: 7, cursor: "pointer", fontSize: 12 }}>
              Copy Email
            </button>
            <button onClick={() => setShowEmailModal(false)}
              style={{ background: "#c9a84c", color: "#0d0d0f", border: "none",
                       padding: "8px 20px", borderRadius: 7, fontWeight: 700,
                       cursor: "pointer", fontSize: 12 }}>
              Done
            </button>
          </div>
        </>
      )}
    </div>
  </div>
)}
      {/* ADD CUSTOMER MODAL */}
      {showAdd && (
        <div style={{ position: "fixed", inset: 0,
                      background: "rgba(0,0,0,0.8)",
                      display: "flex", alignItems: "center",
                      justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#161619",
                        border: "1px solid rgba(201,168,76,0.3)",
                        borderRadius: 14, padding: "28px", width: 440,
                        maxWidth: "95vw" }}>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
              Add Customer
            </div>
            {[
              { key: "name", label: "Full name", placeholder: "Sofia Lindqvist" },
              { key: "company", label: "Company", placeholder: "Nordlys AB" },
              { key: "email", label: "Email", placeholder: "sofia@nordlys.se" },
              { key: "domain", label: "Domain", placeholder: "nordlys.se" },
              { key: "plan", label: "Plan", placeholder: "Pro — annual" },
              { key: "arr", label: "ARR", placeholder: "2400" },
              { key: "renew_days", label: "Renewal in (days)", placeholder: "90" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "#6a675f", marginBottom: 4,
                              textTransform: "uppercase", letterSpacing: "0.1em",
                              fontFamily: "monospace" }}>{f.label}</div>
                <input
                  value={(form as any)[f.key]}
                  onChange={e => setForm({...form, [f.key]: e.target.value})}
                  placeholder={f.placeholder}
                  style={{ width: "100%", background: "#0d0d0f",
                           border: "1px solid rgba(201,168,76,0.2)",
                           borderRadius: 7, padding: "8px 11px",
                           color: "#e8e4dc", fontSize: 12,
                           fontFamily: "Georgia, serif", outline: "none" }}
                />
              </div>
            ))}
            <div style={{ display: "flex", gap: 8, marginTop: 16,
                          justifyContent: "flex-end" }}>
              <button onClick={() => setShowAdd(false)}
                style={{ background: "transparent", color: "#6a675f",
                         border: "1px solid rgba(201,168,76,0.2)",
                         padding: "8px 16px", borderRadius: 7,
                         cursor: "pointer", fontSize: 12 }}>
                Cancel
              </button>
              <button onClick={addCustomer}
                style={{ background: "#c9a84c", color: "#0d0d0f",
                         border: "none", padding: "8px 20px",
                         borderRadius: 7, fontWeight: 700,
                         cursor: "pointer", fontSize: 12 }}>
                Add Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}