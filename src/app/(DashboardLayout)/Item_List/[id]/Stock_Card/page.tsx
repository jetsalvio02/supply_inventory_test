"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDown, ArrowUp, RotateCcw } from "lucide-react";

interface StockCardRow {
  id: number;
  date: string;
  type: "IN" | "OUT" | "FORWARD";
  inQty: number;
  outQty: number;
  balance: number;
  remarks?: string;
  performedBy: string;
}

export default function StockCardPage({ params }: { params: { id: string } }) {
  const [rows, setRows] = useState<StockCardRow[]>([]);

  useEffect(() => {
    fetch(`/api/items/${params.id}/stock-card`)
      .then((r) => r.json())
      .then(setRows);
  }, [params.id]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Stock Card</h1>
        <p className="text-sm text-muted-foreground">
          Complete inventory ledger (audit trail)
        </p>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="p-4 text-left">Date</th>
                <th className="p-4 text-left">Transaction</th>
                <th className="p-4">IN</th>
                <th className="p-4">OUT</th>
                <th className="p-4">Balance</th>
                <th className="p-4 text-left">Remarks</th>
                <th className="p-4 text-left">By</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b hover:bg-muted/50">
                  <td className="p-4">
                    {new Date(r.date).toLocaleDateString()}
                  </td>

                  <td className="p-4">
                    <Badge
                      variant={
                        r.type === "IN"
                          ? "default"
                          : r.type === "OUT"
                            ? "destructive"
                            : "secondary"
                      }
                      className="flex w-fit gap-1"
                    >
                      {r.type === "IN" && <ArrowDown size={12} />}
                      {r.type === "OUT" && <ArrowUp size={12} />}
                      {r.type === "FORWARD" && <RotateCcw size={12} />}
                      {r.type}
                    </Badge>
                  </td>

                  <td className="p-4 text-center text-green-700">
                    {r.inQty || "-"}
                  </td>

                  <td className="p-4 text-center text-red-700">
                    {r.outQty || "-"}
                  </td>

                  <td className="p-4 text-center font-semibold">{r.balance}</td>

                  <td className="p-4">{r.remarks ?? "-"}</td>
                  <td className="p-4">{r.performedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
