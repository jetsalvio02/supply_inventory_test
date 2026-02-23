"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save } from "lucide-react";

interface Unit {
  id: number;
  name: string;
}

interface EditItemModalProps {
  open: boolean;
  id: number;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditItemModal({
  open,
  id,
  onClose,
  onSaved,
}: EditItemModalProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [newUnitName, setNewUnitName] = useState("");
  const [isSavingUnit, setIsSavingUnit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    stockNo: "",
    unitId: "",
    unitCost: "",
    totalCost: 0,
    beginning_stock: "",
    new_delivery: "",
  });

  useEffect(() => {
    if (!open) return;

    fetch("/api/admin/units")
      .then((r) => r.json())
      .then(setUnits);

    const loadItem = async () => {
      try {
        const res = await fetch(`/api/admin/items/${id}`);
        if (!res.ok) {
          return;
        }

        const data = await res.json().catch(() => null);
        if (!data) return;

        const qty = data.beginingStock ? Number(data.beginingStock) : 0;
        const unitCostNum = data.unitCost ? Number(data.unitCost) : 0;

        setForm({
          name: data.name ?? "",
          description: data.description ?? "",
          stockNo: data.stockNo ?? "",
          unitId: data.unitId ? String(data.unitId) : "",
          unitCost: data.unitCost ? String(data.unitCost) : "",
          totalCost: qty * unitCostNum,
          beginning_stock: data.beginingStock ? String(data.beginingStock) : "",
          new_delivery: data.newDeliveryStock
            ? String(data.newDeliveryStock)
            : "",
        });
      } catch {}
    };

    loadItem();
  }, [open, id]);

  const addUnit = async () => {
    const name = newUnitName.trim();
    if (!name) return;

    setIsSavingUnit(true);
    try {
      const res = await fetch("/api/admin/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) return;

      const created = await res.json();
      setUnits((prev) => {
        const exists = prev.find((u) => u.id === created.id);
        if (exists) return prev;
        return [...prev, created].sort((a, b) => a.name.localeCompare(b.name));
      });
      setForm((prev) => ({ ...prev, unitId: String(created.id) }));
      setNewUnitName("");
    } finally {
      setIsSavingUnit(false);
    }
  };

  const submit = async () => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          stockNo: form.stockNo || null,
          unitId: Number(form.unitId || 0),
          unitCost: Number(form.unitCost || 0),
          totalCost: Number(form.totalCost || 0),
        }),
      });

      if (!res.ok) return;

      onSaved();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) onClose();
      }}
    >
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl p-0">
        <Card className="rounded-2xl shadow-none border-0">
          <CardContent className="p-6 space-y-6">
            <DialogHeader className="px-0">
              <DialogTitle>Edit Item</DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">
                  Item name
                </label>
                <Input
                  placeholder="Enter item name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">
                  Description
                </label>
                <Input
                  placeholder="Short description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Beginning stock
                </label>
                <Input placeholder="0" value={form.beginning_stock} disabled />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  New delivery stock
                </label>
                <Input
                  placeholder="Matches beginning stock"
                  value={form.new_delivery}
                  disabled
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Stock No (optional)
                </label>
                <Input
                  placeholder="Reference or catalog number"
                  value={form.stockNo}
                  onChange={(e) =>
                    setForm({ ...form, stockNo: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  Unit cost
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.unitCost}
                  onChange={(e) => {
                    const unitCostValue = e.target.value;
                    const qty = Number(form.beginning_stock || 0);
                    const unitCost = Number(unitCostValue || 0);
                    setForm({
                      ...form,
                      unitCost: unitCostValue,
                      totalCost: qty * unitCost,
                    });
                  }}
                />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">
                    Total cost
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={form.totalCost}
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">
                Unit of measure
              </label>
              <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
                <select
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none ring-offset-background transition focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                  value={form.unitId}
                  onChange={(e) => setForm({ ...form, unitId: e.target.value })}
                >
                  <option value="">Select unit</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    placeholder="Or type new unit (e.g. box, piece)"
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!newUnitName.trim() || isSavingUnit}
                    onClick={addUnit}
                    className="w-full shrink-0 sm:w-auto"
                  >
                    {isSavingUnit ? "Saving..." : "Add"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={submit}
                className="flex items-center gap-2 px-6"
                variant="success"
                disabled={isSubmitting}
              >
                <Save size={16} />{" "}
                {isSubmitting ? "Updating..." : "Update Item"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
