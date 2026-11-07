import type { Metadata } from "next";
import WorkerHomepage from "../../components/worker-homepage";

export const metadata: Metadata = {
  title: { absolute: "NVOIDAI — Global AI Career Agent" },
  description: "Explore job opportunities across public job feeds, company career pages and configured research tools with NVOIDAI, a global AI-powered career agent.",
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
