import type { Metadata } from "next";
import PublicProfilePage from "../../../components/public-profile-page";

export const metadata: Metadata = {
  title: "Professional Profile | NVOIDAI",
  description: "View a public professional profile on NVOIDAI.",
  robots: { index: false, follow: false }
};

export default async function SlugProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PublicProfilePage slug={slug} />;
}
