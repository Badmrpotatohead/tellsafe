// ============================================================
// TellSafe — QR Code Generator Component
// ============================================================
// Generates a QR code pointing to the org's public feedback form.
// Uses the `qrcode` npm package for client-side generation.
// npm install qrcode @types/qrcode

"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { useBrand } from "./BrandProvider";

const fontStack = "'Outfit', system-ui, sans-serif";
const displayFont = "'Fraunces', Georgia, serif";
const monoFont = "'JetBrains Mono', monospace";

interface Props {
  orgSlug: string;
}

export default function QRCodeGenerator({ orgSlug }: Props) {
  const { theme, orgName } = useBrand();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [copiedKiosk, setCopiedKiosk] = useState(false);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://tellsafe.app";
  const formUrl = `${baseUrl}/${orgSlug}`;
  const kioskUrl = `${baseUrl}/${orgSlug}?mode=kiosk`;

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, formUrl, {
        width: 280,
        margin: 2,
        color: {
          dark: "#1a1a2e",
          light: "#ffffff",
        },
      });
    }
  }, [formUrl]);

  const handleDownload = () => {
    if (!canvasRef.current) return;

    // Create a new canvas with branding
    const exportCanvas = document.createElement("canvas");
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    const padding = 40;
    const qrSize = 280;
    const headerHeight = 60;
    const footerHeight = 50;
    const totalWidth = qrSize + padding * 2;
    const totalHeight = qrSize + padding * 2 + headerHeight + footerHeight;

    exportCanvas.width = totalWidth;
    exportCanvas.height = totalHeight;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.roundRect(0, 0, totalWidth, totalHeight, 16);
    ctx.fill();

    // Header
    ctx.fillStyle = "#1a1a2e";
    ctx.font = "bold 20px Outfit, system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(orgName, totalWidth / 2, padding + 24);

    ctx.fillStyle = "#8a8578";
    ctx.font = "14px Outfit, system-ui, sans-serif";
    ctx.fillText("Share your feedback anonymously", totalWidth / 2, padding + 48);

    // QR Code
    ctx.drawImage(canvasRef.current, padding, padding + headerHeight, qrSize, qrSize);

    // Footer
    ctx.fillStyle = "#8a8578";
    ctx.font = "12px Outfit, system-ui, sans-serif";
    ctx.fillText(`🛡️ Powered by TellSafe`, totalWidth / 2, padding + headerHeight + qrSize + 30);

    // Download
    const link = document.createElement("a");
    link.download = `tellsafe-${orgSlug}-qr.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(formUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyKiosk = () => {
    navigator.clipboard.writeText(kioskUrl);
    setCopiedKiosk(true);
    setTimeout(() => setCopiedKiosk(false), 2000);
  };

  return (
    <div style={{ maxWidth: 480, fontFamily: fontStack }}>
      <h2 style={{ fontFamily: displayFont, fontSize: 22, fontWeight: 600, marginBottom: 6 }}>
        QR Code & Link
      </h2>
      <p style={{ fontSize: 13, color: theme.muted, marginBottom: 28, lineHeight: 1.6 }}>
        Print the QR code on flyers, table cards, or posters. Anyone who scans it goes directly to your feedback form.
      </p>

      {/* QR Code card */}
      <div
        style={{
          background: theme.white,
          borderRadius: 20,
          padding: 32,
          boxShadow: theme.shadowLg,
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, color: theme.ink }}>
          {orgName}
        </div>
        <div style={{ fontSize: 13, color: theme.muted, marginBottom: 20 }}>
          Share your feedback anonymously
        </div>

        <canvas
          ref={canvasRef}
          style={{
            display: "block",
            margin: "0 auto 20px",
            borderRadius: 12,
          }}
        />

        <div style={{ fontSize: 11, color: theme.muted }}>🛡️ Powered by TellSafe</div>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        style={{
          width: "100%",
          padding: 14,
          background: theme.primary,
          color: "#fff",
          border: "none",
          borderRadius: 12,
          fontSize: 15,
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: fontStack,
          marginBottom: 16,
        }}
      >
        📥 Download QR Code (PNG)
      </button>

      {/* Shareable link */}
      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 8,
            color: theme.ink,
          }}
        >
          Shareable Link
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={formUrl}
            readOnly
            style={{
              flex: 1,
              padding: "10px 14px",
              border: `1.5px solid ${theme.divider}`,
              borderRadius: 10,
              fontSize: 13,
              color: theme.ink,
              background: theme.paper,
              fontFamily: monoFont,
              outline: "none",
            }}
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={handleCopy}
            style={{
              padding: "10px 18px",
              background: copied ? "#059669" : theme.ink,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: fontStack,
              transition: "background 0.3s",
              whiteSpace: "nowrap",
            }}
          >
            {copied ? "✓ Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Kiosk link */}
      <div style={{ marginBottom: 24 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 8,
            color: theme.ink,
          }}
        >
          Kiosk Mode Link
          <span style={{ fontWeight: 400, color: theme.muted, fontSize: 11, marginLeft: 6 }}>
            (auto-resets after submission)
          </span>
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={kioskUrl}
            readOnly
            style={{
              flex: 1,
              padding: "10px 14px",
              border: `1.5px solid ${theme.divider}`,
              borderRadius: 10,
              fontSize: 13,
              color: theme.ink,
              background: theme.paper,
              fontFamily: monoFont,
              outline: "none",
            }}
            onClick={(e) => (e.target as HTMLInputElement).select()}
          />
          <button
            onClick={handleCopyKiosk}
            style={{
              padding: "10px 18px",
              background: copiedKiosk ? "#059669" : theme.ink,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: fontStack,
              transition: "background 0.3s",
              whiteSpace: "nowrap",
            }}
          >
            {copiedKiosk ? "✓ Copied" : "Copy"}
          </button>
        </div>
        <div style={{ fontSize: 11, color: theme.muted, marginTop: 6, lineHeight: 1.5 }}>
          Use this link on an iPad or tablet at your venue. The form auto-resets 5 seconds after each submission — perfect for walk-up feedback stations.
        </div>
      </div>

      {/* Usage tips */}
      <div
        style={{
          background: theme.primaryGlow,
          borderRadius: 12,
          padding: 16,
          fontSize: 13,
          color: theme.primary,
          lineHeight: 1.6,
        }}
      >
        <strong>Tips for placement:</strong> Print the QR code on table cards at your venue entrance, include it in event flyers, or add it to your email newsletter footer. The easier it is to find, the more feedback you'll get.
      </div>
    </div>
  );
}
