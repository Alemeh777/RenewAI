"use client";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

export default function Home() {
   const router = useRouter();
  const { isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn) router.push("/dashboard");
  }, [isSignedIn]);
  return (
    <main style={{ fontFamily: "Georgia, serif", background: "#0d0d0f", 
                   color: "#e8e4dc", minHeight: "100vh" }}>
      <nav style={{ padding: "20px 40px", display: "flex", 
                    justifyContent: "space-between", alignItems: "center",
                    borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
        <div style={{ fontWeight: 700, fontSize: 18, color: "#c9a84c" }}>
          Ozhenai
        </div>
       <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
  <SignInButton mode="modal">
    <button style={{ background: "transparent", color: "#c9a84c",
      padding: "8px 16px", borderRadius: 8, fontWeight: 700,
      fontSize: 13, border: "1px solid rgba(201,168,76,0.4)",
      cursor: "pointer" }}>
      Sign in
    </button>
  </SignInButton>
  <SignUpButton mode="modal">
    <button style={{ background: "#c9a84c", color: "#0d0d0f",
      padding: "8px 16px", borderRadius: 8, fontWeight: 700,
      fontSize: 13, border: "none", cursor: "pointer" }}>
      Get started
    </button>
  </SignUpButton>
</div>
      </nav>

      <section style={{ textAlign: "center", padding: "100px 40px 80px" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.15em", 
                      textTransform: "uppercase", color: "#c9a84c",
                      marginBottom: 20, fontFamily: "monospace" }}>
          AI-powered renewal agent
        </div>
        <h1 style={{ fontSize: "clamp(32px, 5vw, 58px)", fontWeight: 700,
                     lineHeight: 1.15, maxWidth: 720, margin: "0 auto 24px" }}>
          Your customers renew.<br/>
          <span style={{ color: "#c9a84c" }}>Your agent makes it happen.</span>
        </h1>
        <p style={{ fontSize: 17, color: "#a8a49c", maxWidth: 520, 
                    margin: "0 auto 48px", lineHeight: 1.7 }}>
          Ozhenai reads your customer emails, tracks renewals, and writes 
          hyper-personal outreach — then waits for your approval before sending.
        </p>
        <a href="#waitlist" style={{ background: "#c9a84c", color: "#0d0d0f",
           padding: "14px 36px", borderRadius: 10, fontWeight: 700,
           fontSize: 15, textDecoration: "none", display: "inline-block" }}>
          Get early access →
        </a>
      </section>

      <section style={{ padding: "80px 40px", maxWidth: 1000, margin: "0 auto" }}>
        <h2 style={{ textAlign: "center", fontSize: 28, marginBottom: 48 }}>
          How it works
        </h2>
        <div style={{ display: "grid", 
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))",
                      gap: 20 }}>
          {[
            { icon: "🔍", title: "Reads your inbox", 
              desc: "Only processes emails from your registered customers. Unknown senders ignored." },
            { icon: "🧠", title: "Builds intelligence", 
              desc: "Learns from email history, CRM data, and company news." },
            { icon: "✍️", title: "Writes real emails", 
              desc: "Hyper-personal messages that reference real conversations — not templates." },
            { icon: "✅", title: "Always asks first", 
              desc: "Shows you every email before it sends. You approve. Always." },
          ].map(f => (
            <div key={f.title} style={{ background: "#161619", 
               border: "1px solid rgba(201,168,76,0.13)",
               borderRadius: 12, padding: "28px 24px" }}>
              <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "#a8a49c", lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: "80px 40px", textAlign: "center" }}>
        <h2 style={{ fontSize: 28, marginBottom: 12 }}>Simple pricing</h2>
        <p style={{ color: "#a8a49c", marginBottom: 48, fontSize: 15 }}>
          Choose the plan that fits your team. Cancel anytime.
        </p>
        <div style={{ display: "inline-flex", gap: 20, flexWrap: "wrap", 
                      justifyContent: "center" }}>
          {[
            { name: "Starter", price: "€19", desc: "50 AI email generations/month", hot: false },
{ name: "Growth", price: "€49", desc: "200 AI email generations/month", hot: true },
{ name: "Scale", price: "€99", desc: "Unlimited AI email generations", hot: false },
          ].map(p => (
            <div key={p.name} style={{ background: "#161619", 
               border: p.hot ? "2px solid #c9a84c" : "1px solid rgba(201,168,76,0.13)",
               borderRadius: 14, padding: "32px 28px", minWidth: 180, textAlign: "left" }}>
              {p.hot && <div style={{ fontSize: 10, color: "#c9a84c", 
                marginBottom: 8, fontFamily: "monospace", textTransform: "uppercase",
                letterSpacing: "0.1em" }}>Most popular</div>}
              <div style={{ fontSize: 13, color: "#a8a49c", marginBottom: 6 }}>{p.name}</div>
              <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 8 }}>{p.price}</div>
              <div style={{ fontSize: 12, color: "#6a675f", fontFamily: "monospace" }}>{p.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="waitlist" style={{ padding: "80px 40px", textAlign: "center" }}>
        <h2 style={{ fontSize: 28, marginBottom: 12 }}>Join the waitlist</h2>
        <p style={{ color: "#a8a49c", marginBottom: 16, fontSize: 15 }}>
          Early access opens soon. Be first.
        </p>
        <p style={{ color: "#c9a84c", marginBottom: 32, fontSize: 13, fontFamily: "monospace" }}>
          How many customers do you manage renewals for?
        </p>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
          <input 
            type="email" 
            id="waitlist-email"
            placeholder="your@email.com"
            style={{ padding: "12px 18px", borderRadius: 8, 
                     border: "1px solid rgba(201,168,76,0.3)",
                     background: "#161619", color: "#e8e4dc", 
                     fontSize: 14, width: 280, outline: "none" }} 
          />
          <select
            id="waitlist-customers"
            style={{ padding: "12px 18px", borderRadius: 8,
                     border: "1px solid rgba(201,168,76,0.3)",
                     background: "#161619", color: "#e8e4dc",
                     fontSize: 14, width: 280, outline: "none" }}>
            <option value="">Number of customers...</option>
            <option value="1-10">1–10 customers</option>
            <option value="11-50">11–50 customers</option>
            <option value="51-200">51–200 customers</option>
            <option value="200+">200+ customers</option>
          </select>
          <button 
            onClick={async () => {
              const email = (document.getElementById("waitlist-email") as HTMLInputElement).value;
              const customers = (document.getElementById("waitlist-customers") as HTMLSelectElement).value;
              if (!email) return alert("Please enter your email.");
              const res = await fetch("/api/waitlist", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, customers })
              });
              if (res.ok) {
                alert("You're on the waitlist! Check your email.");
              } else {
                alert("Something went wrong. Please try again.");
              }
            }}
            style={{ background: "#c9a84c", color: "#0d0d0f", 
                     padding: "12px 28px", borderRadius: 8, 
                     fontWeight: 700, fontSize: 14, border: "none", 
                     cursor: "pointer", width: 280 }}>
            Get early access
          </button>
        </div>
      </section>

      <footer style={{ padding: "32px 40px", 
                       borderTop: "1px solid rgba(201,168,76,0.1)",
                       textAlign: "center", fontSize: 12, color: "#6a675f" }}>
        © 2026 Ozhenai · Built with Claude
      </footer>
    </main>
  )
}