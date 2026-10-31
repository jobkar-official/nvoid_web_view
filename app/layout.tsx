import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nvoid.ai"),
  title: {
    default: "Worker — AI-Powered Job Discovery",
    template: "%s | Worker"
  },
  description: "Discover job opportunities across connected sources and company career pages. Build your professional profile and let Worker agent find relevant opportunities for you.",
  applicationName: "Worker",
  openGraph: {
    type: "website",
    siteName: "Worker",
    title: "Worker — AI-Powered Employment Discovery",
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
  return <html lang="en"><body>{children}</body></html>;
}
