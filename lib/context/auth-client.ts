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
  error?: string;
};

export async function signInWithJobkar(email: string, password: string): Promise<SessionResponse> {
  let response: Response;

  try {
    response = await fetch("/api/auth/signin", {
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
    throw new Error("Could not reach the NvoidAI authentication route. Check the Next.js server.");
  }

  const session = await response.json().catch(() => ({})) as SessionResponse;

  if (!response.ok || !session.authenticated) {
    throw new Error(session.error || "NvoidAI sign in was rejected.");
  }

  return session;
}
