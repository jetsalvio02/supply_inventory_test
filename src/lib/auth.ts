import { cookies } from "next/headers";
import crypto from "crypto";

const authCookieSecret = process.env.AUTH_COOKIE_SECRET || "dev-secret";

export async function readAuthenticatedUserIdFromCookies() {
  const store = await cookies();
  const userIdRaw = store.get("userId")?.value;
  const roleRaw = store.get("userRole")?.value ?? "staff";
  const sig = store.get("userSig")?.value;

  if (!userIdRaw || !sig) {
    return null;
  }

  const baseValue = `${userIdRaw}:${roleRaw}`;
  const expected = crypto
    .createHmac("sha256", authCookieSecret)
    .update(baseValue)
    .digest("hex");

  if (sig !== expected) {
    return null;
  }

  const userId = Number(userIdRaw);
  if (!Number.isFinite(userId)) {
    return null;
  }

  return userId;
}

