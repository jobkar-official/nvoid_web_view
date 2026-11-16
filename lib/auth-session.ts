import { cookies } from "next/headers";

export type NvoidRoleId = 3 | 4 | 7;
export type NvoidSession = {
  roleId: NvoidRoleId;
  user: {
    id?: string;
    name?: string;
    fullName?: string;
    email?: string;
    slug?: string;
    phone?: string;
    companyId?: string;
    imageUrl?: string | null;
  };
};

export const nvoidSessionCookie = "nvoid_session";
export const nvoidRefreshCookie = "nvoid_refresh";
export const nvoidUserCookie = "nvoid_user";

type JsonObject = Record<string, unknown>;

function objectValue(value: unknown): JsonObject {
  return value && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
}

function firstValue(...values: unknown[]): unknown {
  return values.find(value => value !== undefined && value !== null && value !== "");
}

function decodeToken(token: string): JsonObject {
  try {
    const payload = token.split(".")[1];
    if (!payload) return {};
    return objectValue(JSON.parse(Buffer.from(payload, "base64url").toString("utf8")));
  } catch {
    return {};
  }
}

function extractSession(value: unknown, token = ""): NvoidSession | null {
  const root = objectValue(value);
  const data = objectValue(root.data);
  const result = objectValue(root.result);
  const nested = objectValue(data.data || data.result || result.data || result.result);
  const userSource = firstValue(
    root.user,
    data.user,
    result.user,
    nested.user,
    root.account,
    data.account,
    result.account,
    Object.keys(data).length ? data : undefined,
    Object.keys(result).length ? result : undefined,
    root
  );
  const user = objectValue(userSource);
  const claims = decodeToken(token);
  const roleId = Number(firstValue(
    user.roleId, user.role_id, root.roleId, root.role_id, data.roleId, data.role_id,
    result.roleId, result.role_id, nested.roleId, nested.role_id, claims.roleId, claims.role_id
  ));
  if (roleId !== 3 && roleId !== 4 && roleId !== 7) return null;
  const id = firstValue(user.id, user.userId, user.user_id, claims.userId, claims.user_id, claims.sub);
  const name = firstValue(user.fullName, user.full_name, user.name, claims.name);
  return {
    roleId,
    user: {
      id: id === undefined ? undefined : String(id),
      name: name === undefined ? undefined : String(name),
      fullName: name === undefined ? undefined : String(name),
      email: firstValue(user.email, claims.email) ? String(firstValue(user.email, claims.email)) : undefined,
      slug: firstValue(user.slug, claims.slug) ? String(firstValue(user.slug, claims.slug)) : undefined,
      phone: firstValue(user.phone, user.phoneNumber) ? String(firstValue(user.phone, user.phoneNumber)) : undefined,
      companyId: firstValue(user.companyId, user.company_id) ? String(firstValue(user.companyId, user.company_id)) : undefined,
      imageUrl: firstValue(user.imageUrl, user.image_url) ? String(firstValue(user.imageUrl, user.image_url)) : null
    }
  };
}

export async function getNvoidSession(): Promise<NvoidSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(nvoidSessionCookie)?.value;
  const userCookie = cookieStore.get(nvoidUserCookie)?.value;
  if (!token || !userCookie) return null;
  try {
    return extractSession(JSON.parse(userCookie), token);
  } catch {
    return null;
  }
}

export function parseAuthenticatedResponse(value: unknown): { token: string; refreshToken?: string; session: NvoidSession } | null {
  const root = objectValue(value);
  const data = objectValue(root.data);
  const result = objectValue(root.result);
  const nested = objectValue(data.data || data.result || result.data || result.result);
  const token = String(firstValue(
    root.accessToken, root.access_token, root.token, root.jwt,
    data.accessToken, data.access_token, data.token, data.jwt,
    result.accessToken, result.access_token, result.token, result.jwt,
    nested.accessToken, nested.access_token, nested.token, nested.jwt
  ) || "");
  const refreshToken = String(firstValue(
    root.refreshToken, root.refresh_token, data.refreshToken, data.refresh_token,
    result.refreshToken, result.refresh_token, nested.refreshToken, nested.refresh_token
  ) || "");
  if (!token) return null;
  const session = extractSession(value, token);
  if (!session) return null;
  return { token, refreshToken: refreshToken || undefined, session };
}
