"use client";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const { isSignedIn } = useUser();
  const [email, setEmail] = useState("");
  const [customers, setCustomers] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isSignedIn) router.push("/dashboard");
  }, [isSignedIn]);

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

      {/* NAV */}
      <nav style={{ padding: "20px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(201,168,76,0.1)" }}>
        <div style={{ fontWeight: 700, fontSize: 17, color: "#c9a84c", letterSpacing: "-0.01em" }}>Ozhenai</div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <a href="/pricing" style={{ color: "#a8a49c", textDecoration: "none", fontSize: 13 }}>Pricing</a>
          <a href="/sign-in" style={{ background: "transparent", color: "#c9a84c", padding: "7px 16px", borderRadius: 7, fontSize: 13, border: "1px solid rgba(201,168,76,0.4)", textDecoration: "none" }}>Sign in</a>
          <a href="/sign-in" style={{ background: "#c9a84c", color: "#0d0d0f", padding: "7px 16px", borderRadius: 7, fontSize: 13, fontWeight: 700, textDecoration: "none" }}>Get started</a>
        </div>
      </nav>

      {/* HERO */}
      <section style={{ padding: "100px 48px 80px", maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
        <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#c9a84c", fontFamily: "monospace", marginBottom: 24 }}>
          For customer success teams
        </div>
        <h1 style={{ fontSize: "clamp(36px, 5.5vw, 64px)", fontWeight: 700, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 28, margin: "0 auto 28px" }}>
          Your renewals deserve<br/>
          <span style={{ color: "#c9a84c", }}>more than a template.</span>
        </h1>
        <p style={{ fontSize: 18, color: "#a8a49c", lineHeight: 1.75, maxWidth: 580, margin: "0 auto 48px" }}>
          Ozhenai researches your accounts, spots the right moment to reach out, and writes emails that sound like you — then waits for your approval before anything sends.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a href="/sign-in" style={{ background: "#c9a84c", color: "#0d0d0f", padding: "13px 32px", borderRadius: 9, fontWeight: 700, fontSize: 15, textDecoration: "none" }}>
            Start free →
          </a>
          <a href="#how" style={{ background: "transparent", color: "#e8e4dc", padding: "13px 32px", borderRadius: 9, fontSize: 15, border: "1px solid rgba(255,255,255,0.12)", textDecoration: "none" }}>
            See how it works
          </a>
        </div>
      </section>

      {/* PROBLEM */}
      <section style={{ padding: "80px 48px", borderTop: "1px solid rgba(201,168,76,0.08)", borderBottom: "1px solid rgba(201,168,76,0.08)", background: "rgba(201,168,76,0.03)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6a675f", fontFamily: "monospace", marginBottom: 48, textAlign: "center" }}>Sound familiar?</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 32 }}>
            {[
              { stat: "50+", label: "accounts to manage", problem: "You know which ones are at risk. You just don't have time to act on all of them." },
              { stat: "3h", label: "per renewal email", problem: "Writing something personal enough to actually get a reply takes time you don't have." },
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

      {/* HOW IT WORKS */}
      <section id="how" style={{ padding: "100px 48px", maxWidth: 900, margin: "0 auto" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6a675f", fontFamily: "monospace", marginBottom: 16, textAlign: "center" }}>How it works</p>
        <h2 style={{ fontSize: "clamp(24px, 3vw, 38px)", fontWeight: 700, textAlign: "center", marginBottom: 64, letterSpacing: "-0.01em" }}>
          Three steps from chaos to clarity
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {[
            {
              step: "01",
              title: "Add your customers",
              desc: "Name, company, renewal date, and ARR. That's all. Ozhenai researches the rest — company news, financial signals, tech stack, growth indicators."
            },
            {
              step: "02",
              title: "Review the signals",
              desc: "See which accounts are at risk, which are ready to upgrade, and which haven't been touched in too long. Sorted by urgency, with context for each."
            },
            {
              step: "03",
              title: "Approve the email",
              desc: "Ozhenai drafts a personal email based on everything it knows about the account. You read it, edit it if you want, and approve. It sends when you say so."
            },
          ].map((item, i) => (
            <div key={item.step} style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: 32, padding: "40px 0", borderBottom: i < 2 ? "1px solid rgba(201,168,76,0.08)" : "none" }}>
<div style={{ fontSize: 11, color: "#c9a84c", fontFamily: "monospace", letterSpacing: "0.1em", paddingTop: 6 }}>{item.step}</div>