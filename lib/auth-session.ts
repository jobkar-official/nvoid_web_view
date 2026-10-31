import { cookies } from "next/headers";

export type NvoidRoleId = 3 | 4 | 7;
export type NvoidSession = {
  roleId: NvoidRoleId;
  user: { id?: string; name?: string; fullName?: string; email?: string };
};

const SESSION_COOKIE = "nvoid_session";

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {};
}

function extractSession(value: unknown): NvoidSession | null {
  const root = objectValue(value);
  const data = objectValue(root.data);
  const user = objectValue(root.user || data.user || root.account || data.account);
  const roleId = Number(user.roleId ?? user.role_id ?? root.roleId ?? root.role_id ?? data.roleId ?? data.role_id);
  if (roleId !== 3 && roleId !== 4 && roleId !== 7) return null;
  return {
    roleId,
    user: {
      id: String(user.id ?? user.userId ?? user.user_id ?? "") || undefined,
      name: String(user.name ?? "") || undefined,
      fullName: String(user.fullName ?? user.full_name ?? user.name ?? "") || undefined,
      email: String(user.email ?? "") || undefined
    }
  };
}

export async function getNvoidSession(): Promise<NvoidSession | null> {
  const base = process.env.NVOID_AUTH_BASE_URL?.trim();
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!base || !token) return null;

  try {
    const target = new URL(process.env.NVOID_AUTH_SESSION_PATH || "/auth/me", base);
    const response = await fetch(target, {
      method: "GET",
      headers: { accept: "application/json", authorization: "Bearer " + token },
      cache: "no-store",
      signal: AbortSignal.timeout(8000)
    });
    if (!response.ok) return null;
    return extractSession(await response.json());
  } catch {
    return null;
  }
}

export function parseAuthenticatedResponse(value: unknown): { token: string; session: NvoidSession } | null {
  const root = objectValue(value);
  const data = objectValue(root.data);
  const token = String(root.accessToken ?? root.access_token ?? root.token ?? root.jwt ?? data.accessToken ?? data.access_token ?? data.token ?? data.jwt ?? "");
  const session = extractSession(value);
  if (!token || !session) return null;
  return { token, session };
}

export const nvoidSessionCookie = SESSION_COOKIE;
