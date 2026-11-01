import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./nvoid-theme.css";
import { AuthProvider } from "../lib/context/AuthContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://nvoid.ai"),
  title: {
    default: "Nvoid — Global AI Career Agent",
    template: "%s | Nvoid"
  },
  description: "Discover job opportunities across connected sources and company career pages. Build your professional profile and let Nvoid agent find relevant opportunities for you.",
  applicationName: "Nvoid",
  openGraph: {
    type: "website",
    siteName: "Nvoid",
    title: "Nvoid — Global AI Career Agent",
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
  themeColor: "#212121"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><AuthProvider>{children}</AuthProvider></body></html>;
}
