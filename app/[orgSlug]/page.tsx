// ============================================================
// TellSafe — Public Feedback Form Page
// ============================================================
// Route: tellsafe.app/{orgSlug}
// Loads org branding server-side, passes to BrandProvider + FeedbackForm.

import { notFound } from "next/navigation";
import { BrandProvider } from "../../components/BrandProvider";
import FeedbackForm from "../../components/FeedbackForm";
import type { Organization } from "../../types";
import type { Metadata } from "next";

interface Props {
  params: { orgSlug: string };
}

// Server-side data fetch using Admin SDK
async function getOrgBySlug(slug: string): Promise<Organization | null> {
  const { adminDb } = await import("../../lib/firebase-admin");

  // Look up orgId from the slugs collection
  const slugDoc = await adminDb.collection("slugs").doc(slug).get();
  if (!slugDoc.exists) return null;

  const { orgId } = slugDoc.data() as { orgId: string };
  const orgSnap = await adminDb.collection("organizations").doc(orgId).get();
  if (!orgSnap.exists) return null;

  return { id: orgSnap.id, ...orgSnap.data() } as Organization;
}

// Dynamic metadata for SEO + social sharing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const org = await getOrgBySlug(params.orgSlug);
  if (!org) return { title: "Not Found — TellSafe" };

  return {
    title: `Share Feedback — ${org.name} | TellSafe`,
    description: org.tagline,
    openGraph: {
      title: `Share Feedback with ${org.name}`,
      description: org.tagline,
      type: "website",
      siteName: "TellSafe",
    },
  };
}

export default async function FeedbackPage({ params }: Props) {
  const org = await getOrgBySlug(params.orgSlug);

  if (!org) {
    notFound();
  }

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
      `}</style>
      <BrandProvider org={org}>
        <FeedbackForm org={org} />
      </BrandProvider>
    </>
  );
}
