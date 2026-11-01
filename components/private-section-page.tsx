import { redirect } from "next/navigation";
import { getNvoidSession } from "../lib/auth-session";
import PrivateAccountPage from "./private-account-page";

export default async function PrivateSectionPage({ section }: { section: string }) {
  const session = await getNvoidSession();
  if (!session) redirect("/auth/signin");
  return <PrivateAccountPage initialSession={session} initialSection={section} />;
}
