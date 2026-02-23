"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import * as XLSX from "xlsx";
import { format } from "date-fns";
import { FileSpreadsheetIcon, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ItemReportRow {
  id: number;
  name: string;
  description: string;
  beginningStock: number;
  forwardedBalance: number;
  newDelivery: number;
  released: number;
  actualBalance: number;
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
}

interface MonthGroup {
  id: string;
  label: string;
  months: (keyof ItemReportRow)[];
}

interface QuarterConfig {
  id: string;
  label: string;
  groups: MonthGroup[];
}

export default function SuppliesReportPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [rows, setRows] = useState<ItemReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [quarter, setQuarter] = useState(1);
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedMonthEnd, setSelectedMonthEnd] = useState("");
  const [selectedDateEnd, setSelectedDateEnd] = useState("");

  const [quarters, setQuarters] = useState<QuarterConfig[]>([
    {
      id: "q1",
      label: "FIRST QUARTER",
      groups: [
        { id: "g1", label: "JAN-FEB", months: ["jan", "feb"] },
        { id: "g2", label: "MARCH", months: ["mar"] },
        { id: "g3", label: "APRIL", months: ["apr"] },
      ],
    },
    {
      id: "q2",
      label: "SECOND QUARTER",
      groups: [
        { id: "g4", label: "MAY", months: ["may"] },
        { id: "g5", label: "JUNE", months: ["jun"] },
      ],
    },
  ]);
  const [isEditingConfig, setIsEditingConfig] = useState(false);

  // Load persistence
  useEffect(() => {
    const saved = localStorage.getItem("supplies_report_quarters");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQuarters(parsed);
        }
      } catch (e) {
        console.error("Failed to load quarters config", e);
      }
    }
  }, []);

  // Save persistence
  useEffect(() => {
    localStorage.setItem("supplies_report_quarters", JSON.stringify(quarters));
  }, [quarters]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
        setCurrentPage(1); // Reset to first page on new data
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
        acc.jan += row.jan;
        acc.feb += row.feb;
        acc.mar += row.mar;
        acc.apr += row.apr;
        acc.may += row.may;
        acc.jun += row.jun;
        acc.jul += row.jul;
        acc.aug += row.aug;
        acc.sep += row.sep;
        acc.oct += row.oct;
        acc.nov += row.nov;
        acc.dec += row.dec;
        return acc;
      },
      {
        beginningStock: 0,
        forwardedBalance: 0,
        newDelivery: 0,
        released: 0,
        actualBalance: 0,
        jan: 0,
        feb: 0,
        mar: 0,
        apr: 0,
        may: 0,
        jun: 0,
        jul: 0,
        aug: 0,
        sep: 0,
        oct: 0,
        nov: 0,
        dec: 0,
      },
    );
  }, [rows]);

  const getMonthRange = () => {
    if (!selectedMonth) return null;

    const [startYearStr, startMonthStr] = selectedMonth.split("-");
    const startYearNum = Number(startYearStr);
    const startMonthNum = Number(startMonthStr);

    if (!startYearNum || !startMonthNum) return null;

    if (!selectedMonthEnd) {
      return {
        year: startYearNum,
        startMonth: startMonthNum,
        endMonth: startMonthNum,
      };
    }

    const [endYearStr, endMonthStr] = selectedMonthEnd.split("-");
    const endYearNum = Number(endYearStr);
    const endMonthNum = Number(endMonthStr);

    if (!endYearNum || !endMonthNum) {
      return {
        year: startYearNum,
        startMonth: startMonthNum,
        endMonth: startMonthNum,
      };
    }

    if (endYearNum !== startYearNum) {
      return {
        year: startYearNum,
        startMonth: startMonthNum,
        endMonth: startMonthNum,
      };
    }

    const normalizedStartMonth = Math.max(1, Math.min(12, startMonthNum));
    const normalizedEndMonth = Math.max(
      normalizedStartMonth,
      Math.min(12, endMonthNum),
    );

    return {
      year: startYearNum,
      startMonth: normalizedStartMonth,
      endMonth: normalizedEndMonth,
    };
  };

  const selectedRange = useMemo(
    () => getMonthRange(),
    [selectedMonth, selectedMonthEnd],
  );

  const getReleasedForRowInRange = (row: ItemReportRow) => {
    if (!selectedRange) return 0;

    const { startMonth, endMonth } = selectedRange;

    const monthToValue = (month: number) => {
      if (month === 1) return row.jan;
      if (month === 2) return row.feb;
      if (month === 3) return row.mar;
      if (month === 4) return row.apr;
      if (month === 5) return row.may;
      if (month === 6) return row.jun;
      if (month === 7) return row.jul;
      if (month === 8) return row.aug;
      if (month === 9) return row.sep;
      if (month === 10) return row.oct;
      if (month === 11) return row.nov;
      if (month === 12) return row.dec;
      return 0;
    };

    let total = 0;
    for (let m = startMonth; m <= endMonth; m++) {
      total += monthToValue(m);
    }
    return total;
  };

  const totalReleasedInRange = useMemo(() => {
    if (!selectedRange) return 0;
    return rows.reduce((acc, row) => acc + getReleasedForRowInRange(row), 0);
  }, [rows, selectedRange]);

  const applyQuarterToRange = (quarterValue: number, yearValue: number) => {
    const normalizedQuarter = Math.max(1, Math.min(4, quarterValue));
    const startMonth = (normalizedQuarter - 1) * 3 + 1;
    const endMonth = normalizedQuarter * 3;

    setQuarter(normalizedQuarter);
    setSelectedMonth(`${yearValue}-${String(startMonth).padStart(2, "0")}`);
    setSelectedMonthEnd(`${yearValue}-${String(endMonth).padStart(2, "0")}`);

    const endDate = new Date(yearValue, endMonth, 0);
    setSelectedDate(endDate.toISOString().slice(0, 10));
    setSelectedDateEnd(endDate.toISOString().slice(0, 10));
  };

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
    applyQuarterToRange(q, y);
  };

  const formatCell = (value: number) => {
    if (!value && value !== 0) return "";
    return value.toString();
  };

  const calculateGroupValue = (
    row: ItemReportRow | any,
    months: (keyof ItemReportRow)[],
  ) => {
    return months.reduce((sum, month) => sum + (Number(row[month]) || 0), 0);
  };

  const handleExportExcel = () => {
    if (!rows.length) return;

    // Build dynamic header based on configuration
    const staticHeader = [
      "Item",
      "Description",
      "Actual Balance",
      "Forwarded Balance",
      "New Delivery",
      "Beginning Stock",
      "Released",
    ];

    const groupLabels = quarters.flatMap((q) => q.groups.map((g) => g.label));
    const header = [...staticHeader, ...groupLabels];

    const rowsData = rows.map((row) => {
      const staticData = [
        row.name,
        row.description,
        row.actualBalance,
        row.forwardedBalance,
        row.newDelivery,
        row.beginningStock,
        row.released,
      ];
      const groupData = quarters.flatMap((q) =>
        q.groups.map((g) => calculateGroupValue(row, g.months)),
      );
      return [...staticData, ...groupData];
    });

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

  const handlePrint = () => {
    if (!rows.length) return;
    if (typeof window === "undefined") return;

    const printWindow = window.open(
      "",
      "_blank",
      `width=${screen.availWidth},height=${screen.availHeight},top=0,left=0`,
    );
    if (!printWindow) return;

    const headerTitle = "Supplies and Materials Report";
    const subtitle = asOfLabel || `Year ${year}`;

    const staticHeaders = [
      "Item",
      "Actual Balance",
      "Forwarded Balance",
      "New Delivery",
      "Beginning Stock",
      "Released",
    ];

    const quarterRow = `
      <tr>
        <th rowspan="2">Item</th>
        <th rowspan="2">Actual Balance</th>
        <th rowspan="2">Forwarded Balance</th>
        <th rowspan="2">New Delivery</th>
        <th rowspan="2">Beginning Stock</th>
        <th rowspan="2">Released</th>
        ${quarters.map((q) => `<th colspan="${q.groups.length}" style="background-color: #ffff00;">${q.label}</th>`).join("")}
      </tr>
    `;

    const groupRow = `
      <tr>
        ${quarters.flatMap((q) => q.groups.map((g) => `<th style="background-color: #d1d5db;">${g.label}</th>`)).join("")}
      </tr>
    `;

    const bodyRows = rows
      .map(
        (row) => `
        <tr>
          <td class="cell item-cell">
            <div class="item-name">${row.name}</div>
            ${
              row.description
                ? `<div class="item-desc">${row.description}</div>`
                : ""
            }
          </td>
          <td class="cell center">${row.actualBalance}</td>
          <td class="cell center">${row.forwardedBalance}</td>
          <td class="cell center">${row.newDelivery}</td>
          <td class="cell center">${row.beginningStock}</td>
          <td class="cell center">${row.released}</td>
          ${quarters.flatMap((q) => q.groups.map((g) => `<td class="cell center">${formatCell(calculateGroupValue(row, g.months))}</td>`)).join("")}
        </tr>`,
      )
      .join("");

    const totalsRow = `
      <tr class="totals-row">
        <td class="cell right">Totals</td>
        <td class="cell center">${summary.actualBalance}</td>
        <td class="cell center">${summary.forwardedBalance}</td>
        <td class="cell center">${summary.newDelivery}</td>
        <td class="cell center">${summary.beginningStock}</td>
        <td class="cell center">${summary.released}</td>
        ${quarters.flatMap((q) => q.groups.map((g) => `<td class="cell center">${formatCell(calculateGroupValue(summary, g.months))}</td>`)).join("")}
      </tr>
    `;

    printWindow.document.open();
    printWindow.document.write(`
      <html>
        <head>
          <title>${headerTitle}</title>
          <style>
            * { box-sizing: border-box; }
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              font-size: 11px;
              padding: 24px;
              color: #111827;
            }
            .page {
              max-width: 1000px;
              margin: 0 auto;
            }
            .title {
              text-align: center;
              font-weight: 600;
              font-size: 18px;
              margin-bottom: 4px;
            }
            .subtitle {
              text-align: center;
              font-size: 12px;
              margin-bottom: 16px;
              color: #4b5563;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th {
              border: 1px solid #000;
              padding: 6px 4px;
              text-align: center;
              font-size: 10px;
              text-transform: uppercase;
              background-color: #e5e7eb;
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
            .right {
              text-align: right;
            }
            .item-cell {
              min-width: 160px;
            }
            .item-name {
              font-weight: 500;
            }
            .item-desc {
              font-size: 10px;
              color: #4b5563;
            }
            .totals-row {
              font-weight: 600;
              background-color: #f3f4f6;
            }
            @media print {
              body { padding: 0; }
              .page { margin: 16px auto; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="title">${headerTitle}</div>
            <div class="subtitle">${subtitle}</div>
            <table>
              <thead>
                ${quarterRow}
                ${groupRow}
              </thead>
              <tbody>
                ${bodyRows}
              </tbody>
              <tfoot>
                ${totalsRow}
              </tfoot>
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

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    if (!month) return;

    const [yearStr, monthStr] = month.split("-");
    const y = Number(yearStr);
    const m = Number(monthStr);

    if (!y || !m || Number.isNaN(y) || Number.isNaN(m)) return;

    setYear(y);
    const q = Math.floor((m - 1) / 3) + 1;
    applyQuarterToRange(q, y);
  };

  const handleMonthEndChange = (monthEnd: string) => {
    setSelectedMonthEnd(monthEnd);
  };

  const handleQuarterSet = () => {
    if (!quarter) return;
    const yearValue = year;
    applyQuarterToRange(quarter, yearValue);
  };

  const handleDateEndChange = (dateEnd: string) => {
    setSelectedDateEnd(dateEnd);
  };

  // Pagination logic
  const totalPages = Math.ceil(rows.length / itemsPerPage);
  const paginatedRows = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return rows.slice(startIndex, startIndex + itemsPerPage);
  }, [rows, currentPage, itemsPerPage]);

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="min-h-screen bg-background px-3 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6 rounded-2xl">
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Supplies and Materials Report
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Inventory balances and released quantities by month
              {/* ,
              similar to the
              Excel summary. */}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-1 text-sm"
            /> */}
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
              className="flex items-center gap-2"
              size="sm"
              onClick={handlePrint}
              disabled={!rows.length}
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
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
            <Button
              variant="default"
              size="sm"
              onClick={() => setIsEditingConfig(!isEditingConfig)}
            >
              {isEditingConfig ? "Close Setup" : "Setup Quarters"}
            </Button>
          </div>
        </div>

        {isEditingConfig && (
          <Card className="p-4 bg-muted/30">
            <h3 className="text-lg font-semibold mb-4">Report Configuration</h3>
            <div className="space-y-6">
              {quarters.map((q, qIndex) => (
                <div key={q.id} className="p-4 border rounded-lg bg-background">
                  <div className="flex items-center gap-4 mb-4">
                    <Input
                      value={q.label}
                      onChange={(e) => {
                        const newQuarters = [...quarters];
                        newQuarters[qIndex].label = e.target.value;
                        setQuarters(newQuarters);
                      }}
                      className="font-bold text-lg bg-yellow-400/20"
                      placeholder="Quarter Label (e.g. FIRST QUARTER)"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        setQuarters(quarters.filter((_, i) => i !== qIndex))
                      }
                    >
                      Remove Quarter
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {q.groups.map((g, gIndex) => (
                      <div
                        key={g.id}
                        className="p-3 border rounded bg-muted/20"
                      >
                        <div className="flex flex-col gap-2">
                          <Input
                            value={g.label}
                            onChange={(e) => {
                              const newQuarters = [...quarters];
                              newQuarters[qIndex].groups[gIndex].label =
                                e.target.value;
                              setQuarters(newQuarters);
                            }}
                            className="font-semibold bg-muted"
                            placeholder="Group Label (e.g. JAN-FEB)"
                          />
                          <div className="text-[10px] text-muted-foreground break-all">
                            Months: {g.months.join(", ")}
                          </div>
                          <div className="flex gap-1 flex-wrap">
                            {[
                              "jan",
                              "feb",
                              "mar",
                              "apr",
                              "may",
                              "jun",
                              "jul",
                              "aug",
                              "sep",
                              "oct",
                              "nov",
                              "dec",
                            ].map((m) => (
                              <button
                                key={m}
                                onClick={() => {
                                  const newQuarters = [...quarters];
                                  const months =
                                    newQuarters[qIndex].groups[gIndex].months;
                                  if (months.includes(m as any)) {
                                    newQuarters[qIndex].groups[gIndex].months =
                                      months.filter((month) => month !== m);
                                  } else {
                                    newQuarters[qIndex].groups[gIndex].months =
                                      [...months, m as any];
                                  }
                                  setQuarters(newQuarters);
                                }}
                                className={`px-1 rounded text-[10px] border ${g.months.includes(m as any) ? "bg-primary text-primary-foreground" : "bg-background"}`}
                              >
                                {m.toUpperCase()}
                              </button>
                            ))}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 text-[10px]"
                            onClick={() => {
                              const newQuarters = [...quarters];
                              newQuarters[qIndex].groups = newQuarters[
                                qIndex
                              ].groups.filter((_, i) => i !== gIndex);
                              setQuarters(newQuarters);
                            }}
                          >
                            Remove Column
                          </Button>
                        </div>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-full border-dashed"
                      onClick={() => {
                        const newQuarters = [...quarters];
                        newQuarters[qIndex].groups.push({
                          id: Math.random().toString(36).substr(2, 9),
                          label: "NEW COLUMN",
                          months: [],
                        });
                        setQuarters(newQuarters);
                      }}
                    >
                      + Add Column
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={() => {
                  setQuarters([
                    ...quarters,
                    {
                      id: Math.random().toString(36).substr(2, 9),
                      label: "NEW QUARTER",
                      groups: [],
                    },
                  ]);
                }}
              >
                + Add New Quarter Section
              </Button>
            </div>
          </Card>
        )}
        {/* <Card>
          <div className="flex flex-col gap-3 p-4">
            <div className="flex flex-wrap items-end gap-3"> */}
        {/* <div className="flex flex-col gap-1">
                <label>Month from</label>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="rounded-md border border-border bg-background px-3 py-1 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label>to</label>
                <Input
                  type="month"
                  value={selectedMonthEnd}
                  onChange={(e) => handleMonthEndChange(e.target.value)}
                  className="rounded-md border border-border bg-background px-3 py-1 text-sm"
                />
              </div> */}
        {/* <div className="flex flex-wrap items-end gap-3 pt-2">
                <div className="flex flex-col gap-1">
                  <label>Day from</label>
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="rounded-md border border-border bg-background px-3 py-1 text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label>Day to</label>
                <Input
                  type="date"
                  value={selectedDateEnd}
                  onChange={(e) => handleDateEndChange(e.target.value)}
                  className="rounded-md border border-border bg-background px-3 py-1 text-sm"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label>Quarter</label>
                <Input
                  type="number"
                  value={quarter}
                  onChange={(e) => setQuarter(Number(e.target.value))}
                  className="rounded-md border border-border bg-background px-3 py-1 text-sm w-24"
                />
              </div>
              <div>
                <Button onClick={handleQuarterSet}>Set Quarter</Button>
              </div> */}
        {/* <div className="ml-auto text-sm">
                {selectedRange ? (
                  <span>
                    Total released in range:{" "}
                    <span className="font-semibold">
                      {totalReleasedInRange}
                    </span>
                  </span>
                ) : (
                  <span className="text-muted-foreground">
                    Select month range to see total released.
                  </span>
                )}
              </div> */}
        {/* </div>
          </div>
        </Card> */}
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
                    {quarters.map((q) => (
                      <th
                        key={q.id}
                        colSpan={q.groups.length}
                        className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-black bg-yellow-400 border border-border/60"
                      >
                        {q.label}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-muted/60 dark:bg-white/[0.03] border-b border-border/60 dark:border-white/10 text-center">
                    {quarters.flatMap((q) =>
                      q.groups.map((g) => (
                        <th
                          key={g.id}
                          className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/50 border border-border/60"
                        >
                          {g.label}
                        </th>
                      )),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 dark:divide-white/5">
                  {paginatedRows.map((row) => (
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
                      <td className="px-3 py-2 text-center">
                        {row.newDelivery}
                      </td>
                      <td className="px-3 py-2 text-center">
                        {row.beginningStock}
                      </td>
                      <td className="px-3 py-2 text-center">{row.released}</td>
                      {quarters.flatMap((q) =>
                        q.groups.map((g) => (
                          <td
                            key={`${row.id}-${g.id}`}
                            className="px-3 py-2 text-center border-x border-border/40"
                          >
                            {formatCell(calculateGroupValue(row, g.months))}
                          </td>
                        )),
                      )}
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
                    <td className="px-3 py-2 text-center">
                      {summary.released}
                    </td>
                    {quarters.flatMap((q) =>
                      q.groups.map((g) => (
                        <td
                          key={`total-${g.id}`}
                          className="px-3 py-2 text-center border-x border-border/40"
                        >
                          {formatCell(calculateGroupValue(summary, g.months))}
                        </td>
                      )),
                    )}
                  </tr>
                </tfoot>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Pagination Controls */}
        {!loading && !error && rows.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
            <div className="text-sm text-muted-foreground order-2 sm:order-1">
              Showing{" "}
              <span className="font-medium text-foreground">
                {Math.min((currentPage - 1) * itemsPerPage + 1, rows.length)}
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {Math.min(currentPage * itemsPerPage, rows.length)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">{rows.length}</span>{" "}
              items
            </div>
            <div className="flex items-center gap-2 order-1 sm:order-2">
              <div className="flex items-center gap-2 mr-4">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  Rows per page
                </span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="h-8 w-16 rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {[5, 10, 20, 50, 100].map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  {"<"}
                </Button>
                <div className="flex items-center gap-1 px-2">
                  <span className="text-sm font-medium">{currentPage}</span>
                  <span className="text-sm text-muted-foreground">of</span>
                  <span className="text-sm font-medium">{totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="h-8 w-8 p-0"
                >
                  {">"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
