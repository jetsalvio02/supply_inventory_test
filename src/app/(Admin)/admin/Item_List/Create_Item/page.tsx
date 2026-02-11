"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Save } from "lucide-react";

interface Category {
  id: number;
  name: string;
}

interface Unit {
  id: number;
  name: string;
}

export default function CreateItemPage() {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [newUnitName, setNewUnitName] = useState("");
  const [isSavingUnit, setIsSavingUnit] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    stockNo: "",
    // categoryId: "",
    unitId: "",
    unitCost: "",
    beginning_stock: "",
    new_delivery: "",
  });

  useEffect(() => {
    // fetch("/api/categories")
    //   .then((r) => r.json())
    //   .then(setCategories);
    fetch("/api/admin/units")
      .then((r) => r.json())
      .then(setUnits);
  }, []);

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
    await fetch("/api/admin/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        stockNo: form.stockNo || null,
        // categoryId: Number(form.categoryId),
        unitId: Number(form.unitId || 0),
        unitCost: Number(form.unitCost || 0),
        beginningStock: Number(form.beginning_stock || 0),
        newDelivery: Number(form.new_delivery || 0),
      }),
    });

    router.push("/Item_List");
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Insert Item
            </h1>
            <p className="text-sm text-slate-600">
              Add a new item with stock details and unit of measure.
            </p>
          </div>
        </div>

        <Card className="rounded-2xl shadow-sm">
          <CardContent className="p-6 space-y-6">
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
                <Input
                  placeholder="0"
                  value={form.beginning_stock}
                  onChange={(e) => {
                    const value = e.target.value;
                    setForm({
                      ...form,
                      beginning_stock: value,
                      new_delivery: value,
                    });
                  }}
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">
                  New delivery stock
                </label>
                <Input
                  placeholder="Matches beginning stock"
                  value={form.new_delivery}
                  onChange={(e) =>
                    setForm({ ...form, new_delivery: e.target.value })
                  }
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
                  onChange={(e) =>
                    setForm({ ...form, unitCost: e.target.value })
                  }
                />
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
              <Button onClick={submit} className="flex items-center gap-2 px-6">
                <Save size={16} /> Save Item
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
