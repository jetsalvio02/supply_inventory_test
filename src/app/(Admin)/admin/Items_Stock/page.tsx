"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { FileSpreadsheetIcon, PrinterIcon } from "lucide-react";

interface ItemRow {
  id: number;
  name: string;
  description: string;
  actualBalance: number | null;
}

export default function ItemsStockStatusPage() {
  const [items, setItems] = useState<ItemRow[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/items")
      .then((res) => res.json())
      .then((data: any[]) => {
        const mapped = (data ?? []).map((row: any) => ({
          id: row.id,
          name: row.name ?? "",
          description: row.description ?? "",
          actualBalance:
            typeof row.actualBalance === "number"
              ? row.actualBalance
              : row.balance ?? null,
        }));
        setItems(mapped);
      })
      .catch(() => {
        setItems([]);
      });
  }, []);

  const { inStock, outOfStock } = useMemo(() => {
    const inStockList: ItemRow[] = [];
    const outStockList: ItemRow[] = [];

    const term = search.trim().toLowerCase();

    for (const item of items) {
      const balance = item.actualBalance ?? 0;
      const matches =
        !term ||
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term);

      if (!matches) {
        continue;
      }

      if (balance > 0) {
        inStockList.push(item);
      } else {
        outStockList.push(item);
      }
    }

    inStockList.sort((a, b) => a.name.localeCompare(b.name));
    outStockList.sort((a, b) => a.name.localeCompare(b.name));

    return { inStock: inStockList, outOfStock: outStockList };
  }, [items, search]);

  const handleExportExcel = () => {
    if (!inStock.length && !outOfStock.length) return;

    const sheetData: (string | number)[][] = [];

    sheetData.push(["Status", ""]);
    sheetData.push(["In Stock", "Out of Stock"]);

    const maxRows = Math.max(inStock.length, outOfStock.length);

    for (let i = 0; i < maxRows; i += 1) {
      const left = inStock[i];
      const right = outOfStock[i];

      const leftText = left
        ? `${left.name}${left.description ? ` (${left.description})` : ""}`
        : "";
      const rightText = right
        ? `${right.name}${right.description ? ` (${right.description})` : ""}`
        : "";

      sheetData.push([leftText, rightText]);
    }

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Status");
    XLSX.writeFile(workbook, "items-status.xlsx");
  };

  const handlePrint = () => {
    if (typeof window === "undefined") return;

    const printWindow = window.open(
      "",
      "_blank",
      `width=${screen.availWidth},height=${screen.availHeight},top=0,left=0`
    );

    if (!printWindow) return;
  };

  return (
    <div className="min-h-screen bg-background px-3 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6 rounded-2xl">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6 rounded-2xl">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h1 className="text-xl sm:text-2xl font-bold text-center md:text-left">
            Status
          </h1>
          <div className="flex w-full md:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <span className="text-xs sm:text-sm ">Search:</span>
            <div className="w-full sm:w-64">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search items by name or description"
                className="text-xs sm:text-sm"
              />
            </div>
            <Button
              size="sm"
              className="whitespace-nowrap w-full sm:w-auto"
              onClick={handlePrint}
              disabled={!inStock.length && !outOfStock.length}
            >
              <PrinterIcon className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button
              size="sm"
              variant="success"
              className="whitespace-nowrap w-full sm:w-auto"
              onClick={handleExportExcel}
              disabled={!inStock.length && !outOfStock.length}
            >
              <FileSpreadsheetIcon className="w-4 h-4 mr-2" />
              Export csv.
            </Button>
          </div>
        </div>

        <Card className="max-w-5xl mx-auto rounded-2xl border border-border/60 dark:border-white/5 bg-card/80 dark:bg-white/[0.03] shadow-sm">
          <CardContent className="p-0 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div>
                <div className="bg-emerald-100 dark:bg-emerald-500/15 text-sm font-semibold text-center py-2 border-b border-slate-200 dark:border-white/10">
                  In Stock
                </div>
                <div className="max-h-[70vh] overflow-auto px-4 py-2 text-sm">
                  {inStock.length === 0 ? (
                    <p className="text-muted-foreground text-xs">
                      No items in stock.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {inStock.map((item, idx) => (
                        <li
                          key={item.id ?? idx}
                          className="whitespace-pre-line"
                        >
                          {`${item.name} (${item.description ?? ""})`}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="border-t md:border-t-0 md:border-l border-slate-200 dark:border-white/10">
                <div className="bg-rose-100 dark:bg-rose-500/15 text-sm font-semibold text-center py-2 border-b border-slate-200 dark:border-white/10">
                  Out of Stock
                </div>
                <div className="max-h-[70vh] overflow-auto px-4 py-2 text-sm">
                  {outOfStock.length === 0 ? (
                    <p className="text-muted-foreground text-xs">
                      No items out of stock.
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {outOfStock.map((item, idx) => (
                        <li
                          key={item.id ?? idx}
                          className="whitespace-pre-line"
                        >
                          {`${item.name} (${item.description ?? ""})`}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
