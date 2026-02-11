"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CreateUserPage() {
  const router = useRouter();
  const [newName, setNewName] = useState("");
  const [newId, setNewId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [scanOpen, setScanOpen] = useState(false);
  const qrRef = useRef<any>(null);

  const handleScanOpenChange = (value: boolean) => {
    setTimeout(() => {
      setScanOpen(value);
    }, 0);
  };

  const handleCreateUser = async () => {
    const trimmedName = newName.trim();
    const trimmedId = newId.trim();
    const trimmedPassword = newPassword.trim();

    if (!trimmedName || !trimmedId || !trimmedPassword) {
      alert("Please enter Name, ID, and Password.");
      return;
    }

    const numericId = Number(trimmedId);
    if (Number.isNaN(numericId)) {
      alert("ID must be a number.");
      return;
    }

    try {
      const res = await fetch("/api/admin/user/create_user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: numericId,
          name: trimmedName,
          password: trimmedPassword,
          role: "staff",
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message ?? "Failed to create user.");
        return;
      }

      alert("User created.");
      router.push("/Users");
    } catch (e) {
      alert("Network error while creating user.");
    }
  };

  useEffect(() => {
    if (!scanOpen) {
      if (qrRef.current) {
        qrRef.current
          .stop()
          .then(() => {
            qrRef.current?.clear();
            qrRef.current = null;
          })
          .catch(() => {});
      }
      return;
    }

    if (typeof window === "undefined") return;

    const timeoutId = window.setTimeout(() => {
      const element = document.getElementById("qr-reader");
      if (!element) return;

      const instance = new Html5Qrcode("qr-reader");
      qrRef.current = instance;

      instance
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          (decodedText: string) => {
            setTimeout(() => {
              setNewId(decodedText);
            }, 0);
          },
          () => {}
        )
        .catch(() => {});
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
      if (qrRef.current) {
        qrRef.current
          .stop()
          .then(() => {
            qrRef.current?.clear();
            qrRef.current = null;
          })
          .catch(() => {});
      }
    };
  }, [scanOpen, setNewId]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Create User</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a new user who can access the inventory system.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            router.push("/Users");
          }}
        >
          Back to list
        </Button>
      </div>

      <Card className="max-w-lg rounded-2xl">
        <CardContent className="space-y-4 p-6 text-sm">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground">Name</p>
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
              <Button
                type="button"
                variant="outline"
                size="sm"
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
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                router.push("/Users");
              }}
            >
              Cancel
            </Button>
            <Button variant="success" onClick={handleCreateUser}>
              Create
            </Button>
          </div>
        </CardContent>
      </Card>

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
