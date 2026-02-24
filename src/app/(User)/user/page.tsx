"use client";

import { useEffect, useMemo, useState } from "react";
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
import { motion } from "framer-motion";

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
  user: {
    name: string;
    officeHead: string | null;
    department: string | null;
    officeHeadDepartment: string | null;
  };
}

interface UserProfileData {
  name: string;
  officeHead: string | null;
  department: string | null;
  officeHeadDepartment: string | null;
}

const queryClient = new QueryClient();

function UserHomePageInner() {
  const [open, setOpen] = useState(false);
  const [comboOpen, setComboOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemOption | null>(null);
  const [rows, setRows] = useState<RisRow[]>([]);
  const [purpose, setPurpose] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) {
        throw new Error("Failed to load settings.");
      }
      const data = await res.json();
      if (!data?.success || !data.settings) {
        throw new Error("Failed to load settings.");
      }
      return data.settings;
    },
  });

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
          name: data.user.name ?? "N/A",
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
            : i.balance ?? null,
      }));
    },
  });

  const selectableItems = useMemo(
    () =>
      items.filter(
        (i) =>
          typeof i.actualBalance === "number" &&
          !Number.isNaN(i.actualBalance) &&
          i.actualBalance > 0
      ),
    [items]
  );

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
        user: req.user ?? {
          name: "N/A",
          officeHead: null,
          department: null,
          officeHeadDepartment: null,
        },
        items: (req.items ?? []).map((item: any) => ({
          id: item.id,
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
    [requests, startIndex, endIndex]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    // const source = new EventSource("/api/events");

    // source.onmessage = (event) => {
    //   try {
    //     const data = JSON.parse(event.data);
    //     if (data?.type === "requests-updated") {
    //       queryClient.invalidateQueries({ queryKey: ["user-requests"] });
    //     }
    //   } catch {}
    // };

    // source.onerror = () => {
    //   source.close();
    // };

    // return () => {
    //   source.close();
    // };
  }, []);

  const addRowFromItem = (item: ItemOption) => {
    setRows((prev) => {
      if (
        prev.some(
          (r) =>
            r.stockNo === (item.stockNo ?? "") && r.description === item.name
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
      prev.map((r) => (r.id === rowId ? { ...r, [key]: value } : r))
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
      })
    );
    setOpen(true);
  };

  // const handleSubmit = async () => {
  //   if (rows.length === 0) {
  //     Swal.fire({
  //       icon: "warning",
  //       title: "Missing Items",
  //       text: "Please add at least one item.",
  //       timer: 2000,
  //       timerProgressBar: true,
  //       showConfirmButton: false,
  //       // allowOutsideClick: false,
  //       allowEscapeKey: false,
  //     });
  //     return;
  //   }

  //   if (!purpose || purpose.trim().length === 0) {
  //     Swal.fire({
  //       icon: "warning",
  //       title: "Purpose Required",
  //       text: "Please enter a purpose for the request.",
  //       timer: 2000,
  //       timerProgressBar: true,
  //       showConfirmButton: false,
  //       // allowOutsideClick: false,
  //       allowEscapeKey: false,
  //     });
  //     return;
  //   }

  //   if (!rows.every((r) => r.quantity > 0)) {
  //     Swal.fire({
  //       icon: "warning",
  //       title: "Quantity Required",
  //       text: "Please enter the quantity for all items.",
  //       timer: 2000,
  //       timerProgressBar: true,
  //       showConfirmButton: false,
  //       // allowOutsideClick: false,
  //       allowEscapeKey: false,
  //     });
  //     return;
  //   }

  //   const overRequested = rows.find(
  //     (r) => r.available !== null && r.quantity > (r.available ?? 0)
  //   );

  //   if (overRequested) {
  //     Swal.fire({
  //       icon: "warning",
  //       title: "Quantity exceeds stock",
  //       text: `Requested quantity for "${overRequested.name}" exceeds available stock (${overRequested.available}).`,
  //       timer: 2500,
  //       timerProgressBar: true,
  //       showConfirmButton: false,
  //       allowEscapeKey: false,
  //     });
  //     return;
  //   }
  //   try {
  //     setIsSubmitting(true);

  //     const res = await fetch("/api/user/requests", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         purpose,
  //         items: rows.map((row) => ({
  //           itemId: row.itemId,
  //           stockNo: row.stockNo,
  //           unit: row.unit,
  //           name: row.name,
  //           description: row.description,
  //           quantity: row.quantity,
  //           remarks: row.remarks,
  //         })),
  //       }),
  //     });

  //     const data = await res.json().catch(() => null);

  //     if (!res.ok || !data?.success) {
  //       Swal.fire({
  //         icon: "error",
  //         title: "Error",
  //         text: (data && data.message) || "Failed to save request.",
  //       });
  //       return;
  //     }

  //     const saved: RequestRecord = {
  //       id: data.request.id,
  //       createdAt:
  //         typeof data.request.createdAt === "string"
  //           ? data.request.createdAt
  //           : new Date(data.request.createdAt).toISOString(),
  //       purpose: data.request.purpose ?? "",
  //       items: (data.request.items ?? []).map((item: any) => ({
  //         id: item.id,
  //         stockNo: item.stockNo ?? "",
  //         unit: item.unit ?? "",
  //         name: item.name ?? "",
  //         description: item.description ?? "",
  //         quantity: item.quantity ?? 0,
  //         remarks: item.remarks ?? "",
  //       })),
  //     };

  //     queryClient.setQueryData<RequestRecord[] | undefined>(
  //       ["user-requests"],
  //       (prev) => {
  //         const existing = prev ?? [];
  //         return [saved, ...existing];
  //       }
  //     );
  //     setRows([]);
  //     setPurpose("");
  //     setSelectedItem(null);
  //     setOpen(false);
  //   } catch {
  //     Swal.fire({
  //       icon: "error",
  //       title: "Error",
  //       text: "Network error while saving request.",
  //     });
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

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
            })
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
                : r
            )
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
              user: request.user ?? {
                name: profile?.name ?? "N/A",
                officeHead: profile?.officeHead ?? null,
                department: profile?.department ?? null,
                officeHeadDepartment: profile?.officeHeadDepartment ?? null,
              },
            },
            ...prev,
          ]
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
        // allowOutsideClick: false,
        // allowEscapeKey: false,
      });

      if (!result.isConfirmed) return;

      setDeletingId(recordId);

      queryClient.setQueryData<RequestRecord[] | undefined>(
        ["user-requests"],
        (prev) => (prev ?? []).filter((r) => r.id !== recordId)
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
        timerProgressBar: true,
        showConfirmButton: false,
        allowEscapeKey: false,
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
      `width=${screen.availWidth},height=${screen.availHeight},top=0,left=0`
    );
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
                <strong>${settings?.entityName}</strong>
              </div>
              <div class="entity-cell">
                <span class="entity-label">Fund Cluster :</span>
                <strong>${settings?.fundCluster}</strong>
              </div>
            </div>

            <div class="ris-header-grid">
              <div class="ris-header-left">
                <div class="ris-header-left-row">
                  <span class="ris-header-label">Division :</span>
                  <span class="ris-header-value">${settings?.division}</span>
                </div>
                <div class="ris-header-left-row">
                  <span class="ris-header-label">Office :</span>
                  <span class="ris-header-value">${settings?.office}</span>
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
                <td class="sign-cell">${record.user.name}</td>
                <td class="sign-cell">${record.user.officeHead}</td>
                <td class="sign-cell"></td>
                <td class="sign-cell">${record.user.name}</td>
              </tr>
              <tr>
                <td class="sign-cell sign-label-col">Designation :</td>
                <td class="sign-cell">${record.user.department}</td>
                <td class="sign-cell">${record.user.officeHeadDepartment}</td>
                <td class="sign-cell"></td>
                <td class="sign-cell">${record.user.department}</td>
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
    <div className="space-y-8">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Welcome to the User Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View available items and track inventory information shared with
            you.
          </p>
        </div>
        <div className="flex sm:justify-end">
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
                  // showCancelButton: true,
                  confirmButtonText: "Go to Profile",
                  cancelButtonText: "Continue",
                }).then((result) => {
                  if (result.isConfirmed) {
                    if (typeof window !== "undefined") {
                      window.location.href = "/user/Profile";
                    }
                    return;
                  }
                  // setOpen(true);
                });
                return;
              }
              setOpen(true);
            }}
          >
            Request <GitPullRequest />
          </Button>
        </div>
      </section>
      <section className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold">Request list</h2>
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
          <p className="text-sm text-muted-foreground">
            No requests yet. Submit a requisition to see it here.
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
                              <span className="">
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
                              <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
                            {deletingId === req.id ? (
                              <span className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Printer className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {requests.length > 0 && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-2 px-4 py-3 border-t text-xs md:text-sm">
                <div>
                  Showing{" "}
                  {`${Math.min(startIndex + 1, requests.length)}-${Math.min(
                    endIndex,
                    requests.length
                  )}`}{" "}
                  of {requests.length} requests
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage <= 1}
                    onClick={() =>
                      setCurrentPage((page) => Math.max(1, page - 1))
                    }
                  >
                    Previous
                  </Button>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
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
            <DialogTitle className="text-center">
              {editingId ? "EDIT" : "CREATE"} REQUISITION AND ISSUE SLIP
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            <p className="font-semibold text-sm">Items:</p>
            <div className="flex items-center gap-2">
              {/* <span className="font-semibold text-xs">Item:</span> */}
              <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-80 justify-between"
                  >
                    {selectedItem
                      ? `${
                          selectedItem.stockNo
                            ? selectedItem.stockNo + " - "
                            : ""
                        }${
                          selectedItem.name +
                          (selectedItem.description
                            ? ` (${selectedItem.description})`
                            : "")
                        }`
                      : "Search item..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Command>
                    <CommandInput placeholder="Search item..." />
                    <CommandEmpty>No item found.</CommandEmpty>
                    <CommandList>
                      {isItemsLoading && (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-4 w-4 animate-spin text-primary mr-2" />
                          <span className="text-xs text-muted-foreground">
                            Loading items...
                          </span>
                        </div>
                      )}
                      <CommandGroup>
                        {selectableItems.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={`${item.stockNo ?? ""} (${item.name} ${
                              item.description ? `(${item.description})` : ""
                            })`}
                            onSelect={() => {
                              setSelectedItem(item);
                              setComboOpen(false);
                            }}
                          >
                            <span className="flex-1">
                              {item.stockNo ? `${item.stockNo} - ` : ""}
                              {item.name}{" "}
                              {item.description ? `(${item.description})` : ""}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {item.unit}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button size="sm" onClick={handleAddSelected}>
                Add <Plus className=" h-4 w-4 shrink-0" />
              </Button>
            </div>
            <div>
              <p className="font-semibold text-sm">Purpose:</p>
              <Textarea
                className="w-full h-12 rounded-md border border-border px-2 py-1"
                placeholder=""
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>
            <div className="text-right">
              <Button
                variant="success"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FileCheck className="mr-2 h-4 w-4 shrink-0" />
                )}
                Submit
              </Button>
            </div>
          </div>

          <table className="w-full text-xs border border-border">
            <thead>
              <tr className="bg-muted text-center">
                <th className="border border-border px-2 py-1 w-24">
                  Stock No.
                </th>
                <th className="border border-border px-2 py-1 w-24">Unit</th>
                <th className="border border-border px-2 py-1">Description</th>
                <th className="border border-border px-2 py-1 w-24">
                  Quantity
                </th>
                <th className="border border-border px-2 py-1 w-24">Remarks</th>
                <th className="border border-border px-2 py-1 w-16">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                // <motion.tr
                //   key={row.id}
                //   initial={{ opacity: 0, y: 6
                //   animate={{ opacity: 1, y: 0 }}
                //   className="bg-background/40 dark:bg-transparent hover:bg-muted/40 dark:hover:bg-white/[0.06] transition-colors"
                // >
                <tr key={row.id}>
                  <td className="border border-border px-1 py-1">
                    <Input
                      className="h-7 rounded-none"
                      value={row.stockNo}
                      onChange={(e) =>
                        updateRow(row.id, "stockNo", e.target.value)
                      }
                      disabled
                    />
                  </td>
                  <td className="border border-border px-1 py-1">
                    {/* <Input
                      className="h-7 rounded-none"
                      value={row.unit}
                      onChange={(e) =>
                        updateRow(row.id, "unit", e.target.value)
                      }
                    /> */}
                    {row.unit}
                  </td>
                  <td className="border border-border px-1 py-1">
                    {`${row.name} (${row.description})`}
                    {/* <Input
                      className="h-7 rounded-none"
                      disabled
                      value={`${row.name} (${row.description})`}
                      onChange={(e) =>
                        updateRow(row.id, "description", e.target.value)
                      }
                    /> */}
                  </td>
                  <td className="border border-border px-1 py-1">
                    <Input
                      type="number"
                      className="h-7 rounded-none"
                      value={row.quantity === 0 ? "" : row.quantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        let num =
                          val === ""
                            ? 0
                            : Number.isNaN(Number(val))
                            ? 0
                            : Number(val);
                        if (
                          row.available !== null &&
                          !Number.isNaN(row.available) &&
                          num > row.available
                        ) {
                          num = row.available;
                          Swal.fire({
                            icon: "warning",
                            title: "Quantity exceeds stock",
                            text: `Available stock for "${row.name}" is ${row.available}.`,
                            timer: 2000,
                            timerProgressBar: true,
                            showConfirmButton: false,
                            allowEscapeKey: false,
                          });
                        }
                        updateRow(row.id, "quantity", num);
                      }}
                    />
                  </td>
                  <td className="border border-border px-1 py-1">
                    <Input
                      className="h-7 rounded-none"
                      value={row.remarks}
                      onChange={(e) =>
                        updateRow(row.id, "remarks", e.target.value)
                      }
                    />
                  </td>
                  <td className="border border-border px-1 py-1 text-center">
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-7 w-7 text-xs text-black"
                      onClick={() => removeRow(row.id)}
                    >
                      <TrashIcon />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function UserHomePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserHomePageInner />
    </QueryClientProvider>
  );
}
