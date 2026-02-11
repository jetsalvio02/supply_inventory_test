"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

/**
 * Inventory Transaction History UI
 * Aligned with inventory_transactions schema
 */
export default function ItemTransactionHistory() {
  const transactions = [
    {
      id: 1,
      type: "IN",
      quantity: 50,
      remarks: "New delivery from supplier",
      createdAt: "2026-02-03 09:30",
    },
    {
      id: 2,
      type: "OUT",
      quantity: 20,
      remarks: "Released to office",
      createdAt: "2026-02-03 13:10",
    },
    {
      id: 3,
      type: "FORWARD",
      quantity: 30,
      remarks: "Forwarded balance from January",
      createdAt: "2026-02-01 08:00",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Transaction History</h2>
          <p className="text-sm text-muted-foreground">
            Complete IN / OUT / FORWARD logs for this item
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus size={16} /> New Transaction
        </Button>
      </div>

      {/* Transactions Table */}
      <Card className="rounded-2xl">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-4 text-left">Date</th>
                <th className="p-4">Type</th>
                <th className="p-4">Quantity</th>
                <th className="p-4 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <motion.tr
                  key={tx.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="border-b hover:bg-muted/50"
                >
                  <td className="p-4">{tx.createdAt}</td>
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
                  <td className="p-4">{tx.remarks}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
