"use client";
import { useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";

export default function Home() {
  const { isSignedIn, user } = useUser();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [tick, setTick] = useState(0);

  // Animate the hero mock card
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), 2800);
    return () => clearInterval(t);
  }, []);

  const mockAccounts = [
    { name: "Acme Corp", days: 12, arr: "€48,000", health: 62, tag: "⚠️ Competitor risk", tagColor: "#e05c5c", tagBg: "rgba(224,92,92,0.12)" },
    { name: "Northlight SaaS", days: 28, arr: "€22,500", health: 81, tag: "🚀 Upsell ready", tagColor: "#4caf7d", tagBg: "rgba(76,175,125,0.12)" },
    { name: "Vanta Systems", days: 45, arr: "€71,000", health: 77, tag: "📋 Meeting logged", tagColor: "#c9a84c", tagBg: "rgba(201,168,76,0.12)" },
  ];

  const activeAccount = mockAccounts[tick % mockAccounts.length];

  async function joinWaitlist() {
    if (!email) return;
    await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    setSubmitted(true);
  }

  return (
    <main style={{ fontFamily: "Georgia, serif", background: "#0d0d0f", color: "#e8e4dc", minHeight: "100vh", overflowX: "hidden" }}>

      {/* NAV */}
      <nav style={{ padding: "20px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(201,168,76,0.1)", position: "sticky", top: 0, background: "rgba(13,13,15,0.95)", backdropFilter: "blur(12px)", zIndex: 50 }}>
        <div style={{ fontWeight: 700, fontSize: 17, color: "#c9a84c", letterSpacing: "-0.01em" }}>Ozhenai</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a href="/pricing" style={{ color: "#a8a49c", textDecoration: "none", fontSize: 13 }}>Pricing</a>
          {isSignedIn ? (
            <>
              <a href="/dashboard" style={{ background: "#c9a84c", color: "#0d0d0f", padding: "7px 16px", borderRadius: 7, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>
                {user?.firstName ? `${user.firstName}'s dashboard` : "Dashboard"}
              </a>
            </>
          ) : (
            <>
              <a href="/sign-in" style={{ color: "#c9a84c", padding: "7px 16px", borderRadius: 7, fontSize: 13, border: "1px solid rgba(201,168,76,0.4)", textDecoration: "none" }}>Sign in</a>
              <a href="/sign-in" style={{ background: "#c9a84c", color: "#0d0d0f", padding: "7px 16px", borderRadius: 7, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Get started free</a>
            </>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: "80px 48px 60px", maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#c9a84c", fontFamily: "monospace", marginBottom: 20 }}>Renewal intelligence for CSMs</div>
          <h1 style={{ fontSize: "clamp(32px, 4.5vw, 56px)", fontWeight: 700, lineHeight: 1.08, letterSpacing: "-0.025em", margin: "0 0 24px" }}>
            Every contract renewal,{" "}
            <span style={{ color: "#c9a84c" }}>handled like your best one.</span>
          </h1>
          <p style={{ fontSize: 17, color: "#a8a49c", lineHeight: 1.75, maxWidth: 460, margin: "0 0 40px" }}>
            Ozhenai is the AI co-pilot for CSMs managing renewals. Log meetings, spot risks and upsell signals early, and send emails that sound like you — all from one place.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a href="/sign-in" style={{ background: "#c9a84c", color: "#0d0d0f", padding: "13px 32px", borderRadius: 9, fontWeight: 700, fontSize: 15, textDecoration: "none", letterSpacing: "-0.01em" }}>
              Start free
            </a>
            <a href="#how" style={{ color: "#e8e4dc", padding: "13px 24px", borderRadius: 9, fontSize: 15, border: "1px solid rgba(255,255,255,0.1)", textDecoration: "none" }}>
              See how it works →
            </a>
          </div>
          <div style={{ marginTop: 32, display: "flex", gap: 24, fontSize: 12, color: "#6a675f" }}>
            <span>✓ No credit card required</span>
            <span>✓ 5 accounts free forever</span>
            <span>✓ Built for European CSMs</span>
          </div>
        </div>

        {/* ANIMATED PRODUCT MOCK */}
        <div style={{ position: "relative" }}>
          <div style={{ background: "#161619", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 16, padding: "24px", boxShadow: "0 32px 80px rgba(0,0,0,0.5)" }}>
            {/* Mock header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid rgba(201,168,76,0.08)" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#c9a84c" }}>Renewal Pipeline</div>
              <div style={{ fontSize: 11, fontFamily: "monospace", color: "#4caf7d", background: "rgba(76,175,125,0.1)", padding: "3px 10px", borderRadius: 20 }}>3 accounts</div>
            </div>

            {/* Animated account card */}
            <div style={{ background: "#0d0d0f", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 10, padding: "16px", marginBottom: 12, transition: "all 0.4s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4, transition: "all 0.3s" }}>{activeAccount.name}</div>
                  <span style={{ fontSize: 11, background: activeAccount.tagBg, color: activeAccount.tagColor, padding: "3px 10px", borderRadius: 20, fontFamily: "monospace" }}>
                    {activeAccount.tag}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: activeAccount.days <= 14 ? "#e05c5c" : activeAccount.days <= 30 ? "#c9a84c" : "#4caf7d" }}>{activeAccount.days}d</div>
                  <div style={{ fontSize: 11, color: "#6a675f", fontFamily: "monospace" }}>to renewal</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: 12, color: "#6a675f" }}>
                <span>ARR {activeAccount.arr}</span>
                <span>Health {activeAccount.health}/100</span>
              </div>
            </div>

            {/* Static faded cards below */}
            {[...Array(2)].map((_, i) => (
              <div key={i} style={{ background: "#0d0d0f", border: "1px solid rgba(201,168,76,0.06)", borderRadius: 10, padding: "14px", marginBottom: 10, opacity: 0.4 }}>
                <div style={{ height: 12, background: "rgba(201,168,76,0.1)", borderRadius: 4, width: i === 0 ? "60%" : "45%", marginBottom: 8 }} />
                <div style={{ height: 10, background: "rgba(255,255,255,0.04)", borderRadius: 4, width: "30%" }} />
              </div>
            ))}

            {/* Draft email strip */}
            <div style={{ marginTop: 16, background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 11, color: "#c9a84c", fontFamily: "monospace", marginBottom: 3 }}>AI DRAFT READY</div>
                <div style={{ fontSize: 12, color: "#a8a49c" }}>Renewal email for {activeAccount.name}</div>
              </div>
              <div style={{ fontSize: 11, background: "#c9a84c", color: "#0d0d0f", padding: "5px 12px", borderRadius: 6, fontWeight: 700, fontFamily: "monospace" }}>Review →</div>
            </div>
          </div>

          {/* Glow */}
          <div style={{ position: "absolute", inset: -1, borderRadius: 16, background: "radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.08) 0%, transparent 70%)", pointerEvents: "none" }} />
        </div>
      </section>

      {/* PAIN POINTS */}
      <section style={{ padding: "60px 48px", borderTop: "1px solid rgba(201,168,76,0.08)", borderBottom: "1px solid rgba(201,168,76,0.08)", background: "rgba(201,168,76,0.02)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6a675f", fontFamily: "monospace", marginBottom: 48, textAlign: "center" }}>Sound familiar?</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 40 }}>
            {[
              { stat: "50+", label: "accounts to manage", problem: "You know which ones are at risk. You just don't have time to act on all of them before the window closes." },
              { stat: "30d", label: "too late to the signal", problem: "By the time you spot an upsell or a churn risk, the decision has usually already been made." },
              { stat: "0", label: "meeting intelligence captured", problem: "What was said in the renewal call stays in your head. The account record stays empty. Context is lost." },
            ].map(item => (
              <div key={item.stat} style={{ borderLeft: "2px solid rgba(201,168,76,0.2)", paddingLeft: 24 }}>
                <div style={{ fontSize: 44, fontWeight: 700, color: "#c9a84c", lineHeight: 1, marginBottom: 4, letterSpacing: "-0.03em" }}>{item.stat}</div>
                <div style={{ fontSize: 11, color: "#6a675f", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{item.label}</div>
                <p style={{ fontSize: 14, color: "#a8a49c", lineHeight: 1.75, margin: 0 }}>{item.problem}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS — ANIMATED MOCKS */}
      <section id="how" style={{ padding: "100px 48px", maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6a675f", fontFamily: "monospace", marginBottom: 16, textAlign: "center" }}>How it works</p>
        <h2 style={{ fontSize: "clamp(24px, 3vw, 40px)", fontWeight: 700, textAlign: "center", marginBottom: 72, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
          From account added<br />to renewal won
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 80 }}>

          {/* STEP 1 — Add account + auto-enrich */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: "#c9a84c", fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: 12 }}>01 — ADD YOUR ACCOUNTS</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, letterSpacing: "-0.01em" }}>Start with context, not a blank page</h3>
              <p style={{ fontSize: 15, color: "#a8a49c", lineHeight: 1.75, margin: "0 0 12px" }}>Add a company name and domain. Ozhenai auto-enriches with company news, financial signals, and growth indicators before you've written a single word.</p>
              <p style={{ fontSize: 12, color: "#6a675f", fontFamily: "monospace" }}>Works alongside whatever CRM you already use.</p>
            </div>
            {/* Mock: company card being enriched */}
            <div style={{ background: "#161619", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 14, padding: "20px", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
              <div style={{ fontSize: 11, color: "#6a675f", fontFamily: "monospace", textTransform: "uppercase", marginBottom: 14 }}>New company</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                {[{ label: "Company", value: "Northlight SaaS", done: true }, { label: "Domain", value: "northlight.io", done: true }, { label: "ARR", value: "€22,500", done: true }].map(f => (
                  <div key={f.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#0d0d0f", borderRadius: 7, border: "1px solid rgba(201,168,76,0.08)" }}>
                    <span style={{ fontSize: 11, color: "#6a675f", fontFamily: "monospace" }}>{f.label}</span>
                    <span style={{ fontSize: 13, color: "#e8e4dc", fontWeight: 600 }}>{f.value}</span>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: "1px solid rgba(201,168,76,0.08)", paddingTop: 14 }}>
                <div style={{ fontSize: 11, color: "#c9a84c", fontFamily: "monospace", marginBottom: 10 }}>⚡ AUTO-ENRICHED</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 12, color: "#a8a49c", background: "rgba(201,168,76,0.05)", borderRadius: 6, padding: "6px 10px" }}>📰 Northlight raised Series A — €4.2M in March</div>
                  <div style={{ fontSize: 12, color: "#4caf7d", background: "rgba(76,175,125,0.06)", borderRadius: 6, padding: "6px 10px" }}>🚀 Expanding into DACH market — upsell window</div>
                  <div style={{ fontSize: 12, color: "#a8a49c", background: "rgba(201,168,76,0.05)", borderRadius: 6, padding: "6px 10px" }}>👥 Headcount grew 40% in 6 months</div>
                </div>
              </div>
            </div>
          </div>

          {/* STEP 2 — Meeting intelligence */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
            {/* Mock: meeting extraction result */}
            <div style={{ background: "#161619", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 14, padding: "20px", boxShadow: "0 20px 60px rgba(0,0,0,0.4)", order: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid rgba(201,168,76,0.08)" }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>Q3 Renewal Call</div>
                  <div style={{ fontSize: 11, color: "#6a675f", fontFamily: "monospace", marginTop: 2 }}>24 Jun 2026</div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span style={{ fontSize: 10, background: "rgba(201,168,76,0.12)", color: "#c9a84c", padding: "2px 8px", borderRadius: 20, fontFamily: "monospace" }}>next step →</span>
                  <span style={{ fontSize: 10, background: "rgba(224,92,92,0.1)", color: "#e05c5c", padding: "2px 8px", borderRadius: 20, fontFamily: "monospace" }}>2 risks</span>
                  <span style={{ fontSize: 10, background: "rgba(76,175,125,0.1)", color: "#4caf7d", padding: "2px 8px", borderRadius: 20, fontFamily: "monospace" }}>1 upsell</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#6a675f", fontFamily: "monospace", textTransform: "uppercase", marginBottom: 6 }}>Summary</div>
              <div style={{ fontSize: 13, color: "#a8a49c", lineHeight: 1.6, marginBottom: 14 }}>Team has grown from 12 to 25 people and they're hitting plan limits. Budget approved for renewal. Evaluating a competitor.</div>
              <div style={{ background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.18)", borderRadius: 8, padding: "10px 12px", marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: "#c9a84c", fontFamily: "monospace", textTransform: "uppercase", marginBottom: 4 }}>→ Next Step</div>
                <div style={{ fontSize: 13, color: "#e8e4dc" }}>Send Growth vs Scale plan comparison by Friday, highlighting user seat capacity.</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <div style={{ background: "rgba(224,92,92,0.05)", border: "1px solid rgba(224,92,92,0.12)", borderRadius: 7, padding: "10px" }}>
                  <div style={{ fontSize: 10, color: "#e05c5c", fontFamily: "monospace", marginBottom: 6 }}>⚠️ RISKS</div>
                  <div style={{ fontSize: 12, color: "#e8e4dc" }}>— Competitor evaluation underway</div>
                  <div style={{ fontSize: 12, color: "#e8e4dc" }}>— 2 users not yet activated</div>
                </div>
                <div style={{ background: "rgba(76,175,125,0.05)", border: "1px solid rgba(76,175,125,0.12)", borderRadius: 7, padding: "10px" }}>
                  <div style={{ fontSize: 10, color: "#4caf7d", fontFamily: "monospace", marginBottom: 6 }}>🚀 UPSELL</div>
                  <div style={{ fontSize: 12, color: "#e8e4dc" }}>— Team doubled, hitting seat limits</div>
                </div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: "#c9a84c", fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: 12 }}>02 — LOG MEETING INTELLIGENCE</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, letterSpacing: "-0.01em" }}>What was said in the call, captured automatically</h3>
              <p style={{ fontSize: 15, color: "#a8a49c", lineHeight: 1.75, margin: "0 0 12px" }}>Paste a transcript or notes from any call — Fireflies, Otter, Teams, or your own bullets. The AI extracts commitments, risks, upsell signals, and a specific next step in seconds.</p>
              <p style={{ fontSize: 12, color: "#6a675f", fontFamily: "monospace" }}>Your account record updates automatically. Nothing gets lost.</p>
            </div>
          </div>

          {/* STEP 3 — Email draft + approve */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, color: "#c9a84c", fontFamily: "monospace", letterSpacing: "0.12em", marginBottom: 12 }}>03 — ACT ON WHAT MATTERS</div>
              <h3 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12, letterSpacing: "-0.01em" }}>A draft that already knows the account</h3>
              <p style={{ fontSize: 15, color: "#a8a49c", lineHeight: 1.75, margin: "0 0 12px" }}>Ozhenai drafts a renewal email grounded in what was actually discussed — the commitment you made, the risk you spotted, the upsell window you identified. Review, edit, approve. Sends from your address.</p>
              <p style={{ fontSize: 12, color: "#6a675f", fontFamily: "monospace" }}>Nothing sends without your approval. You stay in control.</p>
            </div>
            {/* Mock: email draft in approval inbox */}
            <div style={{ background: "#161619", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 14, padding: "20px", boxShadow: "0 20px 60px rgba(0,0,0,0.4)" }}>
              <div style={{ fontSize: 11, color: "#6a675f", fontFamily: "monospace", textTransform: "uppercase", marginBottom: 14 }}>Approval inbox — 1 pending</div>
              <div style={{ background: "#0d0d0f", border: "1px solid rgba(201,168,76,0.12)", borderRadius: 10, padding: "16px", marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Northlight SaaS — Sarah Chen</div>
                    <div style={{ fontSize: 11, color: "#6a675f", fontFamily: "monospace" }}>Re: Your Q3 renewal + Growth plan</div>
                  </div>
                  <span style={{ fontSize: 10, background: "rgba(201,168,76,0.12)", color: "#c9a84c", padding: "2px 8px", borderRadius: 20, fontFamily: "monospace", height: "fit-content" }}>pending</span>
                </div>
                <div style={{ fontSize: 13, color: "#a8a49c", lineHeight: 1.7, borderTop: "1px solid rgba(201,168,76,0.06)", paddingTop: 10 }}>
                  Hi Sarah,<br /><br />
                  Following up on our call — I've put together the Growth vs Scale comparison you asked for, with a focus on seat capacity given the team growth from 12 to 25...
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ flex: 1, background: "#c9a84c", color: "#0d0d0f", border: "none", padding: "9px", borderRadius: 7, fontWeight: 700, fontSize: 12, cursor: "pointer", fontFamily: "monospace" }}>
                  ✓ Approve & send
                </button>
                <button style={{ background: "transparent", color: "#6a675f", border: "1px solid rgba(201,168,76,0.15)", padding: "9px 14px", borderRadius: 7, fontSize: 12, cursor: "pointer", fontFamily: "monospace" }}>
                  Edit
                </button>
              </div>
            </div>
          </div>

        </div>
      </section>
      {/* FEATURES */}
      <section style={{ padding: "80px 48px", background: "rgba(201,168,76,0.02)", borderTop: "1px solid rgba(201,168,76,0.08)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6a675f", fontFamily: "monospace", marginBottom: 16, textAlign: "center" }}>What's inside</p>
          <h2 style={{ fontSize: "clamp(22px, 2.8vw, 36px)", fontWeight: 700, textAlign: "center", marginBottom: 56, letterSpacing: "-0.02em" }}>Built for the renewal conversation, start to finish</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
            {[
              { icon: "🧠", title: "Meeting intelligence", desc: "Paste any call transcript. The AI extracts commitments, risks, upsell signals, and a specific next step — and writes it onto the account." },
              { icon: "⚡", title: "Renewal pipeline", desc: "Every account sorted by days to renewal, ARR at stake, and health score. Urgent accounts surface themselves. Nothing slips through." },
              { icon: "✉️", title: "Contextual email drafts", desc: "Emails grounded in your last meeting, the account's signals, and your tone. Not templates. Not generic. Sound like you." },
              { icon: "✓", title: "Approval inbox", desc: "Every email waits for your sign-off before anything sends. Read it, edit it, or reject it. You stay in control of every customer relationship." },
              { icon: "📈", title: "Upsell signals", desc: "When an account is financially healthy and approaching renewal, Ozhenai flags the expansion window before it closes." },
              { icon: "🔁", title: "Reply capture", desc: "When a customer replies, Ozhenai catches it and drafts your next response — keeping the thread moving without you starting from scratch." },
            ].map(f => (
              <div key={f.title} style={{ background: "#161619", border: "1px solid rgba(201,168,76,0.08)", borderRadius: 12, padding: "24px 28px", display: "flex", gap: 16, alignItems: "flex-start" }}>
                <div style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{f.icon}</div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: "#a8a49c", lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section style={{ padding: "100px 48px", maxWidth: 960, margin: "0 auto" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6a675f", fontFamily: "monospace", marginBottom: 16, textAlign: "center" }}>Pricing</p>
        <h2 style={{ fontSize: "clamp(22px, 2.8vw, 36px)", fontWeight: 700, textAlign: "center", marginBottom: 8, letterSpacing: "-0.02em" }}>Pay for accounts, not emails</h2>
        <p style={{ textAlign: "center", color: "#6a675f", fontSize: 13, fontFamily: "monospace", marginBottom: 56 }}>Unlimited email generations on every plan. Billed monthly. Cancel anytime.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, textAlign: "left" }}>
          {[
            { name: "Free", price: "0", accounts: "5 accounts", features: ["1 user", "Unlimited emails", "Renewal timeline", "Meeting intelligence"], highlight: false },
            { name: "Starter", price: "19", accounts: "50 accounts", features: ["2 users", "Unlimited emails", "Approval inbox", "Meeting intelligence"], highlight: false },
            { name: "Growth", price: "49", accounts: "150 accounts", features: ["5 users", "Unlimited emails", "Proactive scheduler", "Priority support"], highlight: true },
            { name: "Scale", price: "99", accounts: "Unlimited", features: ["Unlimited users", "Unlimited emails", "Custom sending domain", "Dedicated onboarding"], highlight: false },
          ].map(plan => (
            <div key={plan.name} style={{ background: plan.highlight ? "#1a1a1e" : "#161619", border: plan.highlight ? "1px solid #c9a84c" : "1px solid rgba(201,168,76,0.1)", borderRadius: 14, padding: "28px 24px", position: "relative" }}>
              {plan.highlight && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", fontSize: 10, color: "#0d0d0f", background: "#c9a84c", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", padding: "3px 12px", borderRadius: 20, whiteSpace: "nowrap" }}>
                  Most popular
                </div>
              )}
              <div style={{ fontSize: 13, color: "#a8a49c", marginBottom: 4 }}>{plan.name}</div>
              <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: "-0.03em", marginBottom: 4 }}>
                <span style={{ fontSize: 16, verticalAlign: "top", paddingTop: 7, display: "inline-block" }}>€</span>{plan.price}
                <span style={{ fontSize: 13, color: "#6a675f", fontWeight: 400 }}>/mo</span>
              </div>
              <div style={{ fontSize: 12, color: "#c9a84c", fontFamily: "monospace", marginBottom: 20 }}>{plan.accounts}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ fontSize: 13, color: "#a8a49c", display: "flex", gap: 8 }}>
                    <span style={{ color: "#c9a84c" }}>—</span> {f}
                  </div>
                ))}
              </div>
              <a href="/sign-in" style={{ display: "block", textAlign: "center", background: plan.highlight ? "#c9a84c" : "transparent", color: plan.highlight ? "#0d0d0f" : "#c9a84c", padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 700, border: plan.highlight ? "none" : "1px solid rgba(201,168,76,0.3)", textDecoration: "none" }}>
                Get started
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: "80px 48px", borderTop: "1px solid rgba(201,168,76,0.08)", textAlign: "center", background: "rgba(201,168,76,0.02)" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 40px)", fontWeight: 700, marginBottom: 16, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
            {submitted ? "You're on the list." : "Ready to run renewals differently?"}
          </h2>
          {submitted ? (
            <p style={{ color: "#a8a49c", fontSize: 15 }}>We'll be in touch soon at {email}.</p>
          ) : (
            <>
              <p style={{ color: "#a8a49c", fontSize: 15, marginBottom: 32, lineHeight: 1.7 }}>
                Start free — no credit card, no sales call. Add your first account in under two minutes.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginBottom: 20 }}>
                <a href="/sign-in" style={{ background: "#c9a84c", color: "#0d0d0f", padding: "13px 32px", borderRadius: 9, fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
                  Start free →
                </a>
              </div>
              <div style={{ borderTop: "1px solid rgba(201,168,76,0.08)", paddingTop: 28, marginTop: 8 }}>
                <p style={{ color: "#6a675f", fontSize: 13, marginBottom: 16 }}>Or leave your email for a personal walkthrough:</p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center", maxWidth: 400, margin: "0 auto" }}>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    style={{ flex: 1, padding: "10px 14px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.2)", background: "#161619", color: "#e8e4dc", fontSize: 13, outline: "none" }}
                  />
                  <button onClick={joinWaitlist}
                    style={{ background: "transparent", color: "#c9a84c", padding: "10px 18px", borderRadius: 8, fontWeight: 700, fontSize: 13, border: "1px solid rgba(201,168,76,0.4)", cursor: "pointer" }}>
                    Send
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <footer style={{ padding: "28px 48px", borderTop: "1px solid rgba(201,168,76,0.08)", display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6a675f" }}>
        <div style={{ color: "#c9a84c", fontWeight: 700 }}>Ozhenai</div>
        <div style={{ display: "flex", gap: 24 }}>
          <a href="/pricing" style={{ color: "#6a675f", textDecoration: "none" }}>Pricing</a>
          <a href="/sign-in" style={{ color: "#6a675f", textDecoration: "none" }}>Sign in</a>
          <span>© 2026</span>
        </div>
      </footer>
    </main>
  );
}