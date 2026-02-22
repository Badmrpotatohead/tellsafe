// ============================================================
// TellSafe — Public Updates Board Page
// ============================================================
// Route: tellsafe.app/{orgSlug}/updates
// Shows published updates for the organization as a branded timeline.

import { notFound } from "next/navigation";
import { BrandProvider } from "../../../components/BrandProvider";
import UpdatesBoard from "../../../components/UpdatesBoard";
import type { Organization } from "../../../types";
import type { Metadata } from "next";

interface Props {
  params: { orgSlug: string };
}

// Server-side data fetch using Admin SDK
async function getOrgBySlug(slug: string): Promise<Organization | null> {
  const { adminDb } = await import("../../../lib/firebase-admin");

  // Look up orgId from the slugs collection
  const slugDoc = await adminDb.collection("slugs").doc(slug).get();
  if (!slugDoc.exists) return null;

  const { orgId } = slugDoc.data() as { orgId: string };
  const orgSnap = await adminDb.collection("organizations").doc(orgId).get();
  if (!orgSnap.exists) return null;

  return { id: orgSnap.id, ...orgSnap.data() } as Organization;
}

async function getPublishedUpdates(orgId: string) {
  const { adminDb } = await import("../../../lib/firebase-admin");
  const snap = await adminDb
    .collection("organizations")
    .doc(orgId)
    .collection("updates")
    .where("status", "==", "published")
    .orderBy("createdAt", "desc")
    .get();
  return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Dynamic metadata for SEO + social sharing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const org = await getOrgBySlug(params.orgSlug);
  if (!org) return { title: "Not Found — TellSafe" };

  return {
    title: `Updates — ${org.name} | TellSafe`,
    description: `See the latest updates from ${org.name} based on community feedback.`,
    openGraph: {
      title: `Updates from ${org.name}`,
      description: `See what's changed based on your feedback at ${org.name}.`,
      type: "website",
      siteName: "TellSafe",
    },
  };
}

export default async function UpdatesPage({ params }: Props) {
  const org = await getOrgBySlug(params.orgSlug);

  if (!org) {
    notFound();
  }

  const rawUpdates = await getPublishedUpdates(org.id);

  // Normalize Firestore Timestamps to ISO strings for serialization
  const updates = rawUpdates.map((u: any) => ({
    id: u.id,
    title: u.title || "",
    body: u.body || "",
    emoji: u.emoji || "\u2728",
    category: u.category || null,
    createdAt:
      typeof u.createdAt === "string"
        ? u.createdAt
        : u.createdAt?.toDate
          ? u.createdAt.toDate().toISOString()
          : new Date().toISOString(),
  }));

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,600;9..144,700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(18px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
      `}</style>
      <BrandProvider org={org}>
        <UpdatesBoard orgSlug={org.slug} updates={updates} hidePoweredBy={org.hidePoweredBy} />
      </BrandProvider>
    </>
  );
}
