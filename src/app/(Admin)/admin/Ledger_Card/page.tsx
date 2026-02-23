/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface LedgerRow {
  id: number;
  date: string;
  type: "IN" | "OUT" | "FORWARD";
  quantity: number;
  unitCost: number;
  totalCost: number;
  balanceQty: number;
}

interface ItemOption {
  id: number;
  name: string;
  description: string;
  stockNo: string;
  unit: string;
  unitCost: number;
}

interface SystemSettings {
  entityName: string | null;
  referenceIarNo: string | null;
  fundCluster: string | null;
}

export default function LedgerCard() {
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [open, setOpen] = useState(false);

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
    queryKey: ["admin-ledger-items"],
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
        unitCost: i.unitCost ? Number(i.unitCost) : 0,
      }));
    },
  });

  useEffect(() => {
    if (!selectedItemId && items.length > 0) {
      setSelectedItemId(items[0].id);
    }
  }, [items, selectedItemId]);

  const { data: ledgerRows = [] } = useQuery<LedgerRow[]>({
    queryKey: ["admin-ledger-card", selectedItemId],
    enabled: !!selectedItemId,
    queryFn: async () => {
      if (!selectedItemId) return [];
      const res = await fetch(
        `/api/admin/items/ledger_card?itemId=${selectedItemId}`,
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
        quantity: row.quantity ?? row.inQty ?? row.outQty ?? 0,
        unitCost: row.unitCost ? Number(row.unitCost) : 0,
        totalCost: row.totalCost ? Number(row.totalCost) : 0,
        balanceQty: row.balanceQty ?? 0,
      }));
    },
  });

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedItemId) ?? null,
    [items, selectedItemId],
  );

  const computedRows = useMemo(() => {
    let runningQty = 0;
    // Initial lastUnitCost from the item's record
    let lastUnitCost = selectedItem?.unitCost || 0;

    return ledgerRows.map((row) => {
      const isReceipt = row.type === "IN" || row.type === "FORWARD";
      const isIssue = row.type === "OUT";

      if (isReceipt) {
        runningQty += row.quantity;
        // Update lastUnitCost if the receipt has a cost
        if (row.unitCost > 0) {
          lastUnitCost = row.unitCost;
        }
      } else if (isIssue) {
        runningQty -= row.quantity;
      }

      const receiptQty = isReceipt ? row.quantity : 0;
      // Fallback to item cost or last receipt cost
      const receiptUnitCost = isReceipt ? row.unitCost || lastUnitCost : 0;
      const receiptTotalCost = isReceipt
        ? row.totalCost || receiptQty * receiptUnitCost
        : 0;

      const issueQty = isIssue ? row.quantity : 0;
      // Fallback to item cost/last receipt cost for issues
      const issueUnitCost = isIssue ? row.unitCost || lastUnitCost : 0;
      const issueTotalCost = isIssue ? issueQty * issueUnitCost : 0;

      // Ensure balance calculation is consistent
      const balanceQty = row.balanceQty || runningQty;
      const balanceUnitCost = lastUnitCost;
      const balanceTotalCost = balanceQty * balanceUnitCost;

      return {
        id: row.id,
        date: row.date,
        receiptQty,
        receiptUnitCost,
        receiptTotalCost,
        issueQty,
        issueUnitCost,
        issueTotalCost,
        balanceQty,
        balanceUnitCost,
        balanceTotalCost,
      };
    });
  }, [ledgerRows, selectedItem]);

  const handlePrint = () => {
    if (typeof window === "undefined") return;

    const printWindow = window.open(
      "",
      "_blank",
      `width=${screen.availWidth},height=${screen.availHeight},top=0,left=0`,
    );
    if (!printWindow) return;

    const rowsHtml = computedRows
      .map(
        (row) => `
        <tr>
          <td class="cell center">${new Date(row.date).toLocaleDateString()}</td>
          <td class="cell center">${settings?.referenceIarNo ?? ""}</td>
          <td class="cell center">${row.receiptQty || ""}</td>
          <td class="cell center">${row.receiptUnitCost ? row.receiptUnitCost.toFixed(2) : ""}</td>
          <td class="cell center">${row.receiptTotalCost ? row.receiptTotalCost.toFixed(2) : ""}</td>
          <td class="cell center">${row.issueQty || ""}</td>
          <td class="cell center">${row.issueUnitCost ? row.issueUnitCost.toFixed(2) : ""}</td>
          <td class="cell center">${row.issueTotalCost ? row.issueTotalCost.toFixed(2) : ""}</td>
          <td class="cell center">${row.balanceQty || ""}</td>
          <td class="cell center">${row.balanceUnitCost ? row.balanceUnitCost.toFixed(2) : ""}</td>
          <td class="cell center">${row.balanceTotalCost ? row.balanceTotalCost.toFixed(2) : ""}</td>
          <td class="cell center"></td>
        </tr>`,
      )
      .join("");

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>Ledger Card - ${selectedItem?.name || "Item"}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              font-size: 10px;
              padding: 24px;
              color: #000;
            }
            .page {
              max-width: 1000px;
              margin: 0 auto;
            }
            .top-line {
              display: flex;
              justify-content: flex-end;
              font-size: 9px;
              margin-bottom: 4px;
            }
            .title {
              text-align: center;
              font-weight: 600;
              margin-bottom: 12px;
              text-transform: uppercase;
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
              text-transform: uppercase;
            }
            .cell {
              vertical-align: top;
            }
            .center {
              text-align: center;
            }
            @media print {
              body { padding: 0; }
              .page { margin: 8px auto; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="top-line">Appendix 57</div>
            <div class="title">SUPPLIES LEDGER CARD</div>

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
                <span class="value">${selectedItem?.name || ""}</span>
              </div>
              <div class="header-item">
                <span class="label">Stock No.:</span>
                <span class="value">${selectedItem?.stockNo || ""}</span>
              </div>
              <div class="header-item">
                <span class="label">Description:</span>
                <span class="value">${selectedItem?.description || ""}</span>
              </div>
              <div class="header-item">
                <span class="label">Reference IAR No.:</span>
                <span class="value">${settings?.referenceIarNo}</span>
              </div>
              <div class="header-item full">
                <span class="label">Unit of measurement:</span>
                <span class="value">${selectedItem?.unit || ""}</span>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th rowspan="2">Date</th>
                  <th rowspan="2">Reference</th>
                  <th colspan="3">Receipt</th>
                  <th colspan="3">Issue</th>
                  <th colspan="3">Balance</th>
                  <th rowspan="2">No. of Days to Consume</th>
                </tr>
                <tr>
                  <th>Qty</th>
                  <th>Unit Cost</th>
                  <th>Total Cost</th>
                  <th>Qty</th>
                  <th>Unit Cost</th>
                  <th>Total Cost</th>
                  <th>Qty</th>
                  <th>Unit Cost</th>
                  <th>Total Cost</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
                ${!computedRows.length ? '<tr><td colspan="12" class="center" style="padding: 20px;">No ledger entries found.</td></tr>' : ""}
              </tbody>
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

  const entityName = settings?.entityName ?? "";
  const fundCluster = settings?.fundCluster ?? "";

  return (
    <div className="min-h-screen bg-background px-3 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6 rounded-2xl">
      <div className="min-h-screen p-4 flex flex-col gap-4">
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
              <span>Appendix 57</span>
            </div>
            <div className="text-center mb-4">
              <div className="text-[11px] uppercase tracking-wide mb-1">
                SUPPLIES LEDGER CARD
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
                  {settings?.referenceIarNo || "\u00A0"}
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
                    Reference
                  </th>
                  <th className="border border-slate-500 px-1 py-1" colSpan={3}>
                    Receipt
                  </th>
                  <th className="border border-slate-500 px-1 py-1" colSpan={3}>
                    Issue
                  </th>
                  <th className="border border-slate-500 px-1 py-1" colSpan={3}>
                    Balance
                  </th>
                  <th className="border border-slate-500 px-1 py-1" rowSpan={2}>
                    No. of Days to Consume
                  </th>
                </tr>
                <tr>
                  <th className="border border-slate-500 px-1 py-1">Qty</th>
                  <th className="border border-slate-500 px-1 py-1">
                    Unit Cost
                  </th>
                  <th className="border border-slate-500 px-1 py-1">
                    Total Cost
                  </th>
                  <th className="border border-slate-500 px-1 py-1">Qty</th>
                  <th className="border border-slate-500 px-1 py-1">
                    Unit Cost
                  </th>
                  <th className="border border-slate-500 px-1 py-1">
                    Total Cost
                  </th>
                  <th className="border border-slate-500 px-1 py-1">Qty</th>
                  <th className="border border-slate-500 px-1 py-1">
                    Unit Cost
                  </th>
                  <th className="border border-slate-500 px-1 py-1">
                    Total Cost
                  </th>
                </tr>
              </thead>
              <tbody>
                {computedRows.map((row) => (
                  <tr key={row.id}>
                    <td className="border border-slate-500 px-1 py-1 text-center">
                      {new Date(row.date).toLocaleDateString()}
                    </td>
                    <td className="border border-slate-500 px-1 py-1 text-center">
                      {settings?.referenceIarNo ?? ""}
                    </td>
                    <td className="border border-slate-500 px-1 py-1 text-center">
                      {row.receiptQty || ""}
                    </td>
                    <td className="border border-slate-500 px-1 py-1 text-center">
                      {row.receiptUnitCost
                        ? row.receiptUnitCost.toFixed(2)
                        : ""}
                    </td>
                    <td className="border border-slate-500 px-1 py-1 text-center">
                      {row.receiptTotalCost
                        ? row.receiptTotalCost.toFixed(2)
                        : ""}
                    </td>
                    <td className="border border-slate-500 px-1 py-1 text-center">
                      {row.issueQty || ""}
                    </td>
                    <td className="border border-slate-500 px-1 py-1 text-center">
                      {row.issueUnitCost ? row.issueUnitCost.toFixed(2) : ""}
                    </td>
                    <td className="border border-slate-500 px-1 py-1 text-center">
                      {row.issueTotalCost ? row.issueTotalCost.toFixed(2) : ""}
                    </td>
                    <td className="border border-slate-500 px-1 py-1 text-center">
                      {row.balanceQty || ""}
                    </td>
                    <td className="border border-slate-500 px-1 py-1 text-center">
                      {row.balanceUnitCost
                        ? row.balanceUnitCost.toFixed(2)
                        : ""}
                    </td>
                    <td className="border border-slate-500 px-1 py-1 text-center">
                      {row.balanceTotalCost
                        ? row.balanceTotalCost.toFixed(2)
                        : ""}
                    </td>
                    <td className="border border-slate-500 px-1 py-1 text-center">
                      {""}
                    </td>
                  </tr>
                ))}
                {!computedRows.length && (
                  <tr>
                    <td
                      className="border border-slate-500 px-1 py-6 text-center text-slate-500"
                      colSpan={12}
                    >
                      No ledger entries for this item.
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
