// ============================================================
// TellSafe — Terms of Service
// ============================================================

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — TellSafe",
  description: "Terms of Service for using the TellSafe platform.",
};

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p style={{ fontSize: 14, color: "#8a8578", marginBottom: 48 }}>
          Last updated: February 19, 2026
        </p>

        <Section title="1. Acceptance of Terms">
          By accessing or using TellSafe (&quot;the Service&quot;), you agree to
          be bound by these Terms of Service. If you do not agree, please do not
          use the Service.
        </Section>

        <Section title="2. Description of Service">
          TellSafe is a feedback platform that enables communities and
          organizations to collect anonymous, identified, and relay-based
          feedback from their members. The Service includes a feedback
          submission form, admin dashboard, anonymous email relay, and related
          features.
        </Section>

        <Section title="3. Accounts">
          <BulletList
            items={[
              "You must provide a valid email address to create an admin account.",
              "You are responsible for maintaining the security of your account credentials.",
              "You must be at least 18 years old to create an admin account.",
              "One person or entity may not maintain more than one free account.",
              "You are responsible for all activity that occurs under your account.",
            ]}
          />
        </Section>

        <Section title="4. Acceptable Use">
          You agree not to use TellSafe to:
          <BulletList
            items={[
              "Collect feedback for illegal purposes or to facilitate harm.",
              "Submit false, defamatory, or harassing feedback.",
              "Attempt to de-anonymize anonymous feedback submitters.",
              "Reverse-engineer, decompile, or attempt to extract the source code of the Service.",
              "Use the Service to send spam or unsolicited messages.",
              "Interfere with or disrupt the Service or its infrastructure.",
              "Violate any applicable laws or regulations.",
            ]}
          />
        </Section>

        <Section title="5. Feedback Content">
          Feedback submitters retain ownership of the content they submit.
          By submitting feedback, submitters grant the organization admin a
          license to read, respond to, and act on the feedback within the
          platform. TellSafe does not claim ownership of any user-submitted
          content.
        </Section>

        <Section title="6. Privacy">
          Your use of the Service is also governed by our{" "}
          <a href="/privacy" style={{ color: "#2d6a6a", textDecoration: "underline" }}>
            Privacy Policy
          </a>
          . TellSafe is committed to protecting the anonymity of feedback
          submitters who choose anonymous or relay modes.
        </Section>

        <Section title="7. Payments and Billing">
          <BulletList
            items={[
              "Free plans are available with limited features as described on our pricing page.",
              "Paid plans (Community and Pro) are billed monthly via Stripe.",
              "You may cancel your subscription at any time. Access continues until the end of your billing period.",
              "Refunds are handled on a case-by-case basis. Contact us within 14 days of a charge for consideration.",
              "We reserve the right to change pricing with 30 days advance notice via email.",
            ]}
          />
        </Section>

        <Section title="8. Service Availability">
          We strive to maintain 99.9% uptime but do not guarantee
          uninterrupted access. The Service may be temporarily unavailable for
          maintenance, updates, or circumstances beyond our control. We are not
          liable for any loss resulting from service interruptions.
        </Section>

        <Section title="9. Termination">
          We may suspend or terminate your account if you violate these Terms.
          You may delete your account at any time by contacting us. Upon
          termination, your data will be deleted in accordance with our Privacy
          Policy.
        </Section>

        <Section title="10. Limitation of Liability">
          To the maximum extent permitted by law, TellSafe and its creators
          shall not be liable for any indirect, incidental, special, or
          consequential damages arising from your use of the Service. Our total
          liability shall not exceed the amount you have paid us in the 12
          months preceding the claim.
        </Section>

        <Section title="11. Disclaimer of Warranties">
          The Service is provided &quot;as is&quot; and &quot;as
          available&quot; without warranties of any kind, whether express or
          implied. We do not warrant that the Service will be error-free,
          secure, or available at all times.
        </Section>

        <Section title="12. Changes to Terms">
          We may update these Terms from time to time. Material changes will be
          communicated via email to registered admins at least 14 days before
          taking effect. Continued use after changes constitutes acceptance.
        </Section>

        <Section title="13. Contact">
          <p>
            Questions about these terms? Email us at{" "}
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
    <ul style={{ padding: "0 0 0 20px", margin: "8px 0 0", display: "flex", flexDirection: "column", gap: 8 }}>
      {items.map((item) => (
        <li key={item} style={{ fontSize: 15, lineHeight: 1.7, color: "#4a4a5a" }}>
          {item}
        </li>
      ))}
    </ul>
  );
}
