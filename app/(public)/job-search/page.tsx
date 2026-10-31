import type { Metadata } from "next";
import GuestHome from "../../../components/guest-home";

export const metadata: Metadata = {
  title: "Find Jobs Across Connected Sources",
  description: "Search opportunities across the job sources configured for Worker.",
  robots: { index: false, follow: true }
};

type SearchParams = {
  role?: string | string[];
  location?: string | string[];
};

function firstValue(value?: string | string[]) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

export default async function JobSearchPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  return (
    <GuestHome
      initialJobTitle={firstValue(params.role)}
      initialLocation={firstValue(params.location) || "India"}
    />
  );
}
