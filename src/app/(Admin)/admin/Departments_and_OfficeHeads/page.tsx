"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Plus, Edit3Icon, TrashIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import Swal from "sweetalert2";
import axios from "axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Entity {
  id: number;
  name: string;
  createdAt: string;
}

export default function DepartmentsAndOfficeHeadsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("departments");
  const [searchTerm, setSearchTerm] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Queries
  const { data: departments = [], isLoading: isLoadingDepts } = useQuery<
    Entity[]
  >({
    queryKey: ["admin-departments"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/departments");
      return res.data?.success ? res.data.departments : [];
    },
  });

  const { data: officeHeads = [], isLoading: isLoadingHeads } = useQuery<
    Entity[]
  >({
    queryKey: ["admin-office-heads"],
    queryFn: async () => {
      const res = await axios.get("/api/admin/office_heads");
      return res.data?.success ? res.data.officeHeads : [];
    },
  });

  // Mutations
  const mutationDept = useMutation({
    mutationFn: async (data: {
      id?: number;
      name: string;
      method: "POST" | "PUT" | "DELETE";
    }) => {
      if (data.method === "POST")
        return axios.post("/api/admin/departments", { name: data.name });
      if (data.method === "PUT")
        return axios.put(`/api/admin/departments/${data.id}`, {
          name: data.name,
        });
      if (data.method === "DELETE")
        return axios.delete(`/api/admin/departments/${data.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-departments"] });
    },
  });

  const mutationHead = useMutation({
    mutationFn: async (data: {
      id?: number;
      name: string;
      method: "POST" | "PUT" | "DELETE";
    }) => {
      if (data.method === "POST")
        return axios.post("/api/admin/office_heads", { name: data.name });
      if (data.method === "PUT")
        return axios.put(`/api/admin/office_heads/${data.id}`, {
          name: data.name,
        });
      if (data.method === "DELETE")
        return axios.delete(`/api/admin/office_heads/${data.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-office-heads"] });
    },
  });

  const currentData = activeTab === "departments" ? departments : officeHeads;
  const currentMutation =
    activeTab === "departments" ? mutationDept : mutationHead;
  const isLoading =
    activeTab === "departments" ? isLoadingDepts : isLoadingHeads;

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return currentData;
    return currentData.filter((item) => item.name.toLowerCase().includes(term));
  }, [searchTerm, currentData]);

  const toTitleCase = (value: string) => {
    return value.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleSave = async () => {
    if (!newName.trim()) {
      Swal.fire("Error", "Name is required", "error");
      return;
    }

    setIsSaving(true);
    try {
      const res = await currentMutation.mutateAsync({
        id: editingEntity?.id,
        name: toTitleCase(newName.trim()),
        method: editingEntity ? "PUT" : "POST",
      });

      if (res?.data?.success) {
        Swal.fire({
          icon: "success",
          title: "Saved",
          text: `Successfully ${editingEntity ? "updated" : "created"}.`,
          timer: 1500,
          showConfirmButton: false,
        });
        setOpenDialog(false);
        setEditingEntity(null);
        setNewName("");
      } else {
        Swal.fire(
          "Error",
          res?.data?.message || "Something went wrong",
          "error",
        );
      }
    } catch (err: any) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "Network error",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const res = await currentMutation.mutateAsync({
          id,
          name: "",
          method: "DELETE",
        });
        if (res?.data?.success) {
          Swal.fire("Deleted!", "Record has been deleted.", "success");
        } else {
          Swal.fire("Error", res?.data?.message || "Failed to delete", "error");
        }
      } catch (err: any) {
        Swal.fire("Error", "Network error while deleting", "error");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background px-3 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6 rounded-2xl">
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Departments & Office Heads</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage the organization structure and leadership.
            </p>
          </div>
          <Button
            className="flex items-center gap-2"
            onClick={() => {
              setEditingEntity(null);
              setNewName("");
              setOpenDialog(true);
            }}
          >
            <Plus size={16} />
            New {activeTab === "departments" ? "Department" : "Office Head"}
          </Button>
        </div>

        <Tabs
          defaultValue="departments"
          onValueChange={(val) => {
            setActiveTab(val);
            setSearchTerm("");
          }}
        >
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="departments">Departments</TabsTrigger>
            <TabsTrigger value="office_heads">Office Heads</TabsTrigger>
          </TabsList>

          <Card className="mt-6 rounded-2xl">
            <CardContent className="flex flex-col gap-4 p-4 md:flex-row">
              <div className="relative flex-1">
                <Search
                  className="absolute left-3 top-3 text-muted-foreground"
                  size={16}
                />
                <Input
                  placeholder={`Search ${activeTab === "departments" ? "department" : "office head"} name...`}
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <TabsContent value="departments" className="space-y-4">
            {/* Shared Table Logic */}
            <EntityTable
              data={filteredData}
              isLoading={isLoading}
              onEdit={(item) => {
                setEditingEntity(item);
                setNewName(item.name);
                setOpenDialog(true);
              }}
              onDelete={handleDelete}
            />
          </TabsContent>

          <TabsContent value="office_heads" className="space-y-4">
            <EntityTable
              data={filteredData}
              isLoading={isLoading}
              onEdit={(item) => {
                setEditingEntity(item);
                setNewName(item.name);
                setOpenDialog(true);
              }}
              onDelete={handleDelete}
            />
          </TabsContent>
        </Tabs>

        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingEntity ? "Edit" : "Create"}{" "}
                {activeTab === "departments" ? "Department" : "Office Head"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Name</p>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(toTitleCase(e.target.value))}
                  placeholder="Enter name"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpenDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function EntityTable({
  data,
  isLoading,
  onEdit,
  onDelete,
}: {
  data: Entity[];
  isLoading: boolean;
  onEdit: (item: Entity) => void;
  onDelete: (id: number) => void;
}) {
  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">Loading...</div>
    );
  }

  return (
    <Card className="rounded-2xl border border-border/60 dark:border-white/5 bg-card/80 dark:bg-white/[0.03] shadow-sm">
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm text-foreground/90">
          <thead className="bg-muted/80 dark:bg-white/[0.04] border-b border-border/60 dark:border-white/10">
            <tr>
              <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Name
              </th>
              <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Created At
              </th>
              <th className="p-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60 dark:divide-white/5">
            {data.map((item) => (
              <tr
                key={item.id}
                className="text-sm bg-background/40 dark:bg-transparent hover:bg-muted/40 dark:hover:bg-white/[0.06] transition-colors"
              >
                <td className="p-4 font-medium">{item.name}</td>
                <td className="p-4 text-muted-foreground">
                  {new Date(item.createdAt).toLocaleDateString()}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => onEdit(item)}
                    >
                      <Edit3Icon size={14} />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => onDelete(item.id)}
                    >
                      <TrashIcon size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr>
                <td
                  className="p-12 text-center text-sm text-muted-foreground"
                  colSpan={3}
                >
                  No records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
