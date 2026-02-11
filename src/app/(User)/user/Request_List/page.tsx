"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

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

export default function RequestListPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestRecord[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("user_requests");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored) as RequestRecord[];
      setRequests(parsed);
    } catch {
      setRequests([]);
    }
  }, []);

  const handlePrint = (record: RequestRecord) => {
    router.push("/user");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Request List</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View your submitted requisition and issue slip requests.
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/user")}>
          Back to Home
        </Button>
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No saved requests found on this device.
        </p>
      ) : (
        <div className="rounded-lg border bg-card shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-xs md:text-sm">
              <thead>
                <tr className="bg-muted/70 text-left">
                  <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                    Ref #
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                    Date
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                    Items / Quantity
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground hidden md:table-cell">
                    Purpose
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
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
                              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] ml-1">
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
