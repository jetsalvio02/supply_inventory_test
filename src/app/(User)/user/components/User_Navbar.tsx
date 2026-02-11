"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import FullLogo from "@/app/(Admin)/admin/layout/shared/logo/FullLogo";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";

const links = [
  { href: "/user", label: "Home" },
  { href: "/Item_List", label: "Items" },
];

export default function UserNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="border-b bg-background">
      <nav className="container mx-auto flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <FullLogo />
          <span className="text-sm font-medium text-muted-foreground">
            User Portal
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* {links.map((link) => {
            const isActive =
              pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Button
                key={link.href}
                asChild
                variant={isActive ? "default" : "ghost"}
                className="text-sm"
              >
                <Link href={link.href}>{link.label}</Link>
              </Button>
            );
          })} */}

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
