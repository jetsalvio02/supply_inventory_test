"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  userName: string | null;
  items: RisRow[];
}

export default function AdminRequestListPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestRecord[]>([]);
  const loadRequests = () => {
    fetch("/api/admin/requests")
      .then((r) => r.json())
      .then((data: any) => {
        if (!data?.success || !Array.isArray(data.requests)) return;
        setRequests(
          data.requests.map((req: any) => ({
            id: req.id,
            createdAt: req.createdAt,
            purpose: req.purpose ?? "",
            userName: req.userName ?? null,
            items: (req.items ?? []).map((item: any) => ({
              id: item.id,
              stockNo: item.stockNo ?? "",
              unit: item.unit ?? "",
              name: item.name ?? "",
              description: item.description ?? "",
              quantity: item.quantity ?? 0,
              remarks: item.remarks ?? "",
            })),
          }))
        );
      })
      .catch(() => {});
  };

  useEffect(() => {
    loadRequests();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const source = new EventSource("/api/events");

    source.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data?.type === "requests-updated") {
          loadRequests();
        }
      } catch {}
    };

    source.onerror = () => {
      source.close();
    };

    return () => {
      source.close();
    };
  }, []);

  const handleRelease = async (record: RequestRecord) => {
    const confirmRelease =
      typeof window !== "undefined"
        ? window.confirm(
            "Release items for this request and deduct them from inventory?"
          )
        : true;

    if (!confirmRelease) return;

    try {
      const res = await fetch(`/api/admin/requests/${record.id}/release`, {
        method: "POST",
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || !data?.success) {
        const message =
          (data && typeof data.message === "string" && data.message) ||
          "Failed to release items for this request.";

        if (typeof window !== "undefined") {
          window.alert(message);
        }

        return;
      }

      setRequests((prev) => prev.filter((r) => r.id !== record.id));

      router.push("/admin/Item_List");
    } catch {
      if (typeof window !== "undefined") {
        window.alert("Network error while releasing items. Please try again.");
      }
    }
  };

  const handlePrint = (record: RequestRecord) => {
    if (typeof window === "undefined") return;

    const printWindow = window.open("", "_blank", "width=900,height=650");
    if (!printWindow) return;

    const createdAt = new Date(record.createdAt).toLocaleString();

    const rowsHtml = record.items
      .map(
        (item) => `
        <tr>
          <td class="cell center">${item.stockNo}</td>
          <td class="cell center">${item.unit}</td>
          <td class="cell">${item.name} (${item.description})</td>
          <td class="cell center">${item.quantity}</td>
          <td class="cell center"></td>
          <td class="cell center"></td>
          <td class="cell center"></td>
          <td class="cell">${item.remarks}</td>
        </tr>`
      )
      .join("");

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>RIS #${record.id}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              font-size: 11px;
              padding: 32px;
              color: #111827;
            }
            .page {
              max-width: 900px;
              margin: 0 auto;
            }
            .top-line {
              display: flex;
              justify-content: flex-end;
              font-size: 10px;
              margin-bottom: 8px;
            }
            .title {
              text-align: center;
              font-weight: 600;
              margin-bottom: 12px;
            }
            .entity-row {
              display: grid;
              grid-template-columns: 3fr 2fr;
              font-size: 11px;
              margin-bottom: 4px;
            }
            .entity-cell {
              border: 1px solid #000;
              padding: 4px 6px;
            }
            .entity-label {
              margin-right: 4px;
            }
            .ris-header-grid {
              display: grid;
              grid-template-columns: 3fr 2fr;
              font-size: 11px;
            }
            .ris-header-left,
            .ris-header-right {
              border: 1px solid #000;
              border-top: none;
              padding: 4px 6px;
            }
            .ris-header-left-row,
            .ris-header-right-row {
              display: flex;
              justify-content: space-between;
              gap: 8px;
            }
            .ris-header-label {
              white-space: nowrap;
            }
            .ris-header-value {
              flex: 1;
              border-bottom: 1px solid #000;
            }
            .ris-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 0;
            }
            th {
              border: 1px solid #000;
              padding: 6px 4px;
              text-align: center;
              font-size: 10px;
              text-transform: uppercase;
            }
            .cell {
              border: 1px solid #000;
              padding: 4px 6px;
              font-size: 11px;
              vertical-align: top;
            }
            .center {
              text-align: center;
            }
            .purpose-row {
              margin-top: 8px;
            }
            .purpose-label {
              border: 1px solid #000;
              border-top: none;
              padding: 6px 8px;
              width: 120px;
              font-size: 11px;
            }
            .purpose-value {
              border: 1px solid #000;
              border-top: none;
              border-left: none;
              padding: 6px 8px;
              font-size: 11px;
              min-height: 40px;
            }
            .sign-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 8px;
              font-size: 10px;
            }
            .sign-label-col {
              width: 90px;
            }
            .sign-cell {
              border: 1px solid #000;
              padding: 4px 6px;
              height: 24px;
            }
            @media print {
              body { padding: 0; }
              .page { margin: 16px auto; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="top-line">Appendix 63</div>

            <div class="title">REQUISITION AND ISSUE SLIP</div>

            <div class="entity-row">
              <div class="entity-cell">
                <span class="entity-label">Entity Name :</span>
                <strong>DEPED - KABANKALAN /</strong>
              </div>
              <div class="entity-cell">
                <span class="entity-label">Fund Cluster :</span>
              </div>
            </div>

            <div class="ris-header-grid">
              <div class="ris-header-left">
                <div class="ris-header-left-row">
                  <span class="ris-header-label">Division :</span>
                  <span class="ris-header-value">KABANKALAN CITY</span>
                </div>
                <div class="ris-header-left-row">
                  <span class="ris-header-label">Office :</span>
                  <span class="ris-header-value"></span>
                </div>
              </div>
              <div class="ris-header-right">
                <div class="ris-header-right-row">
                  <span class="ris-header-label">Responsibility Center Code :</span>
                  <span class="ris-header-value"></span>
                </div>
                <div class="ris-header-right-row">
                  <span class="ris-header-label">RIS No. :</span>
                  <span class="ris-header-value">${record.id}</span>
                </div>
              </div>
            </div>

            <table class="ris-table">
              <thead>
                <tr>
                  <th rowspan="2">Stock No.</th>
                  <th rowspan="2">Unit</th>
                  <th rowspan="2">Description</th>
                  <th rowspan="2">Quantity</th>
                  <th colspan="2">Stock Available?</th>
                  <th colspan="2">Issue</th>
                </tr>
                <tr>
                  <th>Yes</th>
                  <th>No</th>
                  <th>Quantity</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>

            <div class="purpose-row">
              <table style="width:100%; border-collapse:collapse;">
                <tr>
                  <td class="purpose-label">Purpose:</td>
                  <td class="purpose-value">${record.purpose || ""}</td>
                </tr>
              </table>
            </div>

            <table class="sign-table">
              <tr>
                <td class="sign-cell sign-label-col"></td>
                <td class="sign-cell center">Requested by:</td>
                <td class="sign-cell center">Approved by:</td>
                <td class="sign-cell center">Issued by:</td>
                <td class="sign-cell center">Received by:</td>
              </tr>
              <tr>
                <td class="sign-cell sign-label-col">Signature :</td>
                <td class="sign-cell"></td>
                <td class="sign-cell"></td>
                <td class="sign-cell"></td>
                <td class="sign-cell"></td>
              </tr>
              <tr>
                <td class="sign-cell sign-label-col">Printed Name :</td>
                <td class="sign-cell"></td>
                <td class="sign-cell"></td>
                <td class="sign-cell"></td>
                <td class="sign-cell"></td>
              </tr>
              <tr>
                <td class="sign-cell sign-label-col">Designation :</td>
                <td class="sign-cell"></td>
                <td class="sign-cell"></td>
                <td class="sign-cell"></td>
                <td class="sign-cell"></td>
              </tr>
              <tr>
                <td class="sign-cell sign-label-col">Date :</td>
                <td class="sign-cell"></td>
                <td class="sign-cell"></td>
                <td class="sign-cell"></td>
                <td class="sign-cell"></td>
              </tr>
            </table>
          </div>
          <script>
            window.onload = function () {
              window.focus();
              window.print();
            };
            window.onafterprint = function () {
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">All RIS Requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View requisition and issue slip requests submitted by all users.
          </p>
        </div>
      </div>

      {requests.length === 0 ? (
        <Card className="rounded-2xl border border-border/60 dark:border-white/5 bg-card/80 dark:bg-white/[0.03] shadow-sm">
          <CardContent className="p-6 text-sm text-muted-foreground">
            No RIS requests found.
          </CardContent>
        </Card>
      ) : (
        <Card className="rounded-2xl border border-border/60 dark:border-white/5 bg-card/80 dark:bg-white/[0.03] shadow-sm">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs md:text-sm text-foreground/90">
              <thead className="bg-muted/80 dark:bg-white/[0.04] text-left border-b border-border/60 dark:border-white/10">
                <tr>
                  <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Ref #
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    Date
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                    User
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
                {requests.map((req, index) => (
                  <tr
                    key={req.id}
                    className={
                      index % 2 === 0
                        ? "bg-background/40 dark:bg-transparent"
                        : "bg-muted/30 dark:bg-white/[0.03]"
                    }
                  >
                    <td className="px-3 py-2 align-top whitespace-nowrap text-[11px] md:text-xs">
                      {req.id}
                    </td>
                    <td className="px-3 py-2 align-top whitespace-nowrap text-[11px] md:text-xs">
                      {new Date(req.createdAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 align-top whitespace-nowrap text-[11px] md:text-xs">
                      {req.userName ?? "-"}
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
                            </span>
                            <Badge
                              variant="secondary"
                              className="ml-2 inline-flex items-center px-2 py-0.5 text-[10px]"
                            >
                              {item.quantity}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2 align-top hidden md:table-cell text-[11px] md:text-xs max-w-xs">
                      <span className="line-clamp-3 break-words">
                        {req.purpose || "-"}
                      </span>
                    </td>
                    <td className="px-3 py-2 align-top text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          className="h-7 px-3 text-[11px]"
                          variant="success"
                          onClick={() => handleRelease(req)}
                        >
                          Release
                        </Button>
                        {/* <Button
                          size="icon"
                          variant="outline"
                          className="h-7 w-7"
                          onClick={() => handlePrint(req)}
                        >
                          <Printer className="h-3 w-3" />
                        </Button> */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
