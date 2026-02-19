// ============================================================
// TellSafe — Privacy Policy
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — TellSafe",
  description: "How TellSafe protects your data and respects your privacy.",
};

export default function PrivacyPage() {
  return (
    <div
      style={{
        fontFamily: "'DM Sans', sans-serif",
        background: "#f7f5f0",
        color: "#1a1a2e",
        minHeight: "100vh",
      }}
    >
      {/* Nav */}
      <nav
        style={{
          padding: "18px 0",
          background: "#0f1117",
          borderBottom: "1px solid rgba(247,245,240,0.06)",
        }}
      >
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            padding: "0 28px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <a
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <span style={{ fontSize: 24 }}>🛡️</span>
            <span
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: 22,
                fontWeight: 400,
                color: "#a3c9c9",
              }}
            >
              TellSafe
            </span>
          </a>
        </div>
      </nav>

      {/* Content */}
      <main style={{ maxWidth: 800, margin: "0 auto", padding: "60px 28px 100px" }}>
        <h1
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 38,
            fontWeight: 400,
            marginBottom: 8,
          }}
        >
          Privacy Policy
        </h1>
        <p style={{ fontSize: 14, color: "#8a8578", marginBottom: 48 }}>
          Last updated: February 19, 2026
        </p>

        <Section title="Overview">
          TellSafe is an anonymous feedback platform. Privacy isn&apos;t a feature
          — it&apos;s the foundation. This policy explains what data we collect,
          why, and how we protect it.
        </Section>

        <Section title="What We Collect">
          <BulletList
            items={[
              "Account information: Email address and password (for admins who sign up).",
              "Organization data: Name, slug, branding settings, and survey configuration.",
              "Feedback submissions: The content of feedback, selected category, and privacy mode. For identified submissions, the submitter's name and email. For anonymous submissions, no identifying information whatsoever.",
              "Relay data: For relay-mode feedback, we store an encrypted email address to enable two-way anonymous communication. This email is encrypted at rest and never visible to admins.",
              "Usage data: Basic analytics like page views and feature usage to improve the product. No tracking cookies are used.",
            ]}
          />
        </Section>

        <Section title="What We Don't Collect">
          <BulletList
            items={[
              "We do not collect IP addresses from feedback submitters.",
              "We do not use third-party tracking or advertising cookies.",
              "We do not sell, rent, or share your data with third parties.",
              "We do not store plaintext email addresses for relay-mode submissions.",
            ]}
          />
        </Section>

        <Section title="How We Protect Your Data">
          <BulletList
            items={[
              "All data is transmitted over HTTPS/TLS encryption.",
              "Relay email addresses are encrypted using AES-256 before storage.",
              "Authentication is handled via Firebase Auth with industry-standard security.",
              "Database access is restricted by role-based security rules.",
              "We use Stripe for payment processing — we never see or store your full card number.",
            ]}
          />
        </Section>

        <Section title="Anonymous Feedback">
          When a member submits feedback in anonymous mode, we store only the
          feedback content, category, and timestamp. There is no technical
          mechanism to trace anonymous feedback back to an individual. In relay
          mode, the submitter&apos;s email is encrypted and used solely to
          facilitate anonymous two-way conversation. Admins never see the
          submitter&apos;s email.
        </Section>

        <Section title="Data Retention">
          Feedback data is retained as long as your organization account is
          active. If you delete your organization or account, all associated
          data (including feedback, relay threads, and encrypted emails) is
          permanently deleted within 30 days.
        </Section>

        <Section title="Your Rights">
          <BulletList
            items={[
              "Access: Request a copy of data associated with your account.",
              "Deletion: Request deletion of your account and all associated data.",
              "Correction: Update your account information at any time.",
              "Portability: Export your feedback data via CSV from the admin dashboard.",
            ]}
          />
          <p style={{ marginTop: 12 }}>
            To exercise these rights, email us at{" "}
            <a href="mailto:hello@tellsafe.app" style={{ color: "#2d6a6a", textDecoration: "underline" }}>
              hello@tellsafe.app
            </a>
            .
          </p>
        </Section>

        <Section title="Third-Party Services">
          <BulletList
            items={[
              "Firebase (Google): Authentication and database hosting.",
              "Stripe: Payment processing for paid plans.",
              "SendGrid (Twilio): Email delivery for relay communication and notifications.",
              "Vercel: Application hosting.",
            ]}
          />
          <p style={{ marginTop: 12 }}>
            Each of these providers has their own privacy policy and maintains
            SOC 2 compliance.
          </p>
        </Section>

        <Section title="Changes to This Policy">
          We may update this policy from time to time. Material changes will be
          communicated via email to registered admins. Continued use of TellSafe
          after changes constitutes acceptance of the updated policy.
        </Section>

        <Section title="Contact">
          <p>
            Questions or concerns? Reach us at{" "}
            <a href="mailto:hello@tellsafe.app" style={{ color: "#2d6a6a", textDecoration: "underline" }}>
              hello@tellsafe.app
            </a>
            .
          </p>
        </Section>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2
        style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: 22,
          fontWeight: 400,
          marginBottom: 12,
          color: "#1a1a2e",
        }}
      >
        {title}
      </h2>
      <div style={{ fontSize: 15, lineHeight: 1.8, color: "#4a4a5a" }}>{children}</div>
    </div>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={{ padding: "0 0 0 20px", margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item) => (
        <li key={item} style={{ fontSize: 15, lineHeight: 1.7, color: "#4a4a5a" }}>
          {item}
        </li>
      ))}
    </ul>
  );
}
