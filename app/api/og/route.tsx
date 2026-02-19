// ============================================================
// TellSafe — Dynamic OG Image
// ============================================================

import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f1117 0%, #1a1e28 50%, #151820 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            top: -60,
            width: 600,
            height: 400,
            background: "radial-gradient(ellipse, rgba(45,106,106,0.25), transparent 70%)",
            display: "flex",
          }}
        />

        {/* Shield icon */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 24,
            background: "linear-gradient(135deg, #2d6a6a, #a3c9c9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 42,
            marginBottom: 28,
            boxShadow: "0 8px 32px rgba(45,106,106,0.4)",
          }}
        >
          🛡️
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: "#f7f5f0",
            marginBottom: 12,
            textAlign: "center",
            display: "flex",
          }}
        >
          TellSafe
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 28,
            color: "rgba(247,245,240,0.6)",
            textAlign: "center",
            maxWidth: 800,
            lineHeight: 1.4,
            display: "flex",
          }}
        >
          Anonymous feedback, built for communities
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginTop: 40,
          }}
        >
          {["Three Privacy Modes", "Anonymous Relay", "Admin Dashboard"].map(
            (label) => (
              <div
                key={label}
                style={{
                  padding: "10px 24px",
                  borderRadius: 100,
                  background: "rgba(247,245,240,0.08)",
                  border: "1px solid rgba(247,245,240,0.12)",
                  color: "#a3c9c9",
                  fontSize: 18,
                  fontWeight: 600,
                  display: "flex",
                }}
              >
                {label}
              </div>
            )
          )}
        </div>

        {/* Bottom URL */}
        <div
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 18,
            color: "rgba(247,245,240,0.3)",
            display: "flex",
          }}
        >
          tellsafe.vercel.app
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
