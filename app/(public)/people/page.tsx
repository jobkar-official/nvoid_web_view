import type { Metadata } from "next";
import GrowNetworkPage from "../../../components/grow-network-page";
import { getNvoidSession } from "../../../lib/auth-session";

export const metadata: Metadata = {
  title: "Grow Your Professional Network | NVOIDAI",
  description: "Discover suggested professionals and grow your network on NVOIDAI.",
  robots: { index: false, follow: false }
};

export default async function PeoplePage() {
  const session = await getNvoidSession();
  return <GrowNetworkPage userId={session?.user.id || null} />;
}
