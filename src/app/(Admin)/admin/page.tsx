"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Boxes, FileText, ArrowRight } from "lucide-react";

interface DashboardStats {
  items: number;
  users: number;
  requests: number;
}

const AdminDashboardPage = () => {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats>({
    items: 0,
    users: 0,
    requests: 0,
  });

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [itemsRes, usersRes, requestsRes] = await Promise.all([
          fetch("/api/admin/items"),
          fetch("/api/admin/user/users_list"),
          fetch("/api/admin/requests"),
        ]);

        const [itemsData, usersData, requestsData] = await Promise.all([
          itemsRes.ok ? itemsRes.json() : [],
          usersRes.ok ? usersRes.json() : { users: [] },
          requestsRes.ok ? requestsRes.json() : { requests: [] },
        ]);

        setStats({
          items: Array.isArray(itemsData) ? itemsData.length : 0,
          users: Array.isArray(usersData.users) ? usersData.users.length : 0,
          requests: Array.isArray(requestsData.requests)
            ? requestsData.requests.length
            : 0,
        });
      } catch {
        setStats({ items: 0, users: 0, requests: 0 });
      }
    };

    loadStats();
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of inventory, users, and request activity.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Total Items
              </p>
              <p className="mt-2 text-2xl font-semibold">{stats.items}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 px-0 text-xs text-primary"
                onClick={() => router.push("/admin/Item_List")}
              >
                View items
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Boxes className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Users</p>
              <p className="mt-2 text-2xl font-semibold">{stats.users}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 px-0 text-xs text-primary"
                onClick={() => router.push("/admin/Users")}
              >
                Manage users
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                RIS Requests
              </p>
              <p className="mt-2 text-2xl font-semibold">{stats.requests}</p>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3 px-0 text-xs text-primary"
                onClick={() => router.push("/admin/Request_List")}
              >
                View requests
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
