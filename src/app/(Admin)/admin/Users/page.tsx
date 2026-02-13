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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import axios from "axios";

interface UserRow {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

// const INITIAL_USERS: UserRow[] = [
//   {
//     id: 1,
//     name: "Admin User",
//     email: "admin@example.com",
//     role: "Administrator",
//     status: "ACTIVE",
//     createdAt: "2026-02-01",
//   },
//   {
//     id: 2,
//     name: "Staff One",
//     email: "staff1@example.com",
//     role: "Staff",
//     status: "ACTIVE",
//     createdAt: "2026-02-05",
//   },
//   {
//     id: 3,
//     name: "Archived User",
//     email: "archived@example.com",
//     role: "Staff",
//     status: "INACTIVE",
//     createdAt: "2026-01-15",
//   },
// ];

export default function UsersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserRow[]>([]);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newId, setNewId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [newRole, setNewRole] = useState("");
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [scanOpen, setScanOpen] = useState(false);
  const isTransitioningRef = useRef(false);
  const qrRef = useRef<any>(null);

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
        u.name.toLowerCase().includes(term) || u.id.toString().includes(term)
    );
  }, [search, users]);

  const handleCreateUser = async () => {
    const trimmedName = newName.trim();
    const trimmedId = newId.trim();
    const trimmedPassword = newPassword.trim();

    if (!trimmedName || !trimmedId) {
      alert("Please enter Name and ID.");
      return;
    }

    if (!editingUser && !trimmedPassword) {
      alert("Please enter a Password for new users.");
      return;
    }

    const numericId = Number(trimmedId);
    if (Number.isNaN(numericId)) {
      alert("ID must be a number.");
      return;
    }

    try {
      if (editingUser) {
        const res = await axios.put(
          `/api/admin/user/${editingUser.id}/update_user`,
          {
            id: numericId,
            name: trimmedName,
            password: trimmedPassword || undefined,
            role: newRole || editingUser.role,
          }
        );

        const data = res.data;

        if (!data || !data.success) {
          alert(data.message ?? "Failed to update user.");
          return;
        }

        Swal.fire({
          icon: "success",
          title: "User updated",
          text: "User updated successfully.",
        });

        setUsers((prev) =>
          prev.map((u) => (u.id === editingUser.id ? data.user : u))
        );
      } else {
        const res = await fetch("/api/admin/user/create_user", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: numericId,
            name: trimmedName,
            password: trimmedPassword,
            role: newRole || undefined,
          }),
        });

        const data = await res.json();

        if (!res.ok || !data.success) {
          alert(data.message ?? "Failed to create user.");
          return;
        }

        Swal.fire({
          icon: "success",
          title: "User created",
          text: "User created successfully.",
        });

        setUsers((prev) => [...prev, data.user]);
      }

      setNewName("");
      setNewId("");
      setNewPassword("");
      setShowPassword(false);
      setEditingUser(null);
      setOpen(false);
    } catch (e) {
      alert(
        editingUser
          ? "Network error while updating user."
          : "Network error while creating user."
      );
    }
  };

  useEffect(() => {
    fetch("/api/admin/user/users_list")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setUsers(data.users);
        }
      });
  }, []);

  // useEffect(() => {
  //   if (!scanOpen) {
  //     if (qrRef.current && !isTransitioningRef.current) {
  //       isTransitioningRef.current = true;
  //       qrRef.current
  //         .stop()
  //         .then(() => {
  //           qrRef.current?.clear();
  //           qrRef.current = null;
  //         })
  //         .finally(() => {
  //           isTransitioningRef.current = false;
  //         });
  //     }
  //     return;
  //   }

  //   if (qrRef.current || isTransitioningRef.current) return;

  //   const element = document.getElementById("qr-reader");
  //   if (!element) return;

  //   const qr = new Html5Qrcode("qr-reader");
  //   qrRef.current = qr;
  //   isTransitioningRef.current = true;

  //   qr.start(
  //     { facingMode: "environment" },
  //     { fps: 10, qrbox: 250 },
  //     (decodedText) => {
  //       setNewId(decodedText);
  //     },
  //     (errorMessage) => {
  //       // alert("QR Code not found. Please try again.");
  //       console.log("QR scan error:", errorMessage);
  //     }
  //   ).finally(() => {
  //     isTransitioningRef.current = false;
  //   });

  //   return () => {
  //     if (qrRef.current && !isTransitioningRef.current) {
  //       isTransitioningRef.current = true;
  //       qrRef.current
  //         .stop()
  //         .then(() => {
  //           qrRef.current?.clear();
  //           qrRef.current = null;
  //         })
  //         .finally(() => {
  //           isTransitioningRef.current = false;
  //         });
  //     }
  //   };
  // }, [scanOpen]);

  // useEffect(() => {
  //   if (!scanOpen) {
  //     if (qrRef.current) {
  //       qrRef.current
  //         .stop()
  //         .then(() => {
  //           qrRef.current?.clear();
  //           qrRef.current = null;
  //         })
  //         .catch(() => {});
  //     }
  //     return;
  //   }

  //   if (typeof window === "undefined") return;

  //   const timeoutId = window.setTimeout(() => {
  //     const element = document.getElementById("qr-reader");
  //     if (!element) return;

  //     const instance = new Html5Qrcode("qr-reader");
  //     qrRef.current = instance;

  //     instance
  //       .start(
  //         { facingMode: "environment" },
  //         { fps: 10, qrbox: 250 },
  //         (decodedText: string) => {
  //           setTimeout(() => {
  //             setNewId(decodedText);
  //           }, 0);
  //         },
  //         () => {}
  //       )
  //       .catch(() => {});
  //   }, 0);

  //   return () => {
  //     window.clearTimeout(timeoutId);
  //     if (qrRef.current) {
  //       qrRef.current
  //         .stop()
  //         .then(() => {
  //           qrRef.current?.clear();
  //           qrRef.current = null;
  //         })
  //         .catch(() => {});
  //     }
  //   };
  // }, [scanOpen, setNewId]);

  const handleDelete = async (id: number) => {
    try {
      const res = await axios.delete(`/api/admin/user/${id}`);

      const data = res.data;

      if (!data || !data.success) {
        alert(data.message ?? "Failed to delete user.");
        return;
      }

      Swal.fire({
        icon: "success",
        title: "User deleted",
        text: "User deleted successfully.",
      });

      router.push("/Users");
    } catch (e) {
      alert("Network error while deleting user.");
    }
  };

  return (
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
              {filteredUsers.map((user) => (
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
                        variant="success"
                        onClick={() => {
                          setEditingUser(user);
                          setNewName(user.name);
                          setNewId(String(user.id));
                          setNewPassword("");
                          setShowPassword(false);
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
              <p className="text-xs font-semibold text-muted-foreground">ID</p>
              <div className="flex gap-2">
                <Input
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                  placeholder="Enter numeric ID"
                />
                {/* <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setScanOpen(true)}
                >
                  Scan QR
                </Button> */}
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
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button variant="success" onClick={handleCreateUser}>
                {editingUser ? "Update" : "Create"}
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
    </div>
  );
}
