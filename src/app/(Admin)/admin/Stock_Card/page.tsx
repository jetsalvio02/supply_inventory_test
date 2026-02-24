"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input as StandardInput } from "@/components/ui/input";

interface StockCardRow {
  id: number;
  date: string;
  type: "IN" | "OUT" | "FORWARD";
  inQty: number;
  outQty: number;
  balance: number;
  remarks?: string;
  performedBy: string;
  department?: string;
}

interface SystemSettings {
  entityName: string | null;
  division: string | null;
  referenceIarNo: string | null;
  fundCluster: string | null;
}

interface ItemOption {
  id: number;
  name: string;
  description: string;
  stockNo: string;
  unit: string;
  beginingStock: number;
  createdAt: string;
}

export default function StockCards() {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const { data: settings } = useQuery<SystemSettings | null>({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const res = await fetch("/api/admin/settings");
      if (!res.ok) return null;
      const data = await res.json();
      return data?.settings ?? null;
    },
  });

  const { data: items = [] } = useQuery<ItemOption[]>({
    queryKey: ["admin-stock-card-items"],
    queryFn: async () => {
      const res = await fetch("/api/admin/items");
      if (!res.ok) return [];
      const data = await res.json();
      return (data as any[]).map((i) => ({
        id: i.id,
        name: i.name ?? "",
        description: i.description ?? "",
        stockNo: i.stockNo ?? "",
        unit: i.unit ?? "",
        beginingStock: i.beginingStock ?? 0,
        createdAt: i.createdAt ?? "",
      }));
    },
  });

  const { data: rows = [] } = useQuery<StockCardRow[]>({
    queryKey: ["admin-stock-card", selectedItemId],
    enabled: !!selectedItemId,
    queryFn: async () => {
      if (!selectedItemId) return [];
      const res = await fetch(
        `/api/admin/items/stock_card?id=${selectedItemId}`,
      );
      if (!res.ok) return [];
      const data = await res.json();
      return (data as any[]).map((row) => ({
        id: row.id,
        date:
          typeof row.date === "string"
            ? row.date
            : new Date(row.date).toISOString(),
        type: row.type,
        inQty: row.inQty ?? 0,
        outQty: row.outQty ?? 0,
        balance: row.balance ?? 0,
        remarks: row.remarks ?? "",
        performedBy: row.performedBy ?? "",
        department: row.department ?? "",
      }));
    },
  });

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedItemId) ?? null,
    [items, selectedItemId],
  );

  const entityName = settings?.entityName ?? "";
  const division = settings?.division ?? "";
  const fundCluster = settings?.fundCluster ?? "";
  const refIarNo = settings?.referenceIarNo ?? "";

  const filteredItems = useMemo(() => {
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(itemSearch.toLowerCase()) ||
        i.description.toLowerCase().includes(itemSearch.toLowerCase()),
    );
  }, [items, itemSearch]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return filteredItems.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredItems, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(filteredItems.length / rowsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [itemSearch, rowsPerPage]);

  const toggleSelection = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map((i) => i.id));
    }
  };

  const batchPrintMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await fetch(
        `/api/admin/items/stock_card?id=${ids.join(",")}`,
      );
      if (!res.ok) throw new Error("Failed to fetch stock card data");
      return res.json();
    },
    onSuccess: (allData: StockCardRow[], idsToPrint) => {
      const generatePageHtml = (item: ItemOption, itemRows: StockCardRow[]) => {
        const itemRowsHtml = itemRows
          .map((r) => {
            const isIn = r.type === "IN" || r.type === "FORWARD";
            const isOut = r.type === "OUT";
            return `
            <tr>
              <td class="cell center">${new Date(r.date).toLocaleDateString()}</td>
              <td class="cell center">${refIarNo}</td>
              <td class="cell center">${isIn ? r.inQty || "" : ""}</td>
              <td class="cell center">${isOut ? r.outQty || "" : ""}</td>
              <td class="cell center">${
                isOut
                  ? `${r.department || ""} ${r.performedBy ? `(${r.performedBy})` : ""}`
                  : ""
              }</td>
              <td class="cell center">${r.balance}</td>
              <td class="cell center"></td>
            </tr>`;
          })
          .join("");

        return `
          <div class="page" style="page-break-after: always; padding-top: 20px;">
              <div class="top-line">Appendix 58</div>
              <div class="header-section">
                  <div class="title">Department of Education</div>
                  ${division ? `<div class="title">${division}</div>` : ""}
                  <div class="title" style="margin-top: 10px; font-size: 13px;">STOCK CARD</div>
              </div>
  
              <div class="header-grid">
                <div class="header-item">
                  <span class="label">Entity Name:</span>
                  <span class="value">${entityName}</span>
                </div>
                <div class="header-item">
                  <span class="label">Fund Cluster:</span>
                  <span class="value">${fundCluster}</span>
                </div>
                <div class="header-item">
                  <span class="label">Item:</span>
                  <span class="value">${item.name || ""}</span>
                </div>
                <div class="header-item">
                  <span class="label">Stock No.:</span>
                  <span class="value">${item.stockNo || ""}</span>
                </div>
                <div class="header-item">
                  <span class="label">Description:</span>
                  <span class="value">${item.description || ""}</span>
                </div>
                <div class="header-item">
                  <span class="label">Reference IAR No.:</span>
                  <span class="value">${refIarNo}</span>
                </div>
                <div class="header-item full">
                  <span class="label">Unit of measurement:</span>
                  <span class="value">${item.unit || ""}</span>
                </div>
              </div>
  
              <table>
                <thead>
                  <tr>
                    <th rowspan="2">Date</th>
                    <th rowspan="2">Reference IAR No.</th>
                    <th>Receipt</th>
                    <th colspan="2">Issue</th>
                    <th>Balance</th>
                    <th rowspan="2">No. of days to consume</th>
                  </tr>
                  <tr>
                    <th>Qty.</th>
                    <th>Qty.</th>
                    <th>Office</th>
                    <th>Qty.</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="cell center">${
                      item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString()
                        : ""
                    }</td>
                    <td class="cell center">${refIarNo}</td>
                    <td class="cell center">${item.beginingStock}</td>
                    <td class="cell center"></td>
                    <td class="cell center"></td>
                    <td class="cell center">${item.beginingStock}</td>
                    <td class="cell center"></td>
                  </tr>
                  ${itemRowsHtml}
                  ${
                    !itemRows.length
                      ? '<tr><td colspan="7" class="center" style="padding: 20px;">No stock card entries found.</td></tr>'
                      : ""
                  }
                </tbody>
              </table>
          </div>`;
      };

      let pagesHtml = "";
      for (const id of idsToPrint) {
        const item = items.find((i) => i.id === id);
        if (!item) continue;
        const itemRows = allData.filter((r: any) => r.itemId === id);
        pagesHtml += generatePageHtml(item, itemRows);
      }

      const printWindow = window.open(
        "",
        "_blank",
        `width=${screen.availWidth},height=${screen.availHeight},top=0,left=0`,
      );
      if (!printWindow) return;

      printWindow.document.open();
      printWindow.document.write(`
        <html>
          <head>
            <title>Stock Cards Print</title>
            <style>
              * { box-sizing: border-box; }
              body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                font-size: 10px;
                padding: 0;
                margin: 0;
                color: #000;
              }
              .page {
                max-width: 1000px;
                margin: 0 auto;
                padding: 24px;
              }
              .top-line {
                display: flex;
                justify-content: flex-end;
                font-size: 9px;
                margin-bottom: 4px;
              }
              .header-section {
                text-align: center;
                margin-bottom: 16px;
              }
              .title {
                font-weight: 600;
                text-transform: uppercase;
                line-height: 1.2;
              }
              .header-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-bottom: 12px;
              }
              .header-item {
                display: flex;
                gap: 8px;
              }
              .header-item.full {
                  grid-column: span 2;
              }
              .label {
                width: 100px;
                font-weight: 400;
              }
              .value {
                flex: 1;
                border-bottom: 1px solid #000;
              }
              table {
                width: 100%;
                border-collapse: collapse;
              }
              th, td {
                border: 1px solid #000;
                padding: 4px 2px;
                font-size: 9px;
              }
              th {
                background: #fff;
              }
              .cell {
                vertical-align: top;
              }
              .center {
                text-align: center;
              }
              @media print {
                .page { margin: 0 auto; }
                @page { size: auto; margin: 0mm; }
              }
            </style>
          </head>
          <body>
            ${pagesHtml}
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
    },
  });

  const handlePrint = async () => {
    if (typeof window === "undefined") return;

    const idsToPrint =
      selectedIds.length > 0
        ? selectedIds
        : selectedItemId
          ? [selectedItemId]
          : [];
    if (idsToPrint.length === 0) return;

    batchPrintMutation.mutate(idsToPrint);
  };

  return (
    <div className="min-h-screen bg-transparent px-3 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6 rounded-2xl">
      <div className="min-h-screen p-4 flex flex-col gap-4">
        {/* Item Selection Table */}
        <Card className="p-4 rounded-xl border border-slate-200">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
            <h2 className="text-lg font-bold text-slate-800">
              Select Items for Batch Print
            </h2>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <StandardInput
                  placeholder="Search items..."
                  className="pl-9 h-9"
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleSelectAll}
                className="whitespace-nowrap"
              >
                {selectedIds.length === filteredItems.length
                  ? "Deselect All"
                  : "Select All"}
              </Button>
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto border rounded-md">
            <Table>
              <TableHeader className="bg-slate-50 sticky top-0 z-10">
                <TableRow>
                  <TableHead className="w-[50px]">Select</TableHead>
                  <TableHead>Item Name</TableHead>
                  {/* <TableHead>Stock No.</TableHead> */}
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((item) => (
                  <TableRow
                    key={item.id}
                    className={cn(
                      "cursor-pointer hover:bg-slate-50",
                      selectedIds.includes(item.id) && "bg-blue-50/50",
                    )}
                    onClick={() => toggleSelection(item.id)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.includes(item.id)}
                        onCheckedChange={() => toggleSelection(item.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    {/* <TableCell>{item.stockNo}</TableCell> */}
                    <TableCell className="text-slate-500 truncate max-w-[200px]">
                      {item.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <span>Rows per page:</span>
              <Select
                value={rowsPerPage.toString()}
                onValueChange={(value) => setRowsPerPage(Number(value))}
              >
                <SelectTrigger className="h-8 w-20">
                  <SelectValue placeholder={rowsPerPage} />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50].map((size) => (
                    <SelectItem key={size} value={size.toString()}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="ml-4">
                Showing{" "}
                {Math.min(
                  filteredItems.length,
                  (currentPage - 1) * rowsPerPage + 1,
                )}{" "}
                to {Math.min(filteredItems.length, currentPage * rowsPerPage)}{" "}
                of {filteredItems.length} items
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-sm font-medium">
                Page {currentPage} of {totalPages || 1}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between pt-4 border-t">
            <p className="text-sm text-slate-500">
              {selectedIds.length} item(s) selected
            </p>
            <Button
              disabled={
                selectedIds.length === 0 || batchPrintMutation.isPending
              }
              onClick={handlePrint}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {batchPrintMutation.isPending
                ? "⌛ Preparing..."
                : `🖨️ Print Selected (${selectedIds.length})`}
            </Button>
          </div>
        </Card>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-lg shadow-sm p-4 sm:p-6 border border-slate-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
            <label className="text-sm font-semibold text-slate-700 whitespace-nowrap">
              Select Item:
            </label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full sm:w-80 justify-between px-4 py-2.5 h-auto font-normal border-slate-300 rounded-lg hover:bg-white hover:border-slate-400 transition-colors"
                >
                  {selectedItemId
                    ? items.find((item) => item.id === selectedItemId)?.name
                    : "Select item..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full sm:w-80 p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search item..." />
                  <CommandList>
                    <CommandEmpty>No item found.</CommandEmpty>
                    <CommandGroup>
                      {items.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={item.name}
                          onSelect={() => {
                            setSelectedItemId(item.id);
                            setOpen(false);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedItemId === item.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          {item.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
          <Button
            size="sm"
            onClick={handlePrint}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            🖨️ Print
          </Button>
        </div>
        <div className="flex justify-center">
          <div className="bg-white w-[900px] max-w-full border border-slate-400 p-6 text-[11px] text-slate-900">
            <div className="flex justify-end text-[10px] mb-1">
              <span>Appendix 58</span>
            </div>
            <div className="text-center mb-4">
              <div className="flex justify-center mb-2">
                <Image
                  src="/images/logos/logo.png"
                  alt="Department of Education logo"
                  width={64}
                  height={64}
                />
              </div>
              <div className="text-[11px] uppercase tracking-wide">
                Department of Education
              </div>
              {division && (
                <div className="text-[11px] uppercase tracking-wide">
                  {division}
                </div>
              )}
              <div className="mt-2 font-semibold text-sm tracking-wide">
                STOCK CARD
              </div>
            </div>
            <div className="grid grid-cols-2 gap-y-1 gap-x-6 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-28">Entity Name:</span>
                <span className="flex-1 border-b border-slate-500 leading-none">
                  {entityName || "\u00A0"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-28">Fund Cluster:</span>
                <span className="flex-1 border-b border-slate-500 leading-none">
                  {fundCluster || "\u00A0"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-28">Item:</span>
                <span className="flex-1 border-b border-slate-500 leading-none">
                  {selectedItem ? selectedItem.name : "\u00A0"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-28">Stock No.:</span>
                <span className="flex-1 border-b border-slate-500 leading-none">
                  {selectedItem?.stockNo || "\u00A0"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-28">Description:</span>
                <span className="flex-1 border-b border-slate-500 leading-none">
                  {selectedItem?.description || "\u00A0"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-28">Reference IAR No.:</span>
                <span className="flex-1 border-b border-slate-500 leading-none">
                  {refIarNo || "\u00A0"}
                </span>
              </div>
              <div className="flex items-center gap-2 col-span-2">
                <span className="w-28">Unit of measurement:</span>
                <span className="flex-1 border-b border-slate-500 leading-none">
                  {selectedItem?.unit || "\u00A0"}
                </span>
              </div>
            </div>
            <table className="w-full border border-slate-500 border-collapse text-[10px]">
              <thead>
                <tr>
                  <th className="border border-slate-500 px-1 py-1" rowSpan={2}>
                    Date
                  </th>
                  <th className="border border-slate-500 px-1 py-1" rowSpan={2}>
                    Reference IAR No.
                  </th>
                  <th className="border border-slate-500 px-1 py-1" colSpan={1}>
                    Receipt
                  </th>
                  <th className="border border-slate-500 px-1 py-1" colSpan={2}>
                    Issue
                  </th>
                  <th className="border border-slate-500 px-1 py-1" colSpan={1}>
                    Balance
                  </th>
                  <th className="border border-slate-500 px-1 py-1" rowSpan={2}>
                    No. of days to consume
                  </th>
                </tr>
                <tr>
                  <th className="border border-slate-500 px-1 py-1">Qty.</th>
                  <th className="border border-slate-500 px-1 py-1">Qty.</th>
                  <th className="border border-slate-500 px-1 py-1">Office</th>
                  <th className="border border-slate-500 px-1 py-1">Qty.</th>
                </tr>
              </thead>
              <tbody>
                <tr className="h-6">
                  <td className="border border-slate-500 px-1 py-1 text-center">
                    {selectedItem?.createdAt
                      ? new Date(selectedItem.createdAt).toLocaleDateString()
                      : ""}
                  </td>
                  <td className="border border-slate-500 px-1 py-1 text-center">
                    {settings?.referenceIarNo}
                  </td>
                  <td className="border border-slate-500 px-1 py-1 text-center">
                    {selectedItem?.beginingStock ?? 0}
                  </td>
                  <td className="border border-slate-500 px-1 py-1 text-center"></td>
                  <td className="border border-slate-500 px-1 py-1 text-center"></td>
                  <td className="border border-slate-500 px-1 py-1 text-center">
                    {selectedItem?.beginingStock ?? 0}
                  </td>
                  <td className="border border-slate-500 px-1 py-1 text-center"></td>
                </tr>
                {rows.map((r) => {
                  const isIn = r.type === "IN" || r.type === "FORWARD";
                  const isOut = r.type === "OUT";
                  return (
                    <tr key={r.id}>
                      <td className="border border-slate-500 px-1 py-1 text-center">
                        {new Date(r.date).toLocaleDateString()}
                      </td>
                      <td className="border border-slate-500 px-1 py-1 text-center">
                        {refIarNo}
                      </td>
                      <td className="border border-slate-500 px-1 py-1 text-center">
                        {isIn ? r.inQty || "" : ""}
                      </td>
                      <td className="border border-slate-500 px-1 py-1 text-center">
                        {isOut ? r.outQty || "" : ""}
                      </td>
                      <td className="border border-slate-500 px-1 py-1 text-center">
                        {isOut
                          ? `${r.department || ""} ${r.performedBy ? `(${r.performedBy})` : ""}`
                          : ""}
                      </td>
                      <td className="border border-slate-500 px-1 py-1 text-center">
                        {r.balance}
                      </td>
                      <td className="border border-slate-500 px-1 py-1 text-center">
                        {""}
                      </td>
                    </tr>
                  );
                })}
                {!rows.length && (
                  <tr>
                    <td
                      className="border border-slate-500 px-1 py-6 text-center text-slate-500"
                      colSpan={7}
                    >
                      No stock card entries for this item.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
