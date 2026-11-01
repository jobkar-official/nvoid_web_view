const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://edge.jobkar.in";
const CHAT_URL_SOURCE = process.env.NEXT_PUBLIC_SOCKET_URL || "https://chat.jobkar.in";
export const JOBKAR_CHAT_URL = CHAT_URL_SOURCE
  .replace(/^wss:/, "https:")
  .replace(/^ws:/, "http:")
  .replace(/\/+$/, "");

const API_ORIGINS = new Set(
  [BASE_URL.replace(/\/+$/, ""), "https://edge.jobkar.in", JOBKAR_CHAT_URL]
    .map(value => {
      try { return new URL(value).origin; } catch { return ""; }
    })
    .filter(Boolean)
);

export const JOBKAR_AUTH_EXPIRED_EVENT = "jobkar:auth-expired";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface RequestOptions {
  method?: HttpMethod;
  body?: BodyInit | Record<string, unknown> | null;
  headers?: Record<string, string>;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export const isNotFoundError = (error: unknown): boolean =>
  error instanceof ApiError
    ? error.status === 404
    : /not found|does not exist|no record|no data/i.test(String((error as Error)?.message || error || ""));

function proxyEndpoint(endpoint: string): string {
  if (/^https?:\/\//i.test(endpoint)) {
    let absolute: URL;
    try { absolute = new URL(endpoint); } catch { throw new ApiError("Invalid API endpoint.", 400); }
    if (!API_ORIGINS.has(absolute.origin)) throw new ApiError("Blocked API destination.", 400);
    const isChat = absolute.origin === new URL(JOBKAR_CHAT_URL).origin;
    return "/api/jobkar" + (isChat ? "/chat" : "") + absolute.pathname + absolute.search;
  }
  const path = endpoint.startsWith("/") ? endpoint : "/" + endpoint;
  return "/api/jobkar" + path;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers: Record<string, string> = { accept: "application/json", ...options.headers };
  if (options.body !== undefined && options.body !== null && !isFormData && typeof options.body !== "string") {
    headers["Content-Type"] = headers["Content-Type"] || "application/json";
  }

  let body: BodyInit | undefined;
  if (options.body !== undefined && options.body !== null) {
    body = isFormData || typeof options.body === "string" || options.body instanceof Blob
      ? options.body as BodyInit
      : JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(proxyEndpoint(endpoint), {
      method: options.method || "GET",
      headers,
      body,
      credentials: "same-origin",
      cache: "no-store"
    });
  } catch (error) {
    throw new ApiError("Unable to reach Jobkar right now. Please check your connection and try again.", 0, error);
  }

  const contentType = response.headers.get("content-type") || "";
  const raw = await response.text().catch(() => "");
  let data: unknown = raw;
  if (contentType.includes("json")) {
    try { data = raw ? JSON.parse(raw) : {}; } catch { data = {}; }
  }

  if (response.status === 401 && typeof window !== "undefined") {
    window.dispatchEvent(new Event(JOBKAR_AUTH_EXPIRED_EVENT));
  }

  if (!response.ok) {
    const detail = data && typeof data === "object" ? data as Record<string, unknown> : {};
    const message = typeof data === "string" && data ? data : String(detail.message || detail.error || "API Error");
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export default request;
