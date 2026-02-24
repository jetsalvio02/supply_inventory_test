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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Swal from "sweetalert2";

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
  const queryClient = useQueryClient();
  const [newUnitName, setNewUnitName] = useState("");
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

  // Fetch units
  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ["admin-units"],
    queryFn: async () => {
      const res = await fetch("/api/admin/units");
      if (!res.ok) return [];
      return res.json();
    },
    enabled: open,
  });

  // Fetch specific item
  const { isFetching: isLoadingItem } = useQuery({
    queryKey: ["admin-item", id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/items/${id}`);
      if (!res.ok) throw new Error("Failed to load item");
      const data = await res.json();

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

      return data;
    },
    enabled: open && !!id,
    refetchOnWindowFocus: false,
  });

  // Add unit mutation
  const addUnitMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/admin/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!res.ok) throw new Error("Failed to add unit");
      return res.json();
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["admin-units"] });
      setForm((prev) => ({ ...prev, unitId: String(created.id) }));
      setNewUnitName("");
      Swal.fire({
        icon: "success",
        title: "Unit added",
        timer: 1500,
        showConfirmButton: false,
      });
    },
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/admin/items/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.toUpperCase(),
          description: form.description,
          stockNo: form.stockNo || null,
          unitId: Number(form.unitId || 0),
          unitCost: Number(form.unitCost || 0),
          totalCost: Number(form.totalCost || 0),
        }),
      });
      if (!res.ok) throw new Error("Failed to update item");
      return res.json();
    },
    onSuccess: () => {
      Swal.fire({
        icon: "success",
        title: "Item updated",
        timer: 1500,
        showConfirmButton: false,
      });
      onSaved();
      onClose();
    },
  });

  const addUnit = () => {
    const name = newUnitName.trim();
    if (!name) return;
    addUnitMutation.mutate(name);
  };

  const submit = () => {
    updateItemMutation.mutate();
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
                    <PopoverContent className="w-96 p-0" align="start">
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
                    placeholder="Or type new unit"
                    value={newUnitName}
                    onChange={(e) => setNewUnitName(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!newUnitName.trim() || addUnitMutation.isPending}
                    onClick={addUnit}
                    className="w-full shrink-0 sm:w-auto"
                  >
                    {addUnitMutation.isPending ? "Saving..." : "Add"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={submit}
                className="flex items-center gap-2 px-6"
                variant="success"
                disabled={updateItemMutation.isPending || isLoadingItem}
              >
                <Save size={16} />{" "}
                {updateItemMutation.isPending ? "Updating..." : "Update Item"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
