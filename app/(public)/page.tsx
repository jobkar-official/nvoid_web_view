import type { Metadata } from "next";
import WorkerHomepage from "../../components/worker-homepage";

export const metadata: Metadata = {
  title: "Worker — AI Job Discovery Across Connected Sources",
  description: "Explore job opportunities across public job feeds, company career pages and configured research tools with Worker, an AI-powered job discovery platform."
};

export default function HomePage() {
  return <WorkerHomepage />;
}
