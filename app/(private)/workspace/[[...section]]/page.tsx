import type { Metadata } from "next";
import { getNvoidSession } from "../../../../lib/auth-session";
import PrivateWorkspace from "../../../../components/private-workspace";

export const metadata: Metadata = {
  title: "Workspace",
  robots: { index: false, follow: false }
};

export default async function WorkspacePage({ params }: { params: Promise<{ section?: string[] }> }) {
  const session = await getNvoidSession();
  if (!session) return null;
  const { section = [] } = await params;
  return <PrivateWorkspace initialSession={session} initialSection={section[0] || "overview"} />;
}
