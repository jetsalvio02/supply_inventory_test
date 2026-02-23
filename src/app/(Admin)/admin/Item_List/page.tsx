"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import {
  Search,
  Plus,
  Eye,
  FileSpreadsheet,
  Edit3Icon,
  TrashIcon,
  File,
} from "lucide-react";
import { motion } from "framer-motion";
import ItemFormModal from "./Item_Form_Modal/page";
import EditItemModal from "./Item_Edit_Modal/page";
import { usePathname, useRouter } from "next/navigation";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

const queryClient = new QueryClient();

/* ================================
   Types aligned with schema
================================ */
interface InventoryRow {
  id: number;
  name: string;
  description: string;
  // category: string;
  beginingStock: number;
  totalOut: number;
  actualBalance: number;
  newDeliveryStock: number;
  releaseStock: number;
  updatedAt: string;
}

function ItemInventoryListInner() {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const queryClient = useQueryClient();

  const { data: rows = [], refetch } = useQuery<InventoryRow[]>({
    queryKey: ["admin-items"],
    queryFn: async () => {
      const res = await fetch("/api/admin/items");
      if (!res.ok) {
        throw new Error("Failed to load items");
      }
      return res.json();
    },
    refetchOnWindowFocus: false,
  });

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This item will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    await fetch(`/api/admin/items/${id}`, {
      method: "DELETE",
    });

    queryClient.setQueryData<InventoryRow[] | undefined>(
      ["admin-items"],
      (prev) => (prev ?? []).filter((row) => row.id !== id)
    );

    Swal.fire({
      title: "Deleted!",
      text: "The item has been deleted.",
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  /* ================================
     Search filter
  ================================ */
  const filteredRows = useMemo(() => {
    return rows.filter((r) =>
      r.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [rows, search]);

  const totalPages = useMemo(() => {
    if (!filteredRows.length) return 1;
    return Math.ceil(filteredRows.length / pageSize);
  }, [filteredRows.length, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedRows = useMemo(
    () => filteredRows.slice(startIndex, endIndex),
    [filteredRows, startIndex, endIndex]
  );

  /* ================================
     CSV export mapping
  ================================ */
  const csvData = filteredRows.map((r) => {
    const balance = r.actualBalance ?? 0;

    return {
      Item: r.name,
      // Category: r.category,
      Beginning: r.beginingStock,
      In: r.newDeliveryStock,
      Out: r.totalOut,
      Balance: balance,
      Status: balance > 0 ? "IN_STOCK" : "OUT_OF_STOCK",
      Updated: r.updatedAt,
    };
  });

  const handleExportExcel = () => {
    if (!filteredRows.length) return;

    const header = [
      "Item",
      "Actual Balance",
      "Forwarded Balance",
      "New Delivery",
      "Beginning Stock",
      "Released",
    ];

    const rowsData = filteredRows.map((row) => [
      `${row.name}${row.description ? ` (${row.description})` : ""}`,
      row.actualBalance ?? 0,
      "", // forwarded balance placeholder
      row.newDeliveryStock ?? 0,
      row.beginingStock ?? 0,
      row.totalOut ?? 0,
    ]);

    const sheetData: (string | number)[][] = [];

    sheetData.push(["Supplies and Materials"]);
    sheetData.push(header);
    sheetData.push(...rowsData);

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Items");
    XLSX.writeFile(workbook, "inventory-items.xlsx");
  };

  return (
    <div className="min-h-screen bg-background px-3 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6 rounded-2xl">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 rounded-2xl">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Inventory Items</h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Real-time stock derived from inventory transactions
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <Button
              className="flex items-center w-full sm:w-auto"
              variant="success"
              onClick={handleExportExcel}
              disabled={!filteredRows.length}
            >
              <FileSpreadsheet size={16} /> Export csv.
            </Button>

            <Button className="flex items-center w-full sm:w-auto">
              <File size={16} /> Print
            </Button>
          </div>
        </div>

        <ItemFormModal
          open={open}
          onClose={() => setOpen(false)}
          onSaved={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-items"] });
          }}
        />

        {editingId !== null && (
          <EditItemModal
            open={editOpen}
            id={editingId}
            onClose={() => {
              setEditOpen(false);
              setEditingId(null);
            }}
            onSaved={() => {
              queryClient.invalidateQueries({ queryKey: ["admin-items"] });
            }}
          />
        )}

        {/* Filters */}
        <Card className="rounded-2xl">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={16}
              />
              <Input
                placeholder="Search item name..."
                className="pl-9 h-8 text-xs sm:text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Export */}
        {/* <div className="flex justify-end">
        <ExportCsvButton data={csvData} filename="inventory-items.csv" />
        </div> */}

        <div className="flex justify-end">
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              setOpen(true);
            }}
          >
            <Plus size={16} /> New Item
          </Button>
          {/* <Button
    
          className="flex items-center gap-2 px-6"
        >
          <FileSpreadsheet size={16} /> Export Items
        </Button> */}
        </div>

        {/* Inventory Table */}
        <Card className="rounded-2xl border border-border/60 dark:border-white/5 bg-card/80 dark:bg-white/[0.03] shadow-sm">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs md:text-sm text-foreground/90 rounded">
              <thead className="bg-muted/80 dark:bg-white/[0.04] border-b border-border/60 dark:border-white/10 rounded">
                <tr>
                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Item
                  </th>
                  {/* <th className="p-4 text-left">Category</th> */}
                  <th className="p-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground text-center">
                    Beginning
                  </th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground text-center">
                    IN
                  </th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground text-center">
                    OUT
                  </th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground text-center">
                    Balance
                  </th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60 dark:divide-white/5">
                {paginatedRows.map((row) => {
                  const balance = row.actualBalance ?? 0;
                  const inStock = balance > 0;

                  return (
                    <motion.tr
                      key={row.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-background/40 dark:bg-transparent hover:bg-muted/40 dark:hover:bg-white/[0.06] transition-colors"
                    >
                      <td className="p-4 font-medium">
                        {`${row.name} (${row.description})`}
                      </td>
                      {/* <td className="p-4">{row.category}</td> */}
                      <td className="p-4 text-center">{row.beginingStock}</td>
                      <td className="p-4 text-center text-green-700">
                        +{row.newDeliveryStock}
                      </td>
                      <td className="p-4 text-center text-red-700">
                        -{row.totalOut}
                      </td>
                      <td className="p-4 text-center font-semibold">
                        {balance}
                      </td>
                      <td className="p-4">
                        <Badge variant={inStock ? "success" : "destructive"}>
                          {inStock ? "IN_STOCK" : "OUT_OF_STOCK"}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        {/* <Button
                          className="me-2"
                          size="icon"
                          variant="info"
                          onClick={() => {
                            router.push(`${pathname}/${row.id}/Stock_Card`);
                          }}
                        >
                          <File size={14} />
                        </Button> */}

                        <Button
                          className="me-2"
                          size="icon"
                          variant="success"
                          onClick={() => {
                            setEditingId(row.id);
                            setEditOpen(true);
                          }}
                        >
                          <Edit3Icon size={14} />
                        </Button>

                        <Button
                          className="text-white bg-red-600 hover:bg-red-700 me-2"
                          size="icon"
                          // variant="error"
                          onClick={() => handleDelete(row.id)}
                        >
                          <TrashIcon size={14} />
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
            {filteredRows.length > 0 && (
              <div className="flex flex-col md:flex-row items-center justify-between gap-2 px-4 py-3 border-t text-xs md:text-sm">
                <div>
                  Showing{" "}
                  {`${Math.min(startIndex + 1, filteredRows.length)}-${Math.min(
                    endIndex,
                    filteredRows.length
                  )}`}{" "}
                  of {filteredRows.length} items
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function ItemInventoryList() {
  return (
    <QueryClientProvider client={queryClient}>
      <ItemInventoryListInner />
    </QueryClientProvider>
  );
}
