import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/application",
        "/highlights",
        "/message",
        "/notification",
        "/profile",
        "/support",
        "/search/",
        "/connections",
        "/research"
      ]
    },
    sitemap: "https://nvoidai.com/sitemap.xml"
  };
}
