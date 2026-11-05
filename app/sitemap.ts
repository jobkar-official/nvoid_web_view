import type { MetadataRoute } from "next";

const siteUrl = "https://nvoidai.com";

const publicPages: Array<{
  path: string;
  changeFrequency: NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/free-job-posting", changeFrequency: "monthly", priority: 0.9 },
  { path: "/models", changeFrequency: "monthly", priority: 0.8 },
  { path: "/models/alpha-k1", changeFrequency: "monthly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/release", changeFrequency: "weekly", priority: 0.7 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/cookies", changeFrequency: "yearly", priority: 0.3 }
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPages.map(({ path, ...metadata }) => ({
    url: new URL(path, siteUrl).toString(),
    ...metadata
  }));
}
