// ============================================================
// TellSafe — Landing Page
// ============================================================

"use client";

import React, { useState, useEffect } from "react";

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeDemo, setActiveDemo] = useState<"submit" | "admin" | "relay">("submit");
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close hamburger on resize to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 768) setMenuOpen(false);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Close hamburger on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Body scroll lock when menu open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#f7f5f0" }}>
      <style>{`
        html { scroll-behavior: smooth; }
        [id] { scroll-margin-top: 80px; }

        @keyframes fadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes glowPulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
        .fade-up { animation: fadeUp 0.7s ease both; }
        .fade-up-1 { animation: fadeUp 0.7s ease 0.1s both; }
        .fade-up-2 { animation: fadeUp 0.7s ease 0.2s both; }
        .fade-up-3 { animation: fadeUp 0.7s ease 0.3s both; }
        .fade-up-4 { animation: fadeUp 0.7s ease 0.4s both; }
        .cta-btn { transition: all 0.25s ease; }
        .cta-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(45,106,106,0.4); }
        .cta-outline:hover { background: rgba(247,245,240,0.08) !important; }
        .feature-card { transition: all 0.3s ease; }
        .feature-card:hover { transform: translateY(-4px); border-color: rgba(247,245,240,0.15) !important; }
        .price-card { transition: all 0.3s ease; }
        .price-card:hover { transform: translateY(-4px); box-shadow: 0 16px 48px rgba(0,0,0,0.15); }
        .demo-tab { transition: all 0.2s ease; cursor: pointer; }
        .demo-tab:hover { background: rgba(247,245,240,0.08); }
        a { text-decoration: none; color: inherit; }

        /* Hamburger button */
        .landing-hamburger { display: none; }

        /* Mobile overlay */
        .landing-mobile-menu {
          display: none;
          position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          z-index: 49;
          background: rgba(15,17,23,0.97);
          backdrop-filter: blur(20px);
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 32px;
        }
        .landing-mobile-menu.open { display: flex; }
        .landing-mobile-menu a {
          font-size: 22px;
          font-weight: 600;
          color: rgba(247,245,240,0.7);
          transition: color 0.2s;
        }
        .landing-mobile-menu a:hover { color: #a3c9c9; }

        /* ======== TABLET (768–1023) ======== */
        @media (max-width: 1023px) {
          .landing-grid-3 { grid-template-columns: repeat(2, 1fr) !important; }
          .landing-hero-h1 { font-size: 48px !important; }
          .landing-section-h2 { font-size: 32px !important; }
          .landing-hero-sub { font-size: 16px !important; }
        }

        /* ======== MOBILE (≤767) ======== */
        @media (max-width: 767px) {
          .landing-hamburger {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 40px; height: 40px;
            border: none; background: transparent;
            color: #f7f5f0; font-size: 26px;
            cursor: pointer;
          }
          .landing-nav-links { display: none !important; }
          .landing-nav-inner { padding: 0 16px !important; }
          .landing-hero-h1 { font-size: 36px !important; }
          .landing-hero-sub { font-size: 15px !important; }
          .landing-section-h2 { font-size: 28px !important; }
          .landing-hero-ctas a {
            width: 100% !important;
            max-width: 320px !important;
            text-align: center !important;
          }
          .landing-grid-3 { grid-template-columns: 1fr !important; }
          .landing-section { padding: 60px 0 !important; }
          .landing-hero { padding-top: 120px !important; padding-bottom: 60px !important; }
          .landing-demo-tabs {
            max-width: 100% !important;
            flex-direction: column !important;
            border-radius: 16px !important;
          }
          .landing-demo-tabs button { border-radius: 12px !important; }
          .landing-demo-card { padding: 24px !important; }
          .landing-footer-inner {
            flex-direction: column !important;
            gap: 12px !important;
            text-align: center !important;
          }
          .landing-admin-stats { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* ====== DARK NAV ====== */}
      <nav
        aria-label="Main navigation"
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          padding: scrolled ? "10px 0" : "18px 0",
          background: scrolled ? "rgba(15,17,23,0.95)" : "transparent",
          backdropFilter: scrolled ? "blur(16px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(247,245,240,0.06)" : "none",
          transition: "all 0.3s ease",
        }}
      >
        <div className="landing-nav-inner" style={{ maxWidth: 1120, margin: "0 auto", padding: "0 28px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <span style={{ fontSize: 24 }}>🛡️</span>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400, color: "#a3c9c9" }}>TellSafe</span>
          </a>
          <div className="landing-nav-links" style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <a href="#features" style={{ fontSize: 14, fontWeight: 500, color: "rgba(247,245,240,0.55)" }}>Features</a>
            <a href="#demo" style={{ fontSize: 14, fontWeight: 500, color: "rgba(247,245,240,0.55)" }}>Demo</a>
            <a href="#pricing" style={{ fontSize: 14, fontWeight: 500, color: "rgba(247,245,240,0.55)" }}>Pricing</a>
            <a href="/auth/login" style={{ fontSize: 14, fontWeight: 600, color: "#a3c9c9" }}>Log In</a>
            <a href="/auth/signup" className="cta-btn" style={{
              fontSize: 14, fontWeight: 700, color: "#fff", background: "#2d6a6a",
              padding: "9px 22px", borderRadius: 8,
            }}>Get Started Free</a>
          </div>
          <button
            className="landing-hamburger"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* ====== MOBILE MENU OVERLAY ====== */}
      <div className={`landing-mobile-menu${menuOpen ? " open" : ""}`}>
        <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
        <a href="#demo" onClick={() => setMenuOpen(false)}>Demo</a>
        <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
        <a href="/auth/login" onClick={() => setMenuOpen(false)} style={{ color: "#a3c9c9" }}>Log In</a>
        <a
          href="/auth/signup"
          onClick={() => setMenuOpen(false)}
          style={{
            background: "#2d6a6a", color: "#fff",
            padding: "14px 40px", borderRadius: 12,
            fontWeight: 700, fontSize: 16,
          }}
        >Get Started Free</a>
      </div>

      {/* ====== DARK HERO ====== */}
      <section
        className="landing-hero"
        style={{
          paddingTop: 160, paddingBottom: 100, textAlign: "center",
          position: "relative", overflow: "hidden",
          background: "linear-gradient(180deg, #0f1117 0%, #151820 60%, #1a1e28 100%)",
        }}
      >
        {/* Ambient glow */}
        <div style={{
          position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)",
          width: 800, height: 500,
          background: "radial-gradient(ellipse, rgba(45,106,106,0.12), transparent 70%)",
          animation: "glowPulse 6s ease infinite",
        }} />

        <div style={{ maxWidth: 720, margin: "0 auto", padding: "0 28px", position: "relative" }}>
          {/* Badge */}
          <div className="fade-up" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 20px", borderRadius: 100,
            background: "rgba(247,245,240,0.06)", border: "1px solid rgba(247,245,240,0.08)",
            fontSize: 13, fontWeight: 500, color: "rgba(247,245,240,0.6)",
            marginBottom: 32,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d6a6a" }} />
            Anonymous feedback, built for communities
          </div>

          {/* Headline */}
          <h1 className="fade-up-1 landing-hero-h1" style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 62, fontWeight: 400, lineHeight: 1.1,
            marginBottom: 24, color: "#f7f5f0",
          }}>
            Every voice matters.<br />
            <span style={{
              background: "linear-gradient(135deg, #a3c9c9, #2d6a6a, #a3c9c9)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Even the quiet ones.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="fade-up-2 landing-hero-sub" style={{
            fontSize: 18, lineHeight: 1.7, color: "rgba(247,245,240,0.5)",
            maxWidth: 520, margin: "0 auto 40px",
          }}>
            TellSafe gives your community a safe, anonymous way to share feedback — with an optional relay so you can respond without breaking anonymity.
          </p>

          {/* CTA */}
          <div className="fade-up-3" style={{ display: "flex", justifyContent: "center" }}>
            <a href="/auth/signup" className="cta-btn" style={{
              display: "inline-block", padding: "16px 44px",
              background: "#2d6a6a", color: "#fff", borderRadius: 12,
              fontSize: 16, fontWeight: 700,
            }}>Get Started Free →</a>
          </div>
        </div>
      </section>

      {/* ====== 6 DARK FEATURE CARDS ====== */}
      <section id="features" className="landing-section" style={{
        padding: "80px 0 100px",
        background: "linear-gradient(180deg, #1a1e28 0%, #151820 100%)",
      }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 28px" }}>
          <div className="landing-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {[
              { icon: "🔐", title: "Three Privacy Modes", desc: "Identified, fully anonymous, or anonymous with relay — your members choose their comfort level.", color: "#e8a68c" },
              { icon: "🔀", title: "Anonymous Relay", desc: "Respond to anonymous feedback via encrypted email relay. Two-way conversation, zero identity exposure.", color: "#a3c9c9" },
              { icon: "🎨", title: "Your Brand, Your Form", desc: "Upload your logo, pick your colors, customize categories. It looks like yours, powered by TellSafe.", color: "#e8a68c" },
              { icon: "📊", title: "Admin Dashboard", desc: "Filter, search, and manage all feedback in one place. Stats, categories, and team access built in.", color: "#a3c9c9" },
              { icon: "📱", title: "QR Code Ready", desc: "Generate a QR code for flyers, posters, or table cards. One scan and members are sharing feedback.", color: "#b8aed0" },
              { icon: "🏢", title: "Multi-Community", desc: "Run up to 3 organizations from one account. Perfect for leaders who manage multiple groups, chapters, or events.", color: "#e8d78c" },
            ].map((f) => (
              <div
                key={f.title}
                className="feature-card"
                style={{
                  padding: 28, borderRadius: 16,
                  background: "rgba(247,245,240,0.03)",
                  border: "1px solid rgba(247,245,240,0.06)",
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: `${f.color}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, marginBottom: 16,
                }}>{f.icon}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 8, color: "#f7f5f0" }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "rgba(247,245,240,0.45)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== TRANSITION TO LIGHT ====== */}
      <div style={{ height: 120, background: "linear-gradient(180deg, #151820, #f7f5f0)" }} />

      {/* ====== THREE MODES (LIGHT) ====== */}
      <section className="landing-section" style={{ padding: "60px 0 100px", background: "#f7f5f0", color: "#1a1a2e" }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 className="landing-section-h2" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 38, fontWeight: 400, marginBottom: 12, color: "#1a1a2e" }}>
              Three ways to speak up
            </h2>
            <p style={{ fontSize: 17, color: "#8a8578", maxWidth: 460, margin: "0 auto" }}>
              Members choose their comfort level. You get honest feedback.
            </p>
          </div>

          <div className="landing-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 22 }}>
            {[
              { icon: "👋", title: "Identified", desc: "Name and email attached. Great for praise, suggestions, and follow-ups.", color: "#c05d3b", bg: "rgba(192,93,59,0.08)" },
              { icon: "👤", title: "Anonymous", desc: "Completely private. No email, no identity, no way to trace it back.", color: "#2d6a6a", bg: "rgba(45,106,106,0.08)" },
              { icon: "🔀", title: "Anonymous Relay", desc: "Stay anonymous but have a two-way conversation via encrypted email relay.", color: "#6b5b8a", bg: "rgba(107,91,138,0.08)", badge: "PRO" },
            ].map((f) => (
              <div key={f.title} style={{
                padding: 32, borderRadius: 20, background: "#fff",
                border: "1px solid rgba(26,26,46,0.08)", position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: f.color }} />
                {f.badge && (
                  <span style={{
                    position: "absolute", top: 14, right: 14,
                    fontSize: 9, fontWeight: 800, letterSpacing: "0.1em",
                    padding: "3px 8px", borderRadius: 4,
                    background: "rgba(107,91,138,0.1)", color: "#6b5b8a",
                  }}>{f.badge}</span>
                )}
                <div style={{
                  width: 52, height: 52, borderRadius: 16, background: f.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, marginBottom: 18,
                }}>{f.icon}</div>
                <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 8, color: f.color }}>{f.title}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: "#8a8578" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== INTERACTIVE DEMO ====== */}
      <section id="demo" className="landing-section" style={{
        padding: "80px 0 100px",
        background: "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(45,106,106,0.08), transparent), #ede9e0",
        color: "#1a1a2e",
      }}>
        <div style={{ maxWidth: 1060, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2 className="landing-section-h2" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 38, fontWeight: 400, marginBottom: 12 }}>
              See it in action
            </h2>
            <p style={{ fontSize: 17, color: "#8a8578" }}>Here&apos;s what your community and dashboard will look like.</p>
          </div>

          {/* Demo tabs */}
          <div className="landing-demo-tabs" style={{
            display: "flex", justifyContent: "center", gap: 8, marginBottom: 28,
            background: "#1a1a2e", borderRadius: 100, padding: 4, maxWidth: 480, margin: "0 auto 28px",
          }}>
            {[
              { id: "submit" as const, label: "📝 Feedback Form" },
              { id: "admin" as const, label: "📊 Admin Dashboard" },
              { id: "relay" as const, label: "🔀 Relay Thread" },
            ].map((tab) => (
              <button key={tab.id} onClick={() => setActiveDemo(tab.id)} className="demo-tab" style={{
                flex: 1, padding: "10px 16px", borderRadius: 100, border: "none",
                fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600,
                background: activeDemo === tab.id ? "#c05d3b" : "transparent",
                color: activeDemo === tab.id ? "#fff" : "rgba(247,245,240,0.6)",
              }}>{tab.label}</button>
            ))}
          </div>

          {/* Demo card */}
          <div className="landing-demo-card" style={{
            background: "#fff", borderRadius: 20, padding: 40,
            boxShadow: "0 8px 40px rgba(26,26,46,0.08)",
            maxWidth: 680, margin: "0 auto", position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #2d6a6a, #c05d3b, #6b5b8a)" }} />

            {activeDemo === "submit" && (
              <div>
                <div style={{ textAlign: "center", marginBottom: 28 }}>
                  <div style={{
                    width: 48, height: 48, margin: "0 auto 14px",
                    background: "linear-gradient(135deg, #2d6a6a, #a3c9c9)",
                    borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 22, boxShadow: "0 3px 12px rgba(45,106,106,0.2)",
                  }}>🛡️</div>
                  <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 24, fontWeight: 400, marginBottom: 4 }}>
                    Share Your <span style={{ color: "#2d6a6a" }}>Feedback</span>
                  </h3>
                  <p style={{ fontSize: 14, color: "#8a8578" }}>Your voice helps build a better community.</p>
                </div>
                <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                  {[
                    { icon: "👋", label: "Identified", color: "#c05d3b", active: true },
                    { icon: "👤", label: "Anonymous", color: "#2d6a6a", active: false },
                    { icon: "🔀", label: "Relay", color: "#6b5b8a", active: false },
                  ].map((opt) => (
                    <div key={opt.label} style={{
                      flex: 1, padding: "14px 10px", borderRadius: 12, textAlign: "center",
                      border: opt.active ? `2px solid ${opt.color}` : "2px solid rgba(26,26,46,0.08)",
                      background: opt.active ? `${opt.color}08` : "transparent",
                    }}>
                      <div style={{ fontSize: 20, marginBottom: 4 }}>{opt.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: opt.active ? opt.color : "#8a8578" }}>{opt.label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
                  {["🎵 Music", "🏠 Venue", "📚 Lessons", "🤝 Safety", "💡 Suggestion", "❤️ Praise"].map((c, i) => (
                    <span key={c} style={{
                      padding: "6px 14px", borderRadius: 100, fontSize: 12, fontWeight: 500,
                      border: i === 0 ? "1.5px solid #2d6a6a" : "1.5px solid rgba(26,26,46,0.08)",
                      background: i === 0 ? "#2d6a6a" : "#fff", color: i === 0 ? "#fff" : "#1a1a2e",
                    }}>{c}</span>
                  ))}
                </div>
                <div style={{
                  background: "#f7f5f0", borderRadius: 10, padding: "14px 16px",
                  border: "1.5px solid rgba(26,26,46,0.08)", fontSize: 14, color: "#8a8578",
                  minHeight: 80, marginBottom: 16,
                }}>What&apos;s on your mind? The more detail you share, the better we can respond...</div>
                <div style={{ padding: 14, borderRadius: 12, background: "#c05d3b", color: "#fff", fontWeight: 700, fontSize: 15, textAlign: "center" }}>Send Feedback</div>
              </div>
            )}

            {activeDemo === "admin" && (
              <div>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400, marginBottom: 20 }}>Feedback Inbox</h3>
                <div className="landing-admin-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 20 }}>
                  {[
                    { label: "Total", value: "47", sub: "+8 this week", color: "#2d6a6a" },
                    { label: "Needs Reply", value: "3", sub: "2 relay", color: "#c05d3b" },
                    { label: "Top Category", value: "Music", sub: "34%", color: "#2d6a6a" },
                  ].map((s) => (
                    <div key={s.label} style={{ background: "#f7f5f0", borderRadius: 10, padding: 14 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8a8578", marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 26, color: "#1a1a2e" }}>{s.value}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: s.color }}>{s.sub}</div>
                    </div>
                  ))}
                </div>
                {[
                  { icon: "🔀", color: "#6b5b8a", cat: "Music & DJing", text: "The tempo has been way too fast — could we get more 85-100 BPM songs?", time: "2h ago" },
                  { icon: "👋", color: "#c05d3b", cat: "Praise", text: "Thursday nights have been incredible! The new rotation format is great.", time: "5h ago" },
                  { icon: "👤", color: "#2d6a6a", cat: "Safety", text: "There's a lead making follows uncomfortable with unsolicited feedback.", time: "1d ago" },
                ].map((f) => (
                  <div key={f.text} style={{
                    display: "flex", gap: 12, padding: "14px 0",
                    borderBottom: "1px solid rgba(26,26,46,0.06)",
                    borderLeft: `3px solid ${f.color}`, paddingLeft: 14,
                  }}>
                    <span style={{ fontSize: 16 }}>{f.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "2px 6px", borderRadius: 4, background: "#ede9e0", color: "#8a8578" }}>{f.cat}</span>
                        <span style={{ fontSize: 10, color: "#8a8578", marginLeft: "auto" }}>{f.time}</span>
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.5, color: "#1a1a2e", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeDemo === "relay" && (
              <div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "5px 12px", background: "rgba(107,91,138,0.1)",
                  borderRadius: 100, fontSize: 12, fontWeight: 700, color: "#6b5b8a", marginBottom: 16,
                }}>🔀 Anonymous Relay Thread</div>
                <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, fontWeight: 400, marginBottom: 20 }}>Conversation Thread</h3>
                {[
                  { from: "member", name: "Anonymous Member", text: "The tempo has been way too fast — could we get more songs in the 85-100 BPM range?", time: "Feb 14, 2:30 PM", avatar: "?", bg: "#b8aed0", fg: "#6b5b8a" },
                  { from: "admin", name: "Chris", text: "Thanks for this feedback! I'll talk to our DJ about keeping the first hour under 100 BPM. Would a BPM display help? 😊", time: "Feb 14, 4:15 PM", avatar: "C", bg: "#e8a68c", fg: "#c05d3b" },
                  { from: "member", name: "Anonymous Member", text: "That would be amazing! Thanks for being so responsive! 🙏", time: "Feb 15, 9:20 AM", avatar: "?", bg: "#b8aed0", fg: "#6b5b8a" },
                ].map((msg, i) => (
                  <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                      background: msg.bg, color: msg.fg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 700,
                    }}>{msg.avatar}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1a1a2e" }}>{msg.name}</span>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 4,
                          textTransform: "uppercase", letterSpacing: "0.06em",
                          background: msg.from === "admin" ? "rgba(192,93,59,0.1)" : "rgba(107,91,138,0.1)",
                          color: msg.from === "admin" ? "#c05d3b" : "#6b5b8a",
                        }}>{msg.from === "admin" ? "Organizer" : "Relay"}</span>
                        <span style={{ fontSize: 11, color: "#8a8578", marginLeft: "auto" }}>{msg.time}</span>
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.6, color: "#1a1a2e" }}>{msg.text}</div>
                    </div>
                  </div>
                ))}
                <div style={{ display: "flex", gap: 4, marginTop: 8, fontSize: 12, color: "#8a8578", justifyContent: "center" }}>🔒 Identity protected both ways</div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="landing-section" style={{ padding: "100px 0", background: "#f7f5f0", color: "#1a1a2e" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 className="landing-section-h2" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 38, fontWeight: 400, marginBottom: 12 }}>Live in under 2 minutes</h2>
            <p style={{ fontSize: 17, color: "#8a8578" }}>No coding, no complicated setup.</p>
          </div>
          {[
            { step: "1", title: "Create your organization", desc: "Sign up, name your community, pick a URL. That's it.", icon: "✨" },
            { step: "2", title: "Share your link or QR code", desc: "Post it in your newsletter, pin it at the front desk, or project it at events.", icon: "📱" },
            { step: "3", title: "Read feedback in real-time", desc: "Your admin dashboard shows everything as it comes in. Reply, resolve, and track.", icon: "📊" },
          ].map((item, i) => (
            <div key={item.step} style={{ display: "flex", gap: 24, alignItems: "flex-start", position: "relative", paddingBottom: i < 2 ? 48 : 0 }}>
              {i < 2 && (
                <div style={{ position: "absolute", left: 27, top: 56, bottom: 0, width: 2, background: "linear-gradient(to bottom, rgba(45,106,106,0.3), transparent)" }} />
              )}
              <div style={{
                width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
                background: "#2d6a6a", color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 22, fontWeight: 800, fontFamily: "'DM Serif Display', serif",
                position: "relative", zIndex: 1, boxShadow: "0 4px 16px rgba(45,106,106,0.2)",
              }}>{item.step}</div>
              <div style={{ paddingTop: 6 }}>
                <h3 style={{ fontSize: 19, fontWeight: 700, marginBottom: 6 }}>{item.title} {item.icon}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.6, color: "#8a8578" }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ====== PRICING ====== */}
      <section id="pricing" className="landing-section" style={{ padding: "100px 0", background: "#ede9e0", color: "#1a1a2e" }}>
        <div style={{ maxWidth: 980, margin: "0 auto", padding: "0 28px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <h2 className="landing-section-h2" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 38, fontWeight: 400, marginBottom: 12 }}>Simple, honest pricing</h2>
            <p style={{ fontSize: 17, color: "#8a8578" }}>Start free. Upgrade when your community grows.</p>
          </div>
          <div className="landing-grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {[
              { name: "Free", price: "$0", period: "forever", desc: "Try it out", color: "#8a8578",
                features: ["1 organization", "1 admin", "25 submissions/month", "Identified & anonymous", "QR code generator"],
                cta: "Get Started", popular: false },
              { name: "Community", price: "$4.99", period: "/month", desc: "Active communities", color: "#2d6a6a",
                features: ["1 organization", "3 admins", "Unlimited submissions", "Anonymous relay messaging", "Custom branding & colors", "In-app replies & categories"],
                cta: "Start Free Trial", popular: true },
              { name: "Pro", price: "$9.99", period: "/month", desc: "Multi-community leaders", color: "#c05d3b",
                features: ["Up to 3 organizations", "5 admins per org", "Everything in Community", "AI sentiment analysis", "Surveys & response templates", "CSV export & analytics"],
                cta: "Start Free Trial", popular: false },
            ].map((plan) => (
              <div key={plan.name} className="price-card" style={{
                padding: 32, borderRadius: 20, background: "#fff",
                border: plan.popular ? `2px solid ${plan.color}` : "1px solid rgba(26,26,46,0.08)",
                position: "relative", overflow: "hidden",
              }}>
                {plan.popular && (
                  <>
                    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: plan.color }} />
                    <span style={{
                      position: "absolute", top: 14, right: 14,
                      fontSize: 9, fontWeight: 800, letterSpacing: "0.08em",
                      padding: "4px 10px", borderRadius: 4, background: plan.color, color: "#fff",
                    }}>POPULAR</span>
                  </>
                )}
                <h3 style={{ fontSize: 17, fontWeight: 700, color: plan.color, marginBottom: 2 }}>{plan.name}</h3>
                <p style={{ fontSize: 12, color: "#8a8578", marginBottom: 20 }}>{plan.desc}</p>
                <div style={{ marginBottom: 24 }}>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 42 }}>{plan.price}</span>
                  <span style={{ fontSize: 13, color: "#8a8578", marginLeft: 4 }}>{plan.period}</span>
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 24px", display: "flex", flexDirection: "column", gap: 8 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: plan.color, fontWeight: 700 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a href="/auth/signup" style={{
                  display: "block", textAlign: "center", padding: "12px 24px",
                  borderRadius: 10, fontSize: 14, fontWeight: 700,
                  background: plan.popular ? plan.color : "transparent",
                  color: plan.popular ? "#fff" : plan.color,
                  border: plan.popular ? "none" : `1.5px solid ${plan.color}`,
                }}>{plan.cta}</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== FINAL CTA ====== */}
      <section className="landing-section" style={{
        padding: "100px 0", textAlign: "center",
        background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(45,106,106,0.08), transparent), #f7f5f0",
        color: "#1a1a2e",
      }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "0 28px" }}>
          <div style={{
            width: 64, height: 64, margin: "0 auto 20px",
            background: "linear-gradient(135deg, #2d6a6a, #a3c9c9)",
            borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 28, boxShadow: "0 4px 20px rgba(45,106,106,0.25)",
          }}>🛡️</div>
          <h2 className="landing-section-h2" style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, fontWeight: 400, marginBottom: 14 }}>
            Your community deserves<br />to be heard
          </h2>
          <p style={{ fontSize: 16, lineHeight: 1.7, color: "#8a8578", marginBottom: 32 }}>
            Create your free feedback form in under 2 minutes. No credit card, no coding, no friction.
          </p>
          <a href="/auth/signup" className="cta-btn" style={{
            display: "inline-block", padding: "18px 44px",
            background: "#2d6a6a", color: "#fff", borderRadius: 14,
            fontSize: 17, fontWeight: 700,
          }}>Create Your Free Form →</a>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer style={{ padding: "36px 0", background: "#ede9e0", borderTop: "1px solid rgba(26,26,46,0.08)" }}>
        <div className="landing-footer-inner" style={{ maxWidth: 1060, margin: "0 auto", padding: "0 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>🛡️</span>
            <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, color: "#2d6a6a" }}>TellSafe</span>
            <span style={{ fontSize: 12, color: "#8a8578", marginLeft: 8 }}>© 2026</span>
          </div>
          <div style={{ display: "flex", gap: 24, fontSize: 13, color: "#8a8578" }}>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
            <a href="mailto:hello@tellsafe.app">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
