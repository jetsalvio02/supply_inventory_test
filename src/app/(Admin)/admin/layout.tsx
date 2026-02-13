import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Header from "./layout/header/Header";
import Sidebar from "./layout/sidebar/Sidebar";
import crypto from "crypto";

const authCookieSecret = process.env.AUTH_COOKIE_SECRET || "dev-secret";

async function readAuthenticatedRole() {
  const store = await cookies();
  const userIdRaw = store.get("userId")?.value;
  const roleRaw = store.get("userRole")?.value ?? "";
  const sig = store.get("userSig")?.value;

  if (!userIdRaw || !roleRaw || !sig) {
    return null;
  }

  const baseValue = `${userIdRaw}:${roleRaw}`;
  const expected = crypto
    .createHmac("sha256", authCookieSecret)
    .update(baseValue)
    .digest("hex");

  if (sig !== expected || !Number.isFinite(Number(userIdRaw))) {
    return null;
  }

  return roleRaw;
}

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const role = await readAuthenticatedRole();

  if (role !== "admin") {
    redirect("/user");
  }

  return (
    <>
      <div className="flex w-full min-h-screen">
        <div className="page-wrapper flex w-full">
          <div className="xl:block hidden">
            <Sidebar />
          </div>

          <div className="body-wrapper w-full">
            <Header />
            <div className="bg-lightgray dark:bg-dark mr-3 rounded-3xl min-h-[90vh]">
              <div className={`container mx-auto px-6 py-3`}>{children}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
