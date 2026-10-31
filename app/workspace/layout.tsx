import type { ReactNode } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import WorkspaceShell from "../../components/workspace-shell";
import { getNvoidSession } from "../../lib/auth-session";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function WorkspaceLayout({ children }: { children: ReactNode }) {
  const session = await getNvoidSession();
  if (!session) redirect("/auth/signin?next=/workspace");
  return <><WorkspaceShell initialSession={session} />{children}</>;
}
