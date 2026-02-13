"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { FileSpreadsheetIcon } from "lucide-react";

interface ItemReportRow {
  id: number;
  name: string;
  description: string;
  beginningStock: number;
  forwardedBalance: number;
  newDelivery: number;
  released: number;
  actualBalance: number;
  janFeb: number;
  march: number;
  april: number;
  may: number;
  june: number;
}

export default function SuppliesReportPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [rows, setRows] = useState<ItemReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [quarter, setQuarter] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/items/report?year=${year}`);
        if (!res.ok) {
          throw new Error("Failed to load report");
        }
        const data = await res.json();
        setRows(Array.isArray(data.items) ? data.items : []);
      } catch {
        setError("Failed to load report.");
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [year]);

  const summary = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.beginningStock += row.beginningStock;
        acc.forwardedBalance += row.forwardedBalance;
        acc.newDelivery += row.newDelivery;
        acc.released += row.released;
        acc.actualBalance += row.actualBalance;
        acc.janFeb += row.janFeb;
        acc.march += row.march;
        acc.april += row.april;
        acc.may += row.may;
        acc.june += row.june;
        return acc;
      },
      {
        beginningStock: 0,
        forwardedBalance: 0,
        newDelivery: 0,
        released: 0,
        actualBalance: 0,
        janFeb: 0,
        march: 0,
        april: 0,
        may: 0,
        june: 0,
      }
    );
  }, [rows]);

  const asOfLabel = useMemo(() => {
    if (!selectedDate) return "";
    const d = new Date(selectedDate);
    if (Number.isNaN(d.getTime())) return "";
    const monthName = d.toLocaleString("default", {
      month: "long",
    });
    const fullDate = format(d, "MMMM d, yyyy");
    return `${monthName.toUpperCase()} as of ${fullDate}`;
  }, [selectedDate]);

  const handleDateChange = (value: string) => {
    setSelectedDate(value);
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return;
    const y = d.getFullYear();
    const q = Math.floor(d.getMonth() / 3) + 1;
    setYear(y);
    setQuarter(q);
  };

  const formatCell = (value: number) => {
    if (!value) return "";
    return value.toString();
  };

  const handleExportExcel = () => {
    if (!rows.length) return;

    const header = [
      "Item",
      "Description",
      "Actual Balance",
      "Forwarded Balance",
      "New Delivery",
      "Beginning Stock",
      "Released",
      "JAN-FEB",
      "MARCH",
      "APRIL",
      "MAY",
      "JUNE",
    ];

    const rowsData = rows.map((row) => [
      row.name,
      row.description,
      row.actualBalance,
      row.forwardedBalance,
      row.newDelivery,
      row.beginningStock,
      row.released,
      row.janFeb,
      row.march,
      row.april,
      row.may,
      row.june,
    ]);

    const sheetData: (string | number)[][] = [];

    if (asOfLabel) {
      sheetData.push([
        "Supplies and Materials",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        asOfLabel,
      ]);
    } else {
      sheetData.push(["Supplies and Materials"]);
    }

    sheetData.push(header);
    sheetData.push(...rowsData);

    const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Supplies Report");

    const filename = `supplies-report-${year}-Q${quarter}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Supplies and Materials Report</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Inventory balances and released quantities by month
            {/* , 
            similar to the
            Excel summary. */}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="rounded-md border border-border bg-background px-3 py-1 text-sm"
          />
          <span className="rounded-md border border-border bg-muted px-3 py-1 text-sm">
            {year}
          </span>
          {/* <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setYear(currentYear);
              setSelectedDate("");
            }}
          >
            Current year
          </Button> */}
          <Button
            variant="success"
            className="flex items-center gap-2"
            size="sm"
            onClick={handleExportExcel}
            disabled={!rows.length}
          >
            <FileSpreadsheetIcon className="w-4 h-4" />
            Export Excel
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border border-border/60 dark:border-white/5 bg-card/80 dark:bg-white/[0.03] shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="px-6 py-10 text-sm text-muted-foreground">
              Loading report...
            </div>
          ) : error ? (
            <div className="px-6 py-10 text-sm text-destructive">{error}</div>
          ) : rows.length === 0 ? (
            <div className="px-6 py-10 text-sm text-muted-foreground">
              No data available for the selected year.
            </div>
          ) : (
            <table className="w-full text-xs md:text-sm text-foreground/90">
              <thead>
                <tr className="bg-muted/80 dark:bg-white/[0.04] border-b border-border/60 dark:border-white/10 text-center align-middle">
                  <th
                    rowSpan={2}
                    className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Item
                  </th>
                  <th
                    rowSpan={2}
                    className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Actual Balance
                  </th>
                  <th
                    rowSpan={2}
                    className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Forwarded Balance
                  </th>
                  <th
                    rowSpan={2}
                    className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    New Delivery
                  </th>
                  <th
                    rowSpan={2}
                    className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Beginning Stock
                  </th>
                  <th
                    rowSpan={2}
                    className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                  >
                    Released
                  </th>
                  <th
                    colSpan={3}
                    className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide bg-yellow-300 text-black"
                  >
                    First Quarter
                  </th>
                  <th
                    colSpan={2}
                    className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide bg-yellow-300 text-black"
                  >
                    Second Quarter
                  </th>
                </tr>
                <tr className="bg-muted/60 dark:bg-white/[0.03] border-b border-border/60 dark:border-white/10 text-center">
                  <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Jan–Feb
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    March
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    April
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    May
                  </th>
                  <th className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    June
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-white/5">
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="bg-background/40 dark:bg-transparent hover:bg-muted/40 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <td className="px-3 py-2 text-xs md:text-sm">
                      {row.name}
                      {row.description && (
                        <span className="block text-[10px] text-muted-foreground">
                          {row.description}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {row.actualBalance}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {row.forwardedBalance}
                    </td>
                    <td className="px-3 py-2 text-center">{row.newDelivery}</td>
                    <td className="px-3 py-2 text-center">
                      {row.beginningStock}
                    </td>
                    <td className="px-3 py-2 text-center">{row.released}</td>
                    <td className="px-3 py-2 text-center">
                      {formatCell(row.janFeb)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {formatCell(row.march)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {formatCell(row.april)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {formatCell(row.may)}
                    </td>
                    <td className="px-3 py-2 text-center">
                      {formatCell(row.june)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted/70 dark:bg-white/[0.06] text-xs font-semibold">
                  <td className="px-3 py-2 text-right">Totals</td>
                  <td className="px-3 py-2 text-center">
                    {summary.actualBalance}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {summary.forwardedBalance}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {summary.newDelivery}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {summary.beginningStock}
                  </td>
                  <td className="px-3 py-2 text-center">{summary.released}</td>
                  <td className="px-3 py-2 text-center">
                    {formatCell(summary.janFeb)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {formatCell(summary.march)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {formatCell(summary.april)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {formatCell(summary.may)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {formatCell(summary.june)}
                  </td>
                </tr>
              </tfoot>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
