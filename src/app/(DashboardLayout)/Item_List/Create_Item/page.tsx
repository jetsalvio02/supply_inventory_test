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

  const [form, setForm] = useState({
    name: "",
    description: "",
    stockNo: "",
    categoryId: "",
    unitId: "",
    unitCost: "",
  });

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
    fetch("/api/units")
      .then((r) => r.json())
      .then(setUnits);
  }, []);

  const submit = async () => {
    await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        stockNo: form.stockNo || null,
        categoryId: Number(form.categoryId),
        unitId: Number(form.unitId),
        unitCost: Number(form.unitCost || 0),
      }),
    });

    router.push("/admin/items");
  };

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft size={16} />
        </Button>
        <h1 className="text-2xl font-bold">Insert Item</h1>
      </div>

      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-4">
          <Input
            placeholder="Item name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <Input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <Input
            placeholder="Stock No (optional)"
            value={form.stockNo}
            onChange={(e) => setForm({ ...form, stockNo: e.target.value })}
          />

          <Input
            type="number"
            step="0.01"
            placeholder="Unit Cost"
            value={form.unitCost}
            onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
          />
          {/* 
          <select
            className="w-full border rounded px-3 py-2"
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
          >
            <option value="">Select category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select> */}

          <select
            className="w-full border rounded px-3 py-2"
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

          <div className="flex justify-end">
            <Button onClick={submit} className="flex gap-2">
              <Save size={16} /> Save Item
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
