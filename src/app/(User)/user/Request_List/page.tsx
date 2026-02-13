"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";

interface RisRow {
  id: number;
  stockNo: string;
  unit: string;
  name: string;
  description: string;
  quantity: number;
  remarks: string;
}

interface RequestRecord {
  id: number;
  createdAt: string;
  purpose: string;
  items: RisRow[];
}

const queryClient = new QueryClient();

function RequestListPageInner() {
  const router = useRouter();

  const { data: requests = [] } = useQuery<RequestRecord[]>({
    queryKey: ["user-requests"],
    queryFn: async () => {
      const res = await fetch("/api/user/requests");
      if (!res.ok) {
        throw new Error("Failed to load requests");
      }
      const data = await res.json();
      if (!data?.success || !Array.isArray(data.requests)) {
        return [];
      }
      return data.requests.map((req: any) => ({
        id: req.id,
        createdAt: req.createdAt,
        purpose: req.purpose ?? "",
        items: (req.items ?? []).map((item: any) => ({
          id: item.id,
          stockNo: item.stockNo ?? "",
          unit: item.unit ?? "",
          name: item.name ?? "",
          description: item.description ?? "",
          quantity: item.quantity ?? 0,
          remarks: item.remarks ?? "",
        })),
      }));
    },
  });

  const handlePrint = (record: RequestRecord) => {
    router.push("/user");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Request List</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View your submitted requisition and issue slip requests.
          </p>
        </div>
        <div className="flex sm:justify-end">
          <Button variant="outline" onClick={() => router.push("/user")}>
            Back to Home
          </Button>
        </div>
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No saved requests found on this device.
        </p>
      ) : (
        <div className="rounded-lg border border-border/60 dark:border-white/5 bg-card/80 dark:bg-white/[0.03] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm text-foreground/90">
              <thead>
                <tr className="bg-muted/70 dark:bg-white/[0.04] text-left border-b border-border/60 dark:border-white/10">
                  <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Ref #
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Date
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Items / Quantity
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">
                    Purpose
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-white/5">
                {requests.map((req) => (
                  <tr
                    key={req.id}
                    className="bg-background/40 dark:bg-transparent hover:bg-muted/40 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <td className="px-3 py-2 align-top whitespace-nowrap text-[11px] md:text-xs">
                      {req.id}
                    </td>
                    <td className="px-3 py-2 align-top whitespace-nowrap text-[11px] md:text-xs">
                      {new Date(req.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <div className="space-y-0.5">
                        {req.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-2 text-[11px] md:text-xs"
                          >
                            <span className="truncate">
                              {`${item.name} (${item.description})`}
                              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-primary/20 text-[10px] ml-1">
                                {item.quantity}
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top text-[11px] md:text-xs hidden md:table-cell">
                      {req.purpose}
                    </td>
                    <td className="px-3 py-2 align-top text-right">
                      <Button
                        size="icon"
                        variant="success"
                        className="h-7 w-7"
                        onClick={() => handlePrint(req)}
                      >
                        <Printer className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RequestListPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <RequestListPageInner />
    </QueryClientProvider>
  );
}
