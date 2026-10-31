import type { Metadata } from "next";
import GuestHome from "../../components/guest-home";

export const metadata: Metadata = {
  title: "Find Jobs Across the Market with Worker",
  description: "Search job opportunities across connected sources and company career pages. Create a profile and let Worker agent discover relevant jobs for you."
};

export default function HomePage() {
  return <GuestHome />;
}
