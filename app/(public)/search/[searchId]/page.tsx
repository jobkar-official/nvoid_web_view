import type { Metadata } from "next";
import GuestHome from "../../../../components/guest-home";

export const metadata: Metadata = {
  title: "Saved job search | Worker",
  description: "Review job opportunities from a saved Worker search.",
  robots: { index: false, follow: false }
};

export default async function SavedSearchPage({
  params
}: {
  params: Promise<{ searchId: string }>;
}) {
  const { searchId } = await params;
  return <GuestHome searchId={searchId} />;
}
