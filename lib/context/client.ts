// client.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://edge.jobkar.in/';
const CHAT_URL_SOURCE = process.env.NEXT_PUBLIC_SOCKET_URL || 'https://chat.jobkar.in';
export const JOBKAR_CHAT_URL = CHAT_URL_SOURCE
    .replace(/^wss:/, 'https:')
    .replace(/^ws:/, 'http:')
    .replace(/\/+$/, '');
const API_ORIGINS = new Set(
    [BASE_URL.replace(/\/+$/, ''), 'https://edge.jobkar.in', JOBKAR_CHAT_URL.replace(/\/+$/, '')]
        .map(value => {
            try { return new URL(value).origin } catch { return '' }
        })
        .filter(Boolean)
);
export const JOBKAR_ACCESS_TOKEN_KEY = 'JOBKAR_WEB_ACCESS_TOKEN';
const REQUEST_TIMEOUT_MS = 20000;
const JOBKAR_REFRESH_TOKEN_KEY = 'JOBKAR_WEB_REFRESH_TOKEN';
const JOBKAR_USER_KEY = 'JOBKAR_WEB_USER';
export const JOBKAR_AUTH_EXPIRED_EVENT = 'jobkar:auth-expired';

let refreshPromise: Promise<string | null> | null = null;

const isChatEndpoint = (endpoint: string) => {
    try {
        return new URL(endpoint).origin === new URL(JOBKAR_CHAT_URL).origin;
    } catch {
        return false;
    }
};

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

interface RequestOptions {
    method?: HttpMethod;
    body?: any;
    headers?: Record<string, string>;
}

export class ApiError extends Error {
    status: number
    data: any

    constructor(message: string, status: number, data: any = null) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.data = data
    }
}

export const isNotFoundError = (error: unknown): boolean =>
    error instanceof ApiError
        ? error.status === 404
        : /not found|does not exist|no record|no data/i.test(String((error as any)?.message || error || ''))

export async function refreshAccessToken(): Promise<string | null> {
    if (typeof window === 'undefined' || refreshPromise) return refreshPromise

    refreshPromise = (async () => {
        try {
            const refreshToken = localStorage.getItem(JOBKAR_REFRESH_TOKEN_KEY)
            const storedUser = localStorage.getItem(JOBKAR_USER_KEY)
            const email = storedUser ? JSON.parse(storedUser)?.email : null

            if (!refreshToken || !email) return null

            const response = await fetch('/backend/auth/refreshToken', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, refreshToken }),
            })
            const data = await response.json().catch(() => ({}))

            if (!response.ok || !data?.accessToken) return null

            localStorage.setItem(JOBKAR_ACCESS_TOKEN_KEY, data.accessToken)
            if (data.refreshToken) localStorage.setItem(JOBKAR_REFRESH_TOKEN_KEY, data.refreshToken)

            return data.accessToken as string
        } catch {
            return null
        } finally {
            refreshPromise = null
        }
    })()

    return refreshPromise
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const token = typeof window !== "undefined"
        ? localStorage.getItem(JOBKAR_ACCESS_TOKEN_KEY)
        : null;

    const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
    let finalUrl: string
    if (/^https?:\/\//i.test(endpoint)) {
        let absolute: URL
        try {
            absolute = new URL(endpoint)
        } catch {
            throw new ApiError('Invalid API endpoint.', 400)
        }
        if (!API_ORIGINS.has(absolute.origin)) {
            throw new ApiError('Blocked API destination.', 400)
        }
        finalUrl = absolute.toString()
    } else if (endpoint.startsWith('/backend')) {
        finalUrl = endpoint
    } else {
        finalUrl = `${BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`
    }

    let authToken = token;
    let retryAfterRefresh = true;
    let res: Response;

    while (true) {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeout = controller ? setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS) : null;

        try {
            res = await fetch(finalUrl, {
                method: options.method || "GET",
                headers: {
                    ...(authToken && !endpoint.startsWith('/backend/auth/')
                        ? { Authorization: `Bearer ${authToken}` }
                        : {}),
                    ...(isFormData ? {} : { "Content-Type": "application/json" }),
                    ...options.headers,
                },
                body:
                    options.body && !isFormData
                        ? JSON.stringify(options.body)
                        : options.body,
                signal: controller?.signal,
            });
        } catch (error) {
            if ((error as any)?.name === 'AbortError') {
                throw new ApiError('The request timed out. Please try again.', 408);
            }
            throw new ApiError('Unable to reach Jobkar right now. Please check your connection and try again.', 0, error);
        } finally {
            if (timeout) clearTimeout(timeout);
        }

        const shouldRefresh = res.status === 401 &&
            Boolean(authToken) &&
            retryAfterRefresh &&
            !endpoint.startsWith('/backend/auth/') &&
            (
                endpoint.startsWith('/backend/') ||
                endpoint.startsWith('/users/') ||
                endpoint.startsWith('/open_to_work/') ||
                endpoint.startsWith('https://edge.jobkar.in/userRoleHistory/') ||
                isChatEndpoint(endpoint)
            );

        if (!shouldRefresh) break

        const refreshed = await refreshAccessToken()
        retryAfterRefresh = false

        if (!refreshed) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem(JOBKAR_ACCESS_TOKEN_KEY)
                localStorage.removeItem(JOBKAR_REFRESH_TOKEN_KEY)
                localStorage.removeItem(JOBKAR_USER_KEY)
                window.dispatchEvent(new Event(JOBKAR_AUTH_EXPIRED_EVENT))
            }
            break
        }
        authToken = refreshed
    }

    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await res.json().catch(() => ({})) : await res.text().catch(() => '');

    if (!res.ok) {
        const message = typeof data === 'string' ? data : data?.message || data?.error || "API Error";
        throw new ApiError(message, res.status, data);
    }

    return data as T;
}

export default request;