"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { number } from "framer-motion";
import Swal from "sweetalert2";

export default function AdminSettingsPage() {
  const [entityName, setEntityName] = useState("");
  const [division, setDivision] = useState("");
  const [referenceIarNo, setReferenceIarNo] = useState("");
  const [fundCluster, setFundCluster] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (!res.ok) return;
        const data = await res.json();
        const s = data?.settings;
        if (!s) return;
        setEntityName(s.entityName ?? "");
        setDivision(s.division ?? "");
        setReferenceIarNo(s.referenceIarNo ?? "");
        setFundCluster(s.fundCluster ?? "");
      } catch {}
    };
    load();
  }, []);

  const handleSave = async () => {
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entityName,
          division,
          referenceIarNo,
          fundCluster,
        }),
      });

      if (!res.ok) {
        if (typeof window !== "undefined") {
          // window.alert("Failed to save settings.");
          Swal.fire({
            icon: "error",
            showConfirmButton: false,
            timer: 1500,
            title: "Failed to save settings.",
          });
        }
        return;
      }

      if (typeof window !== "undefined") {
        // window.alert("Settings saved.");
        Swal.fire({
          icon: "success",
          title: "Settings saved.",
          showConfirmButton: false,
          timer: 1500,
        });
      }
    } catch {
      if (typeof window !== "undefined") {
        // window.alert("Failed to save settings.");
        Swal.fire({
          icon: "error",
          showConfirmButton: false,
          timer: 1500,
          title: "Failed to save settings.",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background px-3 py-4 sm:px-6 sm:py-6 space-y-4 sm:space-y-6 rounded-2xl">
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage system preferences and basic information.
            </p>
          </div>
        </div>
        <Card className="rounded-2xl border border-border/60 dark:border-white/5 bg-card/80 dark:bg-white/[0.03] shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Entity Name
              </label>
              <Input
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder="Enter entity name"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Division
              </label>
              <Input
                value={division}
                type="text"
                onChange={(e) => setDivision(e.target.value)}
                placeholder="Enter division"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Reference IAR No.
              </label>
              <Input
                value={referenceIarNo}
                type="text"
                onChange={(e) => setReferenceIarNo(e.target.value)}
                placeholder="Enter Reference IAR No."
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Fund Cluster
              </label>
              <Input
                value={fundCluster}
                type="number"
                onChange={(e) => setFundCluster(e.target.value)}
                placeholder="Enter fund cluster"
              />
            </div>
            <div className="pt-2">
              <Button
                variant="success"
                onClick={handleSave}
                className="w-full md:w-auto"
              >
                Save <Save className="w-4 h-4 mr-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
