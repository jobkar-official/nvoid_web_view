type AuthApiResponse = {
  accessToken?: string;
  refreshToken?: string;
  id?: string | number;
  roleId?: number;
  name?: string;
  email?: string;
  phone?: string;
  slug?: string;
  companyId?: string | number;
  imageUrl?: string | null;
  detail?: string;
  message?: string;
  error?: string;
  [key: string]: unknown;
};

type SessionResponse = {
  authenticated?: boolean;
  roleId?: number;
  user?: {
    id?: string;
    name?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    slug?: string;
    companyId?: string;
    imageUrl?: string | null;
  };
};

const JOBKAR_LOGIN_URL = "/authController/login";

function getErrorMessage(data: AuthApiResponse, fallback: string) {
  return data.detail || data.message || data.error || fallback;
}

export async function signInWithJobkar(email: string, password: string): Promise<SessionResponse> {
  let response: Response;

  try {
    response = await fetch(JOBKAR_LOGIN_URL, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        accept: "application/json",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        email: email.trim(),
        password
      }),
      cache: "no-store"
    });
  } catch {
    throw new Error("Could not reach the local authentication route. Check the Next.js server and authController rewrite.");
  }

  const payload = await response.json().catch(() => ({})) as AuthApiResponse;

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, "Sign in was rejected by Jobkar authentication."));
  }

  if (!payload.accessToken || !payload.refreshToken || !payload.roleId) {
    throw new Error("Jobkar authentication returned an incomplete session.");
  }

  const sessionResponse = await fetch("/api/auth/session", {
    method: "POST",
    credentials: "same-origin",
    headers: {
      accept: "application/json",
      "content-type": "application/json"
    },
    body: JSON.stringify(payload),
    cache: "no-store"
  });

  const session = await sessionResponse.json().catch(() => ({})) as SessionResponse & { error?: string };

  if (!sessionResponse.ok || !session.authenticated) {
    throw new Error(session.error || "Login succeeded, but the secure workspace session could not be created.");
  }

  return session;
}
