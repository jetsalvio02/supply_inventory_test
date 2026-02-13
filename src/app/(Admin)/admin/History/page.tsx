"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

interface HistoryRow {
  id: number;
  date: string;
  type: "IN" | "OUT" | "FORWARD";
  quantity: number;
  balance: number;
  remarks: string;
  performedBy: string;
  itemName: string;
}

export default function ItemTransactionHistory() {
  const [rows, setRows] = useState<HistoryRow[]>([]);

  useEffect(() => {
    fetch("/api/admin/items/stock_card?id=0")
      .then((r) => r.json())
      .then((data: any[]) => {
        // If API returns [] for id=0, we simply show empty table until integrated per-item
        setRows(
          (data ?? []).map((row: any) => ({
            id: row.id,
            date:
              typeof row.date === "string"
                ? row.date
                : new Date(row.date).toLocaleString(),
            type: row.type,
            quantity: (row.inQty ?? 0) || (row.outQty ?? 0),
            balance: row.balance ?? 0,
            remarks: row.remarks ?? "",
            performedBy: row.performedBy ?? "",
            itemName: row.itemName ?? "",
          }))
        );
      })
      .catch(() => {
        setRows([]);
      });
  }, []);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Transaction History</h2>
          <p className="text-sm text-muted-foreground">
            Complete IN / OUT / FORWARD logs for inventory items.
          </p>
        </div>
        <Button disabled className="flex items-center gap-2">
          <Plus size={16} /> New Transaction
        </Button>
      </div>

      <Card className="rounded-2xl border border-border/60 dark:border-white/5 bg-card/80 dark:bg-white/[0.03] shadow-sm">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-foreground/90">
            <thead className="bg-muted/80 dark:bg-white/[0.04] border-b border-border/60 dark:border-white/10">
              <tr>
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Date
                </th>
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Item
                </th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Type
                </th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Quantity
                </th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Balance
                </th>
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Remarks
                </th>
                <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Performed by
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 dark:divide-white/5">
              {rows.length === 0 ? (
                <tr>
                  <td
                    className="p-4 text-center text-sm text-muted-foreground"
                    colSpan={7}
                  >
                    No transaction history available yet.
                  </td>
                </tr>
              ) : (
                rows.map((tx) => (
                  <motion.tr
                    key={tx.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-background/40 dark:bg-transparent hover:bg-muted/40 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <td className="p-4 whitespace-nowrap">{tx.date}</td>
                    <td className="p-4">{tx.itemName}</td>
                    <td className="p-4">
                      <Badge
                        variant={
                          tx.type === "IN"
                            ? "default"
                            : tx.type === "OUT"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {tx.type}
                      </Badge>
                    </td>
                    <td
                      className={`p-4 font-semibold ${
                        {
                          IN: "text-green-700",
                          OUT: "text-red-700",
                          FORWARD: "text-blue-700",
                        }[tx.type]
                      }`}
                    >
                      {tx.type === "OUT" ? "-" : "+"}
                      {tx.quantity}
                    </td>
                    <td className="p-4">{tx.balance}</td>
                    <td className="p-4">{tx.remarks}</td>
                    <td className="p-4">{tx.performedBy}</td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
