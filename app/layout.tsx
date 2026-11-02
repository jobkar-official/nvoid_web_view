import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./nvoid-theme.css";
import { AuthProvider } from "../lib/context/AuthContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://nvoidai.com/"),
  title: {
    default: "NVOIDAI — Global AI Career Agent",
    template: "%s | NVOIDAI"
  },
  description: "Discover job opportunities across connected sources and company career pages. Build your professional profile and let the NVOIDAI AI agent find relevant opportunities for you.",
  applicationName: "NVOIDAI",
  icons: {
    icon: [
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" }
    ],
    apple: "/apple-touch-icon.png"
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    siteName: "NVOIDAI",
    title: "NVOIDAI — Global AI Career Agent",
    description: "Explore opportunities across the job market and let your AI job agent discover relevant roles."
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 }
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#000000"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><AuthProvider>{children}</AuthProvider></body></html>;
}
