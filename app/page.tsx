"use client";
import { useUser } from "@clerk/nextjs";
import { useState } from "react";

export default function Home() {

  const { isSignedIn, user } = useUser();
  const [email, setEmail] = useState("");
  const [customers, setCustomers] = useState("");
  const [submitted, setSubmitted] = useState(false);

 

  async function joinWaitlist() {
    if (!email) return;
    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, customers })
    });
    if (res.ok) setSubmitted(true);
  }

  return (
    <main style={{ fontFamily: "Georgia, serif", background: "#0d0d0f", color: "#e8e4dc", minHeight: "100vh", overflowX: "hidden" }}>
      <nav style={{ padding: "20px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
        <div style={{ fontWeight: 700, fontSize: 17, color: "#c9a84c" }}>Ozhenai</div>
       <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
  <a href="/pricing" style={{ color: "#a8a49c", textDecoration: "none", fontSize: 13 }}>Pricing</a>
  {isSignedIn ? (
    <>
      <a href="/timeline" style={{ color: "#a8a49c", textDecoration: "none", fontSize: 13 }}>Timeline</a>
      <a href="/inbox" style={{ color: "#a8a49c", textDecoration: "none", fontSize: 13 }}>Inbox</a>
      
<a href="/dashboard" style={{ background: "#c9a84c", color: "#0d0d0f", padding: "7px 16px", borderRadius: 7, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>{user?.firstName ? `${user.firstName}'s Dashboard` : "Dashboard"}</a>
    </>
  ) : (
    <>
      <a href="/sign-in" style={{ color: "#c9a84c", padding: "7px 16px", borderRadius: 7, fontSize: 13, border: "1px solid rgba(201,168,76,0.4)", textDecoration: "none" }}>Sign in</a>
      <a href="/sign-in" style={{ background: "#c9a84c", color: "#0d0d0f", padding: "7px 16px", borderRadius: 7, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Get started</a>
    </>
  )}
</div>
      </nav>

      <section style={{ padding: "100px 48px 80px", maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#c9a84c", fontFamily: "monospace", marginBottom: 24 }}>For customer success teams</div>
        <h1 style={{ fontSize: "clamp(36px, 5.5vw, 64px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", margin: "0 auto 28px" }}>
          Your renewals deserve
          <br />
          <span style={{ color: "#c9a84c" }}>more than a template.</span>
        </h1>
        <p style={{ fontSize: 18, color: "#a8a49c", lineHeight: 1.75, maxWidth: 580, margin: "0 auto 48px" }}>
          Ozhenai researches your accounts, spots the right moment to reach out, and writes emails that sound like you. Then waits for your approval before anything sends.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/sign-in" style={{ background: "#c9a84c", color: "#0d0d0f", padding: "13px 32px", borderRadius: 9, fontWeight: 700, fontSize: 15, textDecoration: "none" }}>Start free</a>
          <a href="#how" style={{ color: "#e8e4dc", padding: "13px 32px", borderRadius: 9, fontSize: 15, border: "1px solid rgba(255,255,255,0.12)", textDecoration: "none" }}>See how it works</a>
        </div>
      </section>

      <section style={{ padding: "80px 48px", borderTop: "1px solid rgba(201,168,76,0.08)", borderBottom: "1px solid rgba(201,168,76,0.08)", background: "rgba(201,168,76,0.03)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6a675f", fontFamily: "monospace", marginBottom: 48, textAlign: "center" }}>Sound familiar?</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 32 }}>
            {[
              { stat: "50+", label: "accounts to manage", problem: "You know which ones are at risk. You just do not have time to act on all of them." },
              { stat: "3h", label: "per renewal email", problem: "Writing something personal enough to actually get a reply takes time you do not have." },
              { stat: "30d", label: "too late", problem: "By the time you spot an upsell opportunity, the window has usually already closed." },
            ].map(item => (
              <div key={item.stat} style={{ borderLeft: "2px solid rgba(201,168,76,0.25)", paddingLeft: 24 }}>
                <div style={{ fontSize: 40, fontWeight: 700, color: "#c9a84c", lineHeight: 1, marginBottom: 4 }}>{item.stat}</div>
                <div style={{ fontSize: 12, color: "#6a675f", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{item.label}</div>
                <p style={{ fontSize: 14, color: "#a8a49c", lineHeight: 1.7, margin: 0 }}>{item.problem}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="how" style={{ padding: "100px 48px", maxWidth: 900, margin: "0 auto" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6a675f", fontFamily: "monospace", marginBottom: 16, textAlign: "center" }}>How it works</p>
        <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 700, textAlign: "center", marginBottom: 64, letterSpacing: "-0.01em" }}>Three steps from chaos to clarity</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            { step: "01", title: "Add your customers", desc: "Name, company, renewal date, and ARR. That is all. Ozhenai researches the rest — company news, financial signals, and growth indicators." },
            { step: "02", title: "Review the signals", desc: "See which accounts are at risk, which are ready to upgrade, and which have not been touched in too long. Sorted by urgency, with context for each." },
            { step: "03", title: "Approve the email", desc: "Ozhenai drafts a personal email based on everything it knows about the account. You read it, edit if you want, and approve. It sends when you say so." },
          ].map((item, i) => (
            <div key={item.step} style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 32, padding: "40px 0", borderBottom: i < 2 ? "1px solid rgba(201,168,76,0.08)" : "none" }}>
              <div style={{ fontSize: 11, color: "#c9a84c", fontFamily: "monospace", letterSpacing: "0.1em", paddingTop: 6 }}>{item.step}</div>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, letterSpacing: "-0.01em" }}>{item.title}</h3>
                <p style={{ fontSize: 15, color: "#a8a49c", lineHeight: 1.75, margin: 0 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "80px 48px", background: "rgba(201,168,76,0.03)", borderTop: "1px solid rgba(201,168,76,0.08)" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6a675f", fontFamily: "monospace", marginBottom: 16, textAlign: "center" }}>What is inside</p>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 700, textAlign: "center", marginBottom: 64, letterSpacing: "-0.01em" }}>Everything a great CSM does, done automatically</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
            {[
              { title: "Renewal timeline", desc: "Every account sorted by days until renewal, ARR at stake, and health score. Nothing slips through." },
              { title: "Upsell signals", desc: "When an account is financially strong and approaching renewal, Ozhenai flags it as an expansion opportunity." },
              { title: "Approval inbox", desc: "Every email sits in your inbox before it sends. Read it, edit it, or reject it. You stay in control." },
              { title: "Proactive scheduler", desc: "30 days before renewal, Ozhenai drafts outreach for every account that has not been contacted yet." },
            ].map(f => (
              <div key={f.title} style={{ background: "#161619", border: "1px solid rgba(201,168,76,0.1)", borderRadius: 12, padding: "28px 24px" }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: "#a8a49c", lineHeight: 1.7, margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "100px 48px", maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6a675f", fontFamily: "monospace", marginBottom: 16 }}>Pricing</p>
        <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 700, marginBottom: 56, letterSpacing: "-0.01em" }}>Pricing</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, textAlign: "left" }}>
         {[
            { name: "Free", price: "0", features: ["3 email generations", "Up to 10 customers", "Renewal timeline"], highlight: false },
            { name: "Starter", price: "19", features: ["50 email generations", "50 customers", "2 users", "Approval inbox"], highlight: false },
            { name: "Growth", price: "49", features: ["200 email generations", "250 customers", "5 users", "Proactive scheduler"], highlight: true },
            { name: "Scale", price: "99", features: ["Unlimited everything", "Unlimited users", "Dynamics 365", "Priority support"], highlight: false },
          ].map(plan => (
            <div key={plan.name} style={{ background: plan.highlight ? "#1a1a1e" : "#161619", border: plan.highlight ? "1px solid #c9a84c" : "1px solid rgba(201,168,76,0.1)", borderRadius: 14, padding: "32px 28px" }}>
              {plan.highlight && <div style={{ fontSize: 10, color: "#c9a84c", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>Most popular</div>}
              <div style={{ fontSize: 14, color: "#a8a49c", marginBottom: 8 }}>{plan.name}</div>
              <div style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 24 }}>
                <span style={{ fontSize: 18, verticalAlign: "top", paddingTop: 8, display: "inline-block" }}>€</span>{plan.price}
                <span style={{ fontSize: 14, color: "#6a675f", fontWeight: 400 }}>/mo</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ fontSize: 13, color: "#a8a49c", display: "flex", gap: 8 }}>
                    <span style={{ color: "#c9a84c" }}>—</span> {f}
                  </div>
                ))}
              </div>
              <a href="/sign-in" style={{ display: "block", textAlign: "center", background: plan.highlight ? "#c9a84c" : "transparent", color: plan.highlight ? "#0d0d0f" : "#c9a84c", padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 700, border: plan.highlight ? "none" : "1px solid rgba(201,168,76,0.3)", textDecoration: "none" }}>Get started</a>
            </div>
          ))}
        </div>
      </section>

      <section id="waitlist" style={{ padding: "80px 48px", borderTop: "1px solid rgba(201,168,76,0.08)", textAlign: "center" }}>
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 700, marginBottom: 16, letterSpacing: "-0.01em" }}>
            {submitted ? "You are on the list." : "Get early access"}
          </h2>
          {submitted ? (
            <p style={{ color: "#a8a49c", fontSize: 15 }}>We will be in touch soon.</p>
          ) : (
            <>
              <p style={{ color: "#a8a49c", fontSize: 15, marginBottom: 32 }}>Early access is limited. Leave your email and we will reach out personally.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.2)", background: "#161619", color: "#e8e4dc", fontSize: 14, outline: "none" }} />
                <select value={customers} onChange={e => setCustomers(e.target.value)} style={{ padding: "12px 16px", borderRadius: 8, border: "1px solid rgba(201,168,76,0.2)", background: "#161619", color: customers ? "#e8e4dc" : "#6a675f", fontSize: 14, outline: "none" }}>
                  <option value="">How many accounts do you manage?</option>
                  <option value="1-10">1 to 10</option>
                  <option value="11-50">11 to 50</option>
                  <option value="51-200">51 to 200</option>
                  <option value="200+">200 plus</option>
                </select>
                <button onClick={joinWaitlist} style={{ background: "#c9a84c", color: "#0d0d0f", padding: "12px", borderRadius: 8, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>Join the waitlist</button>
              </div>
            </>
          )}
        </div>
      </section>

      <footer style={{ padding: "28px 48px", borderTop: "1px solid rgba(201,168,76,0.08)", display: "flex", justifyContent: "space-between", fontSize: 12, color: "#6a675f" }}>
        <div>2026 Ozhenai</div>
        <div style={{ display: "flex", gap: 24 }}>
          <a href="/pricing" style={{ color: "#6a675f", textDecoration: "none" }}>Pricing</a>
          <a href="/sign-in" style={{ color: "#6a675f", textDecoration: "none" }}>Sign in</a>
        </div>
      </footer>
    </main>
  );
}