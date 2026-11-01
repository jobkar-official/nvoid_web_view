import type { Metadata } from "next";
import InfoPage from "../../../components/info-page";

export const metadata: Metadata = {
  title: "Cookies & Browser Storage — Worker",
  description: "Understand how Worker uses local browser storage and how you can manage locally saved search history."
};

export default function CookiesPage() {
  return <InfoPage kind="legal" eyebrow="WORKER / BROWSER STORAGE" title="Cookies and browser storage" description="Worker uses browser storage for selected convenience features. This notice distinguishes data saved locally in your browser from account information handled by connected services." updated="1 November 2026" sections={[
    { title: "Guest search history", body: "The current guest interface stores recent job-search entries in local storage on the device and browser used for the visit. Entries include a generated identifier, job title, location, search time and returned result count. Visitors can delete individual searches or clear the history from the sidebar." },
    { title: "Essential session storage", body: "Signed-in experiences may use essential cookies or browser storage to maintain a session, remember security preferences and protect account access. The exact cookie names, duration and attributes should be documented against the production authentication configuration." },
    { title: "Analytics and optional technologies", body: "Analytics, advertising, personalization and other optional technologies should only be enabled with appropriate notice and consent where required. This notice does not claim that any particular optional tracking tool is currently active." },
    { title: "Managing browser data", body: "You can delete guest search history from Worker's sidebar or clear site storage through your browser settings. Clearing local storage removes the locally saved guest search list from that browser; it does not by itself delete server-side account records." },
    { title: "Updates", body: "This notice should be updated whenever Worker introduces or changes cookies, analytics, authentication storage or third-party tracking technologies." }
  ]} />;
}
