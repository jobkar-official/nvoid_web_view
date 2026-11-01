import type { Metadata } from "next";
import WorkerHomepage from "../../components/worker-homepage";

export const metadata: Metadata = {
  title: { absolute: "Nvoid — Global AI Career Agent" },
  description: "Explore job opportunities across public job feeds, company career pages and configured research tools with Nvoid, a global AI-powered career agent."
};

export default function HomePage() {
  return <WorkerHomepage />;
}
