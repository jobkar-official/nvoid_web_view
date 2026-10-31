import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WorkspaceShell from "../../../../components/workspace-shell";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function WorkspacePreviewPage({ params }: { params: Promise<{ roleId: string }> }) {
  if (process.env.NODE_ENV === "production") notFound();
  const { roleId: rawRoleId } = await params;
  const roleId = Number(rawRoleId);
  if (roleId !== 3 && roleId !== 4 && roleId !== 7) notFound();
  const name = roleId === 3 ? "Recruiter Preview" : roleId === 7 ? "Support Preview" : "Job Seeker Preview";
  return <WorkspaceShell initialSession={{ roleId, isPreview: true, user: { id: "local-preview-" + roleId, name, fullName: name } }} />;
}
