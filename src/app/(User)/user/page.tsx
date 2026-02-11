"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import {
  ChevronsUpDown,
  FileCheck,
  GitPullRequest,
  Plus,
  Printer,
  Trash,
  TrashIcon,
} from "lucide-react";
import Swal from "sweetalert2";

interface ItemOption {
  id: number;
  name: string;
  description: string | null;
  stockNo: string | null;
  unit: string | null;
}

interface RisRow {
  id: number;
  stockNo: string;
  unit: string;
  name: string;
  description: string;
  quantity: number;
  remarks: string;
}

interface RequestRecord {
  id: number;
  createdAt: string;
  purpose: string;
  items: RisRow[];
}

export default function UserHomePage() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ItemOption[]>([]);
  const [comboOpen, setComboOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ItemOption | null>(null);
  const [rows, setRows] = useState<RisRow[]>([]);
  const [purpose, setPurpose] = useState("");
  const [requests, setRequests] = useState<RequestRecord[]>([]);

  useEffect(() => {
    fetch("/api/admin/items")
      .then((r) => r.json())
      .then((data: any[]) => {
        setItems(
          data.map((i) => ({
            id: i.id,
            name: i.name,
            description: i.description ?? "",
            stockNo: i.stockNo ?? "",
            unit: i.unit ?? "",
          }))
        );
      })
      .catch(() => {});
  }, []);

  const addRowFromItem = (item: ItemOption) => {
    setRows((prev) => {
      if (
        prev.some(
          (r) =>
            r.stockNo === (item.stockNo ?? "") && r.description === item.name
        )
      ) {
        return prev;
      }
      return [
        ...prev,
        {
          id: Date.now(),
          stockNo: item.stockNo ?? "",
          unit: item.unit ?? "",
          name: item.name ?? "",
          description: item.description ?? "",
          quantity: 0,
          remarks: "",
        },
      ];
    });
  };

  const updateRow = (rowId: number, key: keyof RisRow, value: any) => {
    setRows((prev) =>
      prev.map((r) => (r.id === rowId ? { ...r, [key]: value } : r))
    );
  };

  const removeRow = (rowId: number) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
  };

  const handleAddSelected = () => {
    if (!selectedItem) return;
    addRowFromItem(selectedItem);
    setSelectedItem(null);
  };

  const handleSubmit = () => {
    if (rows.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "Missing Items",
        text: "Please add at least one item.",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
      return;
    }

    if (!rows.every((r) => r.quantity > 0)) {
      Swal.fire({
        icon: "warning",
        title: "Quantity Required",
        text: "Please enter the quantity for all items.",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
      });
      return;
    }
    const now = new Date();
    const record: RequestRecord = {
      id: now.getTime(),
      createdAt: now.toISOString(),
      purpose,
      items: rows,
    };
    setRequests((prev) => [record, ...prev]);
    setRows([]);
    setPurpose("");
    setSelectedItem(null);
    setOpen(false);
  };

  const handleDelete = (recordId: number) => {
    setRequests((prev) => prev.filter((r) => r.id !== recordId));
  };

  return (
    <div className="space-y-8">
      <section className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Welcome to the User Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View available items and track inventory information shared with
            you.
          </p>
        </div>
        <div>
          <Button variant="success" onClick={() => setOpen(true)}>
            Request <GitPullRequest />
          </Button>
        </div>
      </section>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Request list</h2>
          {requests.length > 0 && (
            <span className="text-xs text-muted-foreground">
              Total requests: {requests.length}
            </span>
          )}
        </div>
        {requests.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No requests yet. Submit a requisition to see it here.
          </p>
        ) : (
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="bg-muted/70 text-left">
                    <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                      Ref #
                    </th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                      Date
                    </th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground">
                      Items / Quantity
                    </th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground hidden md:table-cell">
                      Purpose
                    </th>
                    <th className="px-3 py-2 text-[11px] font-semibold text-muted-foreground text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req, index) => (
                    <tr
                      key={req.id}
                      className={
                        index % 2 === 0 ? "bg-background" : "bg-muted/30"
                      }
                    >
                      <td className="px-3 py-2 align-top whitespace-nowrap text-[11px] md:text-xs">
                        {req.id}
                      </td>
                      <td className="px-3 py-2 align-top whitespace-nowrap text-[11px] md:text-xs">
                        {new Date(req.createdAt).toLocaleString()}
                      </td>
                      <td className="px-3 py-2 align-top">
                        <div className="space-y-0.5">
                          {req.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-2 text-[11px] md:text-xs"
                            >
                              <span className="truncate">
                                {`${item.name} (${item.description})`}
                                <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px]">
                                  {item.quantity}
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-top text-[11px] md:text-xs hidden md:table-cell">
                        {req.purpose}
                      </td>
                      <td className="px-3 py-2 align-top text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="icon"
                            variant="destructive"
                            className="h-7 w-7"
                            onClick={() => handleDelete(req.id)}
                          >
                            <Trash className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="success"
                            className="h-7 w-7"
                          >
                            <Printer className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-center">
              REQUISITION AND ISSUE SLIP
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 text-xs">
            <p className="font-semibold text-sm">Items:</p>
            <div className="flex items-center gap-2">
              {/* <span className="font-semibold text-xs">Item:</span> */}
              <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-80 justify-between"
                  >
                    {selectedItem
                      ? `${
                          selectedItem.stockNo
                            ? selectedItem.stockNo + " - "
                            : ""
                        }${
                          selectedItem.name +
                          (selectedItem.description
                            ? ` (${selectedItem.description})`
                            : "")
                        }`
                      : "Search item..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Command>
                    <CommandInput placeholder="Search item..." />
                    <CommandEmpty>No item found.</CommandEmpty>
                    <CommandList>
                      <CommandGroup>
                        {items.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={`${item.stockNo ?? ""} (${item.name} ${
                              item.description ? `(${item.description})` : ""
                            })`}
                            onSelect={() => {
                              setSelectedItem(item);
                              setComboOpen(false);
                            }}
                          >
                            <span className="flex-1">
                              {item.stockNo ? `${item.stockNo} - ` : ""}
                              {item.name}{" "}
                              {item.description ? `(${item.description})` : ""}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {item.unit}
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <Button size="sm" onClick={handleAddSelected}>
                Add <Plus className=" h-4 w-4 shrink-0" />
              </Button>
            </div>
            <div>
              <p className="font-semibold text-sm">Purpose:</p>
              <Textarea
                className="w-full h-12 rounded-md border border-border px-2 py-1"
                placeholder=""
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
              />
            </div>
            <div className="text-right">
              <Button variant="success" onClick={handleSubmit}>
                Submit <FileCheck className="ml-2 h-4 w-4 shrink-0" />
              </Button>
            </div>
          </div>

          <table className="w-full text-xs border border-border">
            <thead>
              <tr className="bg-muted text-center">
                <th className="border border-border px-2 py-1 w-24">
                  Stock No.
                </th>
                <th className="border border-border px-2 py-1 w-24">Unit</th>
                <th className="border border-border px-2 py-1">Description</th>
                <th className="border border-border px-2 py-1 w-24">
                  Quantity
                </th>
                <th className="border border-border px-2 py-1 w-24">Remarks</th>
                <th className="border border-border px-2 py-1 w-16">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="border border-border px-1 py-1">
                    <Input
                      className="h-7 rounded-none"
                      value={row.stockNo}
                      onChange={(e) =>
                        updateRow(row.id, "stockNo", e.target.value)
                      }
                    />
                  </td>
                  <td className="border border-border px-1 py-1">
                    <Input
                      className="h-7 rounded-none"
                      value={row.unit}
                      onChange={(e) =>
                        updateRow(row.id, "unit", e.target.value)
                      }
                    />
                  </td>
                  <td className="border border-border px-1 py-1">
                    <Input
                      className="h-7 rounded-none"
                      value={`${row.name} (${row.description})`}
                      onChange={(e) =>
                        updateRow(row.id, "description", e.target.value)
                      }
                    />
                  </td>
                  <td className="border border-border px-1 py-1">
                    <Input
                      type="number"
                      className="h-7 rounded-none"
                      value={row.quantity === 0 ? "" : row.quantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        const num =
                          val === ""
                            ? 0
                            : Number.isNaN(Number(val))
                            ? 0
                            : Number(val);
                        updateRow(row.id, "quantity", num);
                      }}
                    />
                  </td>
                  <td className="border border-border px-1 py-1">
                    <Input
                      className="h-7 rounded-none"
                      value={row.remarks}
                      onChange={(e) =>
                        updateRow(row.id, "remarks", e.target.value)
                      }
                    />
                  </td>
                  <td className="border border-border px-1 py-1 text-center">
                    <Button
                      size="icon"
                      variant="destructive"
                      className="h-7 w-7 text-xs text-black"
                      onClick={() => removeRow(row.id)}
                    >
                      <TrashIcon />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DialogContent>
      </Dialog>
    </div>
  );
}
