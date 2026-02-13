import React from "react";
import UserNavbar from "./components/User_Navbar";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import crypto from "crypto";

const authCookieSecret = process.env.AUTH_COOKIE_SECRET || "dev-secret";

async function isUserAuthenticated() {
  const store = await cookies();
  const userIdRaw = store.get("userId")?.value;
  const roleRaw = store.get("userRole")?.value ?? "staff";
  const sig = store.get("userSig")?.value;

  if (!userIdRaw || !sig) {
    return false;
  }

  const baseValue = `${userIdRaw}:${roleRaw}`;
  const expected = crypto
    .createHmac("sha256", authCookieSecret)
    .update(baseValue)
    .digest("hex");

  return sig === expected && Number.isFinite(Number(userIdRaw));
}

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const authenticated = await isUserAuthenticated();

  if (!authenticated) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-lightgray dark:bg-dark">
      <UserNavbar />
      <main className="container mx-auto px-4 py-4 sm:px-6 sm:py-6">
        {children}
      </main>
    </div>
  );
}
