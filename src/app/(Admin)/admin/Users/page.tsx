"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Edit3Icon,
  TrashIcon,
  EyeOffIcon,
  EyeIcon,
  QrCode,
  Download,
} from "lucide-react";
import QRCode from "qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import axios from "axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface UserRow {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  officeHead: string | null;
  officeHeadDepartment: string | null;
  createdAt: string;
}

const toTitleCase = (value: string) => {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
};

function Combobox({
  options,
  value,
  onSelect,
  placeholder,
  open,
  onOpenChange,
}: {
  options: { id: number; name: string }[];
  value: string;
  onSelect: (val: string) => void;
  placeholder: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOptions = options.filter((opt) =>
    opt.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const showAddOption =
    searchQuery.length > 0 &&
    !options.some(
      (opt) => opt.name.toLowerCase() === searchQuery.toLowerCase(),
    );

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search..."
            value={searchQuery}
            onValueChange={(val) => setSearchQuery(toTitleCase(val))}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {filteredOptions.map((opt) => (
                <CommandItem
                  key={opt.id}
                  value={opt.name}
                  onSelect={(cur) => {
                    onSelect(cur);
                    onOpenChange(false);
                    setSearchQuery("");
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === opt.name ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {opt.name}
                </CommandItem>
              ))}
              {showAddOption && (
                <CommandItem
                  value={searchQuery}
                  onSelect={(cur) => {
                    onSelect(cur);
                    onOpenChange(false);
                    setSearchQuery("");
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add "{searchQuery}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default function UsersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newId, setNewId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [department, setDepartment] = useState("");
  const [officeHead, setOfficeHead] = useState("");
  const [officeHeadDepartment, setOfficeHeadDepartment] = useState("");

  const [deptOpen, setDeptOpen] = useState(false);
  const [headOpen, setHeadOpen] = useState(false);
  const [headDeptOpen, setHeadDeptOpen] = useState(false);

  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const [qrUser, setQrUser] = useState<UserRow | null>(null);
  const [qrImageUrl, setQrImageUrl] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const isTransitioningRef = useRef(false);
  const qrRef = useRef<any>(null);

  const { data: departmentsData = [] } = useQuery<
    { id: number; name: string }[]
  >({
    queryKey: ["all-departments"],
    queryFn: async () => {
      const res = await fetch("/api/user/departments");
      if (!res.ok) return [];
      const data = await res.json();
      return data?.success ? data.departments : [];
    },
  });

  const { data: officeHeadsData = [] } = useQuery<
    { id: number; name: string }[]
  >({
    queryKey: ["all-office-heads"],
    queryFn: async () => {
      const res = await fetch("/api/user/office_heads");
      if (!res.ok) return [];
      const data = await res.json();
      return data?.success ? data.officeHeads : [];
    },
  });

  const { data: users = [] } = useQuery<UserRow[]>({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await fetch("/api/admin/user/users_list");
      if (!res.ok) {
        throw new Error("Failed to load users");
      }
      const data = await res.json();
      if (!data?.success || !Array.isArray(data.users)) {
        return [];
      }
      return data.users as UserRow[];
    },
  });

  const handleScanOpenChange = (value: boolean) => {
    setTimeout(() => {
      setScanOpen(value);
    }, 0);
  };

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return users;
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(term) ||
        u.id.toLowerCase().includes(term),
    );
  }, [search, users]);

  const totalPages = useMemo(() => {
    if (!filteredUsers.length) return 1;
    return Math.ceil(filteredUsers.length / pageSize);
  }, [filteredUsers.length, pageSize]);

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedUsers = useMemo(
    () => [...filteredUsers].reverse().slice(startIndex, endIndex),
    [filteredUsers, startIndex, endIndex],
  );

  const handleCreateUser = async () => {
    const trimmedName = newName.trim();
    const trimmedId = newId.trim();
    const trimmedPassword = newPassword.trim();

    if (!trimmedName || !trimmedId) {
      // alert("Please enter Name and ID.");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please enter Name and ID.",
      });
      return;
    }

    if (!editingUser && !trimmedPassword) {
      // alert("Please enter a Password for new users.");
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Please enter a Password for new users.",
      });
      return;
    }

    if (!/^\d+$/.test(trimmedId)) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "ID must contain only digits.",
      });
      return;
    }

    try {
      setSaving(true);

      if (editingUser) {
        const res = await axios.put(
          `/api/admin/user/${editingUser.id}/update_user`,
          {
            id: trimmedId,
            name: trimmedName,
            password: trimmedPassword || undefined,
            role: newRole || editingUser.role,
            department: department.trim(),
            officeHead: officeHead.trim(),
            officeHeadDepartment: officeHeadDepartment.trim(),
          },
          {
            validateStatus: () => true,
          },
        );

        const data = res.data;

        if (!data || !data.success) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: data.message ?? "Failed to update user.",
            timer: 2000,
            timerProgressBar: false,
            showConfirmButton: false,
          });
          return;
        }

        Swal.fire({
          icon: "success",
          title: "User updated",
          text: "User updated successfully.",
          timer: 2000,
          timerProgressBar: false,
          showConfirmButton: false,
        });

        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      } else {
        const res = await fetch("/api/admin/user/create_user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: trimmedId,
            name: trimmedName,
            password: trimmedPassword,
            role: newRole || undefined,
            department: department.trim(),
            officeHead: officeHead.trim(),
            officeHeadDepartment: officeHeadDepartment.trim(),
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: data.message ?? "Failed to create user.",
            timer: 2000,
            timerProgressBar: false,
            showConfirmButton: false,
          });
          return;
        }

        Swal.fire({
          icon: "success",
          title: "User created",
          text: "User created successfully.",
          timer: 2000,
          timerProgressBar: false,
          showConfirmButton: false,
        });

        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      }

      setNewName("");
      setNewId("");
      setNewPassword("");
      setShowPassword(false);
      setDepartment("");
      setOfficeHead("");
      setOfficeHeadDepartment("");
      setEditingUser(null);
      setOpen(false);
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: editingUser
          ? "Network error while updating user."
          : "Network error while creating user.",
        timer: 2000,
        timerProgressBar: false,
        showConfirmButton: false,
      });
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!scanOpen) return;

    let scannerInstance: Html5Qrcode | null = null;
    let isStarting = false;

    const startScanner = async () => {
      if (isStarting) return;
      isStarting = true;

      // Small delay to ensure the DOM element "qr-reader" is rendered by Dialog
      await new Promise((resolve) => setTimeout(resolve, 150));

      const element = document.getElementById("qr-reader");
      if (!element) {
        isStarting = false;
        return;
      }

      try {
        const instance = new Html5Qrcode("qr-reader");
        scannerInstance = instance;
        qrRef.current = instance;

        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          (decodedText: string) => {
            setNewId(decodedText);
            setScanOpen(false); // This triggers the cleanup function below
            Swal.fire({
              icon: "success",
              title: "Scanned",
              text: `ID: ${decodedText}`,
              timer: 1500,
              showConfirmButton: false,
            });
          },
          () => {},
        );
      } catch (err) {
        console.error("QR Scanner failed to start:", err);
      } finally {
        isStarting = false;
      }
    };

    startScanner();

    return () => {
      if (scannerInstance) {
        // Use a local reference to avoid race conditions with qrRef.current
        const toStop = scannerInstance;
        scannerInstance = null;
        qrRef.current = null;

        toStop
          .stop()
          .then(() => {
            toStop.clear();
          })
          .catch((err) => {
            console.debug(
              "Scanner stop error (safe to ignore if already stopped):",
              err,
            );
          });
      }
    };
  }, [scanOpen]);

  useEffect(() => {
    if (qrUser) {
      QRCode.toDataURL(String(qrUser.id), { width: 400, margin: 2 })
        .then((url) => setQrImageUrl(url))
        .catch((err) => console.error("QR Generation Error:", err));
    } else {
      setQrImageUrl("");
    }
  }, [qrUser]);

  const handleDownloadQR = () => {
    if (!qrImageUrl || !qrUser) return;

    // Create a canvas to combine text and QR code
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const qrSize = 400;
    const padding = 20;
    const textHeight = 60;

    canvas.width = qrSize + padding * 2;
    canvas.height = qrSize + textHeight + padding * 2;

    // Draw white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw ID Text
    ctx.fillStyle = "black";
    ctx.font = "bold 24px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(
      `Name: ${qrUser.name}\nID: ${qrUser.id}`,
      canvas.width / 2,
      padding + 30,
    );

    // Draw QR Code
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      ctx.drawImage(img, padding, padding + textHeight, qrSize, qrSize);

      // Download combined image
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `QR_${qrUser.id}_${qrUser.name.replace(/\s+/g, "_")}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
    img.src = qrImageUrl;
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await axios.delete(`/api/admin/user/${id}`, {
        validateStatus: () => true,
      });

      const data = res.data;

      if (!data || !data.success) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data?.message ?? "Failed to delete user.",
          timer: 2000,
          timerProgressBar: false,
          showConfirmButton: false,
        });
        return;
      }

      Swal.fire({
        icon: "success",
        title: "User deleted",
        text: "User deleted successfully.",
        timer: 2000,
        timerProgressBar: false,
        showConfirmButton: false,
      });

      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Network error while deleting user.",
        timer: 2000,
        timerProgressBar: false,
        showConfirmButton: false,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background px-3 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6 rounded-2xl">
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Users List</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View users who can access the inventory system.
            </p>
          </div>
          <Button
            className="flex items-center gap-2"
            onClick={() => {
              setEditingUser(null);
              setNewName("");
              setNewId("");
              setNewPassword("");
              setShowPassword(false);
              setNewRole("");
              setDepartment("");
              setOfficeHead("");
              setOfficeHeadDepartment("");
              setOpen(true);
            }}
          >
            <Plus size={16} />
            New User
          </Button>
        </div>
        <Card className="rounded-2xl">
          <CardContent className="flex flex-col gap-4 p-4 md:flex-row">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-3 text-muted-foreground"
                size={16}
              />
              <Input
                placeholder="Search by name, id ..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border border-border/60 dark:border-white/5 bg-card/80 dark:bg-white/[0.03] shadow-sm">
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full text-sm text-foreground/90">
              <thead className="bg-muted/80 dark:bg-white/[0.04] border-b border-border/60 dark:border-white/10">
                <tr>
                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Name
                  </th>
                  <th className="p-4 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    ID
                  </th>
                  <th className="p-4 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 dark:divide-white/5">
                {paginatedUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="text-sm bg-background/40 dark:bg-transparent hover:bg-muted/40 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <td className="p-4 font-medium">{user.name}</td>
                    <td className="p-4">{user.id}</td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="icon"
                          onClick={() => setQrUser(user)}
                          title="Generate QR"
                        >
                          <QrCode size={14} />
                        </Button>
                        <Button
                          size="icon"
                          variant="success"
                          onClick={() => {
                            setEditingUser(user);
                            setNewName(user.name);
                            setNewId(String(user.id));
                            setNewPassword("");
                            setShowPassword(false);
                            setNewRole(user.role);
                            setDepartment(user.department || "");
                            setOfficeHead(user.officeHead || "");
                            setOfficeHeadDepartment(
                              user.officeHeadDepartment || "",
                            );
                            setOpen(true);
                          }}
                        >
                          <Edit3Icon size={14} />
                        </Button>
                        <Button
                          size="icon"
                          onClick={() => handleDelete(user.id)}
                          variant="destructive"
                        >
                          <TrashIcon size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td
                      className="p-6 text-center text-sm text-muted-foreground"
                      colSpan={6}
                    >
                      No users found for the current search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </CardContent>
        </Card>
        {filteredUsers.length > 0 && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs md:text-sm">
            <div>
              Showing{" "}
              {`${Math.min(startIndex + 1, filteredUsers.length)}-${Math.min(
                endIndex,
                filteredUsers.length,
              )}`}{" "}
              of {filteredUsers.length} users
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              >
                Previous
              </Button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
              >
                Next
              </Button>
            </div>
          </div>
        )}
        <Dialog
          open={open}
          onOpenChange={(value) => {
            setOpen(value);
            if (!value) {
              setEditingUser(null);
              setNewName("");
              setNewId("");
              setNewPassword("");
              setShowPassword(false);
              setNewRole("");
              setDepartment("");
              setOfficeHead("");
              setOfficeHeadDepartment("");
            }
          }}
        >
          <DialogContent className="max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Edit user" : "Create new user"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">
                  Name
                </p>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">
                  ID
                </p>
                <div className="flex gap-2">
                  <Input
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    placeholder="Enter numeric ID"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0"
                    onClick={() => setScanOpen(true)}
                  >
                    Scan QR
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">
                  Password
                </p>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter password"
                    className="pr-16"
                  />
                  <Button
                    type="button"
                    variant="ghostprimary"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 px-2 text-xs"
                    onClick={() => setShowPassword((prev) => !prev)}
                  >
                    {showPassword ? (
                      <EyeOffIcon size={14} />
                    ) : (
                      <EyeIcon size={14} />
                    )}
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">
                  User Role
                </p>
                <Select
                  value={newRole || (editingUser ? editingUser.role : "")}
                  onValueChange={(value) => setNewRole(value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">
                  Department
                </p>
                <Combobox
                  options={departmentsData}
                  value={department}
                  onSelect={setDepartment}
                  placeholder="Select department..."
                  open={deptOpen}
                  onOpenChange={setDeptOpen}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">
                  Office Head
                </p>
                <Combobox
                  options={officeHeadsData}
                  value={officeHead}
                  onSelect={setOfficeHead}
                  placeholder="Select office head..."
                  open={headOpen}
                  onOpenChange={setHeadOpen}
                />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground">
                  Office Head Department
                </p>
                <Combobox
                  options={departmentsData}
                  value={officeHeadDepartment}
                  onSelect={setOfficeHeadDepartment}
                  placeholder="Select office head department..."
                  open={headDeptOpen}
                  onOpenChange={setHeadDeptOpen}
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setOpen(false);
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  variant="success"
                  onClick={handleCreateUser}
                  disabled={saving}
                >
                  {saving
                    ? editingUser
                      ? "Updating..."
                      : "Creating..."
                    : editingUser
                      ? "Update"
                      : "Create"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={scanOpen} onOpenChange={handleScanOpenChange}>
          <DialogContent className="max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle>Scan ID QR</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 text-sm">
              <p className="text-xs text-muted-foreground">
                Point the camera at the ID QR code.
              </p>
              <div
                id="qr-reader"
                className="w-full aspect-square rounded-md border border-border"
              />
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!qrUser} onOpenChange={(val) => !val && setQrUser(null)}>
          <DialogContent className="max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle>User ID QR Code</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-6 py-4">
              <div className="text-center space-y-1">
                <p className="font-bold text-lg">{qrUser?.name}</p>
                <p className="text-sm text-muted-foreground">
                  ID: {qrUser?.id}
                </p>
              </div>

              {qrImageUrl ? (
                <div className="bg-white p-4 rounded-xl shadow-inner inline-block">
                  <img
                    src={qrImageUrl}
                    alt="QR Code"
                    className="w-48 h-48 sm:w-64 sm:h-64"
                  />
                </div>
              ) : (
                <div className="w-64 h-64 flex items-center justify-center bg-muted rounded-xl animate-pulse">
                  Generating...
                </div>
              )}

              <Button
                className="w-full flex items-center gap-2"
                onClick={handleDownloadQR}
                disabled={!qrImageUrl}
              >
                <Download size={16} />
                Download QR Image
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
