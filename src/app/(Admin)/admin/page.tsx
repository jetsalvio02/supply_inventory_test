"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Boxes, FileText, ArrowRight } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface DashboardStats {
  items: number;
  users: number;
  requests: number;
}

const AdminDashboardPage = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: itemsData = [] } = useQuery({
    queryKey: ["admin-dashboard-items"],
    queryFn: async () => {
      const res = await fetch("/api/admin/items");
      if (!res.ok) {
        throw new Error("Failed to load items");
      }
      return res.json();
    },
  });

  const { data: usersData = { users: [] } } = useQuery({
    queryKey: ["admin-dashboard-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/user/users_list");
      if (!res.ok) {
        throw new Error("Failed to load users");
      }
      return res.json();
    },
  });

  const { data: requestsData = { requests: [] } } = useQuery({
    queryKey: ["admin-dashboard-requests"],
    queryFn: async () => {
      const res = await fetch("/api/admin/requests");
      if (!res.ok) {
        throw new Error("Failed to load requests");
      }

      return res.json();
    },
  });

  const stats = useMemo<DashboardStats>(() => {
    const itemsArray = Array.isArray(itemsData) ? itemsData : [];
    const usersArray = Array.isArray(usersData.users) ? usersData.users : [];
    const requestsArray = Array.isArray(requestsData.requests)
      ? requestsData.requests
      : [];

    return {
      items: itemsArray.length,
      users: usersArray.length,
      requests: requestsArray.length,
    };
  }, [itemsData, usersData, requestsData]);

  const requestChart = useMemo(() => {
    const requestsArray = Array.isArray(requestsData.requests)
      ? requestsData.requests
      : [];

    const byDate: Record<string, number> = {};

    for (const req of requestsArray) {
      const createdRaw = (req as any).createdAt;
      if (!createdRaw) continue;
      const created =
        createdRaw instanceof Date
          ? createdRaw
          : new Date(createdRaw as string);
      const key = created.toISOString().slice(0, 10);
      byDate[key] = (byDate[key] ?? 0) + 1;
    }

    const labels = Object.keys(byDate).sort();
    const counts = labels.map((d) => byDate[d]);

    return { labels, counts };
  }, [requestsData]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const source = new EventSource("/api/events");

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.type === "requests-updated") {
          queryClient.invalidateQueries({
            queryKey: ["admin-dashboard-items"],
          });
          queryClient.invalidateQueries({
            queryKey: ["admin-dashboard-requests"],
          });
        }
      } catch {}
    };

    source.onerror = () => {
      source.close();
    };

    return () => {
      source.close();
    };
  }, [queryClient]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Card>
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Overview of inventory, users, and request activity.
            </p>
          </div>
        </Card>
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

      <div>
        <Card className="rounded-2xl">
          <CardContent className="p-4">
            <p className="text-xs font-medium text-muted-foreground mb-3">
              RIS Requests per day
            </p>
            {requestChart.labels.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No requests data available.
              </p>
            ) : (
              <Bar
                data={{
                  labels: requestChart.labels,
                  datasets: [
                    {
                      label: "Requests",
                      data: requestChart.counts,
                      backgroundColor: "#0f766e",
                      borderRadius: 6,
                    },
                  ],
                }}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    x: {
                      ticks: {
                        font: {
                          size: 10,
                        },
                      },
                    },
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                      },
                    },
                  },
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
