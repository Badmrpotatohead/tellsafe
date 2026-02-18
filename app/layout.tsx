// ============================================================
// TellSafe — Root Layout
// ============================================================

import { AuthProvider } from "../components/AuthProvider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "TellSafe — Anonymous Feedback for Communities",
  description:
    "Give your community a safe, anonymous way to share feedback. Three privacy modes, encrypted email relay, and a beautiful admin dashboard.",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "TellSafe — Anonymous Feedback for Communities",
    description:
      "Every voice matters. Even the quiet ones. TellSafe gives your community a safe way to share honest feedback.",
    type: "website",
    siteName: "TellSafe",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700&family=DM+Serif+Display&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily: "'Outfit', 'DM Sans', system-ui, sans-serif",
          WebkitFontSmoothing: "antialiased",
          background: "#f8f6f1",
        }}
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
