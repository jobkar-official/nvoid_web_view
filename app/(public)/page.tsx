import type { Metadata } from "next";
import GuestHome from "../../components/guest-home";

export const metadata: Metadata = {
  title: "Find Jobs Across the Market with Nvoid",
  description: "Search job opportunities across connected sources and company career pages. Create a profile and let Nvoid Bot discover relevant jobs for you."
};

export default function HomePage() {
  return <GuestHome />;
}
