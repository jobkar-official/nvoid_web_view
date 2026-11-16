export function buildTrackedApplicationUrl(value: string, source?: string): string | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;

    url.searchParams.set("utm_source", "nvoidai.com");
    url.searchParams.set("utm_medium", "job_listing");
    url.searchParams.set("utm_campaign", "job_application");

    const sourceValue = source?.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
    if (sourceValue) url.searchParams.set("utm_content", sourceValue);

    return url.toString();
  } catch {
    return null;
  }
}
