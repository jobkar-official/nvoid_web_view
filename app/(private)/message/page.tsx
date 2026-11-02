import { redirect } from "next/navigation";
import PrivateMessagesPage from "../../../components/private-messages-page";
import { getNvoidSession } from "../../../lib/auth-session";

export default async function MessagePage() {
  const session = await getNvoidSession();
  if (!session) redirect("/auth/signin");
  return <PrivateMessagesPage initialSession={session} />;
}
