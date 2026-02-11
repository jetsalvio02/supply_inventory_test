import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Header from "./layout/header/Header";
import Sidebar from "./layout/sidebar/Sidebar";

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const role = cookieStore.get("userRole")?.value;

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
