"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ChevronsUpDown,
  FileCheck,
  GitPullRequest,
  Plus,
  Printer,
  Trash,
  TrashIcon,
  Edit,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

interface ItemOption {
  id: number;
  name: string;
  description: string | null;
  stockNo: string | null;
  unit: string | null;
  actualBalance: number | null;
}

interface RisRow {
  id: number;
  itemId: number | null;
  stockNo: string;
  unit: string;
  name: string;
  description: string;
  quantity: number;
  remarks: string;
  available: number | null;
}

interface RequestRecord {
  id: number;
  createdAt: string;
  purpose: string;
  released: boolean;
  items: RisRow[];
}

interface UserProfileData {
  officeHead: string | null;
  department: string | null;
  officeHeadDepartment: string | null;
}

const queryClient = new QueryClient();

function RequestListPageInner() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemOption | null>(null);
  const [rows, setRows] = useState<RisRow[]>([]);
  const [purpose, setPurpose] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: profile, isLoading: isProfileLoading } =
    useQuery<UserProfileData>({
      queryKey: ["user-profile"],
      queryFn: async () => {
        const res = await fetch("/api/user/profile");
        if (!res.ok) {
          throw new Error("Failed to load profile.");
        }
        const data = await res.json();
        if (!data?.success || !data.user) {
          throw new Error("Failed to load profile.");
        }
        return {
          department: data.user.department ?? null,
          officeHead: data.user.officeHead ?? null,
          officeHeadDepartment: data.user.officeHeadDepartment ?? null,
        };
      },
    });

  const { data: items = [], isLoading: isItemsLoading } = useQuery<
    ItemOption[]
  >({
    queryKey: ["admin-items"],
    queryFn: async () => {
      const res = await fetch("/api/admin/items");
      if (!res.ok) {
        throw new Error("Failed to load items");
      }
      const data = await res.json();
      return data.map((i: any) => ({
        id: i.id,
        name: i.name,
        description: i.description ?? "",
        stockNo: i.stockNo ?? "",
        unit: i.unit ?? "",
        actualBalance:
          typeof i.actualBalance === "number"
            ? i.actualBalance
            : (i.balance ?? null),
      }));
    },
  });

  const { data: requests = [], isLoading: isRequestsLoading } = useQuery<
    RequestRecord[]
  >({
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
        released: !!req.released,
        items: (req.items ?? []).map((item: any) => ({
          id: item.id,
          itemId: item.itemId ?? null,
          stockNo: item.stockNo ?? "",
          unit: item.unit ?? "",
          name: item.name ?? "",
          description: item.description ?? "",
          quantity: item.quantity ?? 0,
          remarks: item.remarks ?? "",
          available: null,
        })),
      }));
    },
  });

  const totalPages = useMemo(() => {
    if (!requests.length) return 1;
    return Math.ceil(requests.length / pageSize);
  }, [requests.length, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedRequests = useMemo(
    () => requests.slice(startIndex, endIndex),
    [requests, startIndex, endIndex],
  );

  const addRowFromItem = (item: ItemOption) => {
    setRows((prev) => {
      if (
        prev.some(
          (r) =>
            r.stockNo === (item.stockNo ?? "") && r.description === item.name,
        )
      ) {
        return prev;
      }
      return [
        ...prev,
        {
          id: Date.now(),
          itemId: item.id,
          stockNo: item.stockNo ?? "",
          unit: item.unit ?? "",
          name: item.name ?? "",
          description: item.description ?? "",
          quantity: 0,
          available:
            typeof item.actualBalance === "number" &&
            !Number.isNaN(item.actualBalance)
              ? item.actualBalance
              : null,
          remarks: "",
        },
      ];
    });
  };

  const updateRow = (rowId: number, key: keyof RisRow, value: any) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [key]: value } : r)),
    );
  };

  const removeRow = (rowId: number) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleAddSelected = () => {
    if (!selectedItem) return;
    addRowFromItem(selectedItem);
    setSelectedItem(null);
  };

  const handleEdit = (record: RequestRecord) => {
    setEditingId(record.id);
    setPurpose(record.purpose);
    setRows(
      record.items.map((item) => {
        const matchingItem = items.find((i) => i.id === item.itemId);
        return {
          ...item,
          itemId: item.itemId,
          available: matchingItem?.actualBalance ?? null,
        };
      }),
    );
    setOpen(true);
  };

  const handleSubmit = async () => {
    if (!rows.length)
      return Swal.fire({
        icon: "warning",
        title: "Missing Items",
        text: "Please add at least one item.",
        timer: 2000,
        showConfirmButton: false,
      });

    if (!purpose?.trim())
      return Swal.fire({
        icon: "warning",
        title: "Purpose Required",
        text: "Please enter a purpose for the request.",
        timer: 2000,
        showConfirmButton: false,
      });

    for (const r of rows) {
      if (r.quantity <= 0)
        return Swal.fire({
          icon: "warning",
          title: "Quantity Required",
          text: "Please enter the quantity for all items.",
          timer: 2000,
          showConfirmButton: false,
        });

      if (r.available != null && r.quantity > r.available)
        return Swal.fire({
          icon: "warning",
          title: "Quantity exceeds stock",
          text: `Requested quantity for "${r.name}" exceeds available stock (${r.available}).`,
          timer: 2500,
          showConfirmButton: false,
        });
    }

    setIsSubmitting(true);

    try {
      const url = editingId
        ? `/api/user/requests/${editingId}`
        : "/api/user/requests";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          purpose,
          items: rows.map(
            ({
              itemId,
              stockNo,
              unit,
              name,
              description,
              quantity,
              remarks,
            }) => ({
              itemId,
              stockNo,
              unit,
              name,
              description,
              quantity,
              remarks,
            }),
          ),
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      const { success, request, message } = await res.json();
      if (!success) throw new Error(message);

      if (editingId) {
        queryClient.setQueryData<RequestRecord[]>(
          ["user-requests"],
          (prev = []) =>
            prev.map((r) =>
              r.id === editingId
                ? {
                    ...r,
                    purpose: request.purpose,
                    items: request.items,
                  }
                : r,
            ),
        );
      } else {
        queryClient.setQueryData<RequestRecord[]>(
          ["user-requests"],
          (prev = []) => [
            {
              id: request.id,
              createdAt: new Date(request.createdAt).toISOString(),
              purpose: request.purpose ?? "",
              released: false,
              items: request.items ?? [],
            },
            ...prev,
          ],
        );
      }

      setRows([]);
      setPurpose("");
      setSelectedItem(null);
      setEditingId(null);
      setOpen(false);
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Network error while saving request.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (recordId: number) => {
    try {
      const result = await Swal.fire({
        icon: "warning",
        title: "Confirm Delete",
        text: "Are you sure you want to delete this request?",
        showCancelButton: true,
        confirmButtonText: "Delete",
        cancelButtonText: "Cancel",
      });

      if (!result.isConfirmed) return;

      setDeletingId(recordId);

      queryClient.setQueryData<RequestRecord[] | undefined>(
        ["user-requests"],
        (prev) => (prev ?? []).filter((r) => r.id !== recordId),
      );

      const res = await fetch(`/api/user/requests/${recordId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message ?? "Failed to delete request.",
        });
        queryClient.invalidateQueries({ queryKey: ["user-requests"] });
        return;
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Network error while deleting request.",
        timer: 2000,
        showConfirmButton: false,
      });
      queryClient.invalidateQueries({ queryKey: ["user-requests"] });
    } finally {
      setDeletingId(null);
    }
  };

  const handlePrint = (record: RequestRecord) => {
    if (typeof window === "undefined") return;

    const printWindow = window.open(
      "",
      "_blank",
      `width=${screen.availWidth},height=${screen.availHeight},top=0,left=0`,
    );
    if (!printWindow) return;

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
        </tr>`,
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
                <td class="sign-cell">${new Date().toLocaleDateString()}</td>
                <td class="sign-cell">${new Date().toLocaleDateString()}</td>
                <td class="sign-cell"></td>
                <td class="sign-cell">${new Date().toLocaleDateString()}</td>
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
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Request List</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View your submitted requisition and issue slip requests.
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Button variant="outline" onClick={() => router.push("/user")}>
            Back to Home
          </Button>
          <Button
            variant="success"
            onClick={() => {
              if (
                !profile ||
                !profile.officeHead?.trim() ||
                !profile.officeHeadDepartment?.trim() ||
                !profile.department?.trim()
              ) {
                Swal.fire({
                  icon: "warning",
                  title: "Profile incomplete",
                  text: "Please update your Department, Office Head and Office Head Department in your profile before submitting a request.",
                  confirmButtonText: "Go to Profile",
                }).then((result) => {
                  if (result.isConfirmed) {
                    router.push("/user/Profile");
                  }
                });
                return;
              }
              setOpen(true);
            }}
          >
            Request <GitPullRequest className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Your Requests</h2>
          {(requests.length > 0 || isRequestsLoading) && (
            <span className="text-xs text-muted-foreground">
              Total requests: {isRequestsLoading ? "..." : requests.length}
            </span>
          )}
        </div>

        {isRequestsLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3 rounded-lg border border-border/60 bg-card/80 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Loading requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12 border rounded-lg bg-card/50">
            No saved requests found.
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
                  {paginatedRequests.map((req, index) => (
                    <tr
                      key={req.id}
                      className={
                        index % 2 === 0
                          ? "bg-background/40 dark:bg-transparent"
                          : "bg-muted/30 dark:bg-white/[0.03]"
                      }
                    >
                      <td className="px-3 py-2 align-top whitespace-nowrap text-[11px] md:text-xs">
                        <div className="flex items-center gap-2">
                          <span>{req.id}</span>
                          {req.released && (
                            <Badge
                              variant="outlineSuccess"
                              className="text-[9px] uppercase tracking-wide"
                            >
                              Released
                            </Badge>
                          )}
                        </div>
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
                              <span>
                                {`${item.name} (${item.description})`}
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-primary ring-1 ring-primary/20 text-[10px] ml-1">
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
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-7 w-7"
                            disabled={deletingId === req.id || req.released}
                            onClick={() => handleDelete(req.id)}
                          >
                            {deletingId === req.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash className="h-3 w-3" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="default"
                            className="h-7 w-7"
                            disabled={deletingId === req.id || req.released}
                            onClick={() => handleEdit(req)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="success"
                            className="h-7 w-7"
                            disabled={deletingId === req.id || req.released}
                            onClick={() => handlePrint(req)}
                          >
                            <Printer className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {requests.length > 0 && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-2 px-4 py-3 border-t text-xs md:text-sm font-medium">
                <div className="text-muted-foreground">
                  Showing{" "}
                  <span className="text-foreground">
                    {Math.min(startIndex + 1, requests.length)}-
                    {Math.min(endIndex, requests.length)}
                  </span>{" "}
                  of <span className="text-foreground">{requests.length}</span>{" "}
                  requests
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={currentPage <= 1}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                  >
                    Previous
                  </Button>
                  <div className="bg-muted px-3 py-1 rounded text-xs">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    disabled={currentPage >= totalPages}
                    onClick={() =>
                      setCurrentPage((page) => Math.min(totalPages, page + 1))
                    }
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <Dialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            setEditingId(null);
            setPurpose("");
            setRows([]);
            setSelectedItem(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center font-bold tracking-tight">
              {editingId ? "EDIT" : "CREATE"} REQUISITION AND ISSUE SLIP
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            <div>
              <p className="font-semibold text-sm mb-2">Items:</p>
              <div className="flex items-center gap-2">
                <Popover open={comboOpen} onOpenChange={setComboOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full sm:w-80 justify-between text-left font-normal"
                    >
                      <span className="truncate">
                        {selectedItem
                          ? `${selectedItem.stockNo ? selectedItem.stockNo + " - " : ""}${selectedItem.name}${selectedItem.description ? ` (${selectedItem.description})` : ""}`
                          : "Search item..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-80" align="start">
                    <Command>
                      <CommandInput placeholder="Search item..." />
                      <CommandEmpty>No item found.</CommandEmpty>
                      <CommandList>
                        {isItemsLoading && (
                          <div className="flex items-center justify-center py-6 text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            <span>Loading items...</span>
                          </div>
                        )}
                        <CommandGroup>
                          {items.map((item) => (
                            <CommandItem
                              key={item.id}
                              value={`${item.stockNo ?? ""} ${item.name} ${item.description ?? ""}`}
                              onSelect={() => {
                                setSelectedItem(item);
                                setComboOpen(false);
                              }}
                            >
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium text-sm">
                                  {item.stockNo ? `${item.stockNo} - ` : ""}
                                  {item.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground truncate max-w-[240px]">
                                  {item.description || "No description"}
                                </span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <Button
                  size="sm"
                  className="shrink-0 px-4"
                  onClick={handleAddSelected}
                >
                  Add <Plus className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            <div>
              <p className="font-semibold text-sm mb-2">Purpose:</p>
              <Textarea
                className="w-full h-20 rounded-md border border-border px-3 py-2 resize-none focus-visible:ring-primary"
                placeholder="Enter purpose of request..."
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>

            <div className="text-right">
              <Button
                variant="success"
                className="px-8 py-2 h-10 font-bold shadow-md hover:shadow-lg transition-all"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileCheck className="mr-2 h-4 w-4" />
                )}
                {editingId ? "Update Request" : "Submit Request"}
              </Button>
            </div>
          </div>

          <div className="mt-2 rounded-md border overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-muted font-bold text-muted-foreground uppercase tracking-wider">
                <tr>
                  <th className="px-3 py-3 w-24">Stock No.</th>
                  <th className="px-3 py-3 w-20">Unit</th>
                  <th className="px-3 py-3">Description</th>
                  <th className="px-3 py-3 w-24">Quantity</th>
                  <th className="px-3 py-3 w-32">Remarks</th>
                  <th className="px-3 py-3 w-16 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-8 text-center text-muted-foreground italic"
                    >
                      No items added yet. Search and add items above.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.id} className="hover:bg-muted/30">
                      <td className="px-3 py-2 font-mono text-[10px]">
                        {row.stockNo || "-"}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground italic">
                        {row.unit}
                      </td>
                      <td className="px-3 py-2 font-medium">
                        {row.name} ({row.description})
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          className="h-8 rounded p-2 focus-visible:ring-1"
                          value={row.quantity === 0 ? "" : row.quantity}
                          onChange={(e) => {
                            const val = e.target.value;
                            let num =
                              val === ""
                                ? 0
                                : isNaN(Number(val))
                                  ? 0
                                  : Number(val);
                            if (row.available !== null && num > row.available) {
                              num = row.available;
                              Swal.fire({
                                icon: "warning",
                                title: "Limited Stock",
                                text: `Available stock for "${row.name}" is ${row.available}.`,
                                timer: 1500,
                                showConfirmButton: false,
                              });
                            }
                            updateRow(row.id, "quantity", num);
                          }}
                        />
                      </td>
                      <td className="px-3 py-2">
                        <Input
                          className="h-8 rounded p-2 focus-visible:ring-1"
                          value={row.remarks}
                          onChange={(e) =>
                            updateRow(row.id, "remarks", e.target.value)
                          }
                          placeholder="Note..."
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => removeRow(row.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </DialogContent>
      </Dialog>
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
