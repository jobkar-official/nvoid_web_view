import type { Metadata } from "next";
import InfoPage from "../../../components/info-page";

export const metadata: Metadata = { title: "Cookie and Local Storage Notice — Nvoid", description: "How Nvoid uses browser storage and cookies." };

export default function CookiesPage() {
  return <InfoPage eyebrow="LEGAL" title="Cookies and browser storage" description="Nvoid uses browser storage for certain convenience features. This notice distinguishes local browser data from server-side account records." updated="October 31, 2026" sections={[
    { title: "Guest search history", body: "The current guest interface stores recent job-search entries in local storage on the device and browser used for the visit. Entries include a generated identifier, job title, location, search time and returned result count. Visitors can delete individual searches or clear the history from the sidebar." },
    { title: "Essential storage", body: "Future authentication and security features may use essential cookies or browser storage to maintain a signed-in session, remember security preferences and protect account access. Their exact names, duration and attributes must be documented when implemented." },
    { title: "Analytics and optional technologies", body: "Analytics, advertising, personalization and other optional technologies should only be enabled with appropriate notice and consent where required. This page does not represent that such tools are currently active." },
    { title: "Managing browser data", body: "You can delete guest search history from Nvoid's sidebar or clear site storage through your browser settings. Clearing local storage removes the local guest search list from that browser." },
    { title: "Updates", body: "This notice should be updated whenever Nvoid introduces or changes cookies, analytics, authentication storage or third-party tracking technologies." }
  ]} />;
}
