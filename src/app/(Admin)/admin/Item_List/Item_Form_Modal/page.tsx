"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Save, Check, ChevronsUpDown } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

interface Unit {
  id: number;
  name: string;
}

interface ItemFormModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function ItemFormModal({
  open,
  onClose,
  onSaved,
}: ItemFormModalProps) {
  const [units, setUnits] = useState<Unit[]>([]);
  const [newUnitName, setNewUnitName] = useState("");
  const [isSavingUnit, setIsSavingUnit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [unitOpen, setUnitOpen] = useState(false);
  const [unitSearch, setUnitSearch] = useState("");

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
      .then((data: Unit[]) => setUnits(data));
  }, [open]);

  const resetForm = () => {
    setForm({
      name: "",
      description: "",
      stockNo: "",
      unitId: "",
      unitCost: "",
      totalCost: 0,
      beginning_stock: "",
      new_delivery: "",
    });
  };

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

      const created: Unit = await res.json();
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
      const res = await fetch("/api/admin/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.toUpperCase(),
          description: form.description,
          stockNo: form.stockNo || null,
          unitId: Number(form.unitId || 0),
          unitCost: Number(form.unitCost || 0),
          totalCost: Number(form.totalCost || 0),
          beginningStock: Number(form.beginning_stock || 0),
          newDelivery: Number(form.new_delivery || 0),
        }),
      });

      if (!res.ok) return;

      resetForm();
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
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle>Insert Item</DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <div className="space-y-6">
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
                  type="number"
                  value={form.beginning_stock}
                  onChange={(e) => {
                    const value = e.target.value;
                    const qty = Number(value || 0);
                    const unitCost = Number(form.unitCost || 0);
                    setForm({
                      ...form,
                      beginning_stock: value,
                      new_delivery: value,
                      totalCost: qty * unitCost,
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
              <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-end">
                <div className="space-y-1">
                  <Popover open={unitOpen} onOpenChange={setUnitOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={unitOpen}
                        className="w-full justify-between font-normal"
                      >
                        {form.unitId
                          ? units.find((u) => String(u.id) === form.unitId)
                              ?.name
                          : "Select unit..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search unit..."
                          value={unitSearch}
                          onValueChange={setUnitSearch}
                        />
                        <CommandList>
                          <CommandEmpty>No unit found.</CommandEmpty>
                          <CommandGroup>
                            {units.map((u) => (
                              <CommandItem
                                key={u.id}
                                value={u.name}
                                onSelect={() => {
                                  setForm({ ...form, unitId: String(u.id) });
                                  setUnitOpen(false);
                                  setUnitSearch("");
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    form.unitId === String(u.id)
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {u.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
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
                type="submit"
                className="flex items-center gap-2 px-6"
                disabled={isSubmitting}
              >
                <Save size={16} /> {isSubmitting ? "Adding..." : "Add Item"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
