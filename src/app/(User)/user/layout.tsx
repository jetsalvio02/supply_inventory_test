import React from "react";
import UserNavbar from "./components/User_Navbar";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-lightgray dark:bg-dark">
      <UserNavbar />
      <main className="container mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
