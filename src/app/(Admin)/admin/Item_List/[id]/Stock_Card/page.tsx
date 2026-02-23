"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";

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

interface SystemSettings {
  entityName: string | null;
  division: string | null;
  referenceIarNo: string | null;
  fundCluster: string | null;
}

interface ItemInfo {
  id: number;
  name: string;
  description: string | null;
  stockNo: string | null;
  unit: string | null;
}

export default function StockCardPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [rows, setRows] = useState<StockCardRow[]>([]);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [item, setItem] = useState<ItemInfo | null>(null);

  useEffect(() => {
    if (!id) return;

    fetch(`/api/admin/items/stock_card?id=${id}`)
      .then((r) => r.json())
      .then(setRows)
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data?.settings) {
          setSettings(data.settings);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;

    fetch("/api/admin/items")
      .then((r) => r.json())
      .then((list: any[]) => {
        const itemId = Number(id);
        const found = list.find((x) => x.id === itemId);
        if (found) {
          setItem({
            id: found.id,
            name: found.name ?? "",
            description: found.description ?? "",
            stockNo: found.stockNo ?? "",
            unit: found.unit ?? "",
          });
        }
      })
      .catch(() => {});
  }, [id]);

  const entityName = settings?.entityName ?? "";
  const division = settings?.division ?? "";
  const fundCluster = settings?.fundCluster ?? "";
  const refIarNo = settings?.referenceIarNo ?? "";

  return (
    <div className="min-h-screen bg-slate-100 p-4 flex justify-center">
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
              {item ? item.name : "\u00A0"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-28">Stock No.:</span>
            <span className="flex-1 border-b border-slate-500 leading-none">
              {item?.stockNo || "\u00A0"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-28">Description:</span>
            <span className="flex-1 border-b border-slate-500 leading-none">
              {item?.description || "\u00A0"}
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
              {item?.unit || "\u00A0"}
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
                    {isOut ? "" : ""}
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
  );
}
