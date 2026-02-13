"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import FullLogo from "@/app/(Admin)/admin/layout/shared/logo/FullLogo";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import { Home, User, ListChecks } from "lucide-react";

const links = [
  { href: "/user", label: "Home", icon: Home },
  { href: "/user/Profile", label: "Profile", icon: User },
  { href: "/user/Request_List", label: "Requests List", icon: ListChecks },
];

export default function UserNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const toggleMode = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <header className="border-b bg-background">
      <nav className="container mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:flex-nowrap sm:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          <FullLogo />
          <span className="text-sm font-medium text-muted-foreground">
            User Portal
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-end">
          {links.map((link) => {
            const IconComponent = link.icon;
            const isActive =
              pathname === link.href ||
              (link.href !== "/user" && pathname.startsWith(`${link.href}/`));

            return (
              <Button
                key={link.href}
                asChild
                variant={isActive ? "default" : "ghost"}
                className="text-sm"
              >
                <Link href={link.href} className="flex items-center gap-1.5">
                  <IconComponent className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              </Button>
            );
          })}

          <div
            className="hover:text-primary px-2 group focus:ring-0 rounded-full flex justify-center items-center cursor-pointer text-gray relative"
            onClick={toggleMode}
          >
            <span className="flex items-center justify-center relative after:absolute after:w-10 after:h-10 after:rounded-full after:-top-1/2 group-hover:after:bg-lightprimary">
              {theme === "light" ? (
                <Icon icon="tabler:moon" width="20" />
              ) : (
                <Icon
                  icon="solar:sun-bold-duotone"
                  width="20"
                  className="group-hover:text-primary"
                />
              )}
            </span>
          </div>

          <Button
            variant="outlineerror"
            size="sm"
            onClick={async () => {
              Swal.fire({
                title: "Are you sure?",
                text: "You will be logged out!",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#3085d6",
                cancelButtonColor: "#d33",
                confirmButtonText: "Yes, logout!",
              }).then(async (result) => {
                if (result.isConfirmed) {
                  try {
                    await fetch("/api/auth/logout", {
                      method: "POST",
                    });
                  } finally {
                    router.push("/auth/login");
                  }
                }
              });
            }}
          >
            Logout
          </Button>
        </div>
      </nav>
    </header>
  );
}
