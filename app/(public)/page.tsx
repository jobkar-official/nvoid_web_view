import type { Metadata } from "next";
import WorkerHomepage from "../../components/worker-homepage";

export const metadata: Metadata = {
  title: { absolute: "NVOIDAI — Global AI Career Agent" },
  description: "Find jobs across public job boards and company career pages. NVOIDAI independently discovers and checks original listings by job title and location without external job-data API integrations.",
  alternates: {
    canonical: "/"
  }
};

const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "NVOIDAI",
  alternateName: ["Nvoid AI", "nvoidai.com"],
  url: "https://nvoidai.com/"
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteStructuredData).replace(/</g, "\\u003c")
        }}
      />
      <WorkerHomepage />
    </>
  );
}
