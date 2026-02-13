"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

interface UserProfileData {
  id: number;
  name: string;
  role: string;
  createdAt: string | null;
}

const queryClient = new QueryClient();

function UserProfilePageInner() {
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nameInput, setNameInput] = useState("");

  const queryClient = useQueryClient();

  const {
    data: profile,
    isLoading,
    error: loadError,
  } = useQuery({
    queryKey: ["user-profile"],
    queryFn: async (): Promise<UserProfileData> => {
      const res = await fetch("/api/user/profile");

      if (!res.ok) {
        throw new Error("Failed to load profile.");
      }

      const data = await res.json();

      if (!data?.success || !data.user) {
        throw new Error("Failed to load profile.");
      }

      return {
        id: data.user.id,
        name: data.user.name,
        role: data.user.role ?? "staff",
        createdAt: data.user.createdAt ?? null,
      };
    },
  });

  useEffect(() => {
    if (profile && !editing) {
      setNameInput(profile.name);
    }
  }, [profile, editing]);

  const error = updateError ?? (loadError ? "Failed to load profile." : null);

  const joinedText =
    profile?.createdAt && !Number.isNaN(Date.parse(profile.createdAt))
      ? new Date(profile.createdAt).toLocaleString()
      : null;

  const handleCancelEdit = () => {
    setEditing(false);
    if (profile) {
      setNameInput(profile.name);
    }
  };

  const handleSave = async () => {
    if (!nameInput.trim() || !profile) {
      return;
    }

    setSaving(true);
    setUpdateError(null);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: nameInput.trim() }),
      });

      if (!res.ok) {
        setUpdateError("Failed to update profile.");
        return;
      }

      const data = await res.json();

      if (!data?.success || !data.user) {
        setUpdateError("Failed to update profile.");
        return;
      }

      queryClient.setQueryData<UserProfileData | null>(["user-profile"], {
        id: data.user.id,
        name: data.user.name,
        role: data.user.role ?? "staff",
        createdAt: data.user.createdAt ?? null,
      });
      setEditing(false);
    } catch {
      setUpdateError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-xl px-4 py-4 space-y-6 sm:px-6 sm:py-6">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <User className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Profile</h1>
            <p className="text-sm text-muted-foreground">
              View your account information for this portal.
            </p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Account details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                Loading profile...
              </p>
            ) : error ? (
              <p className="text-sm text-destructive">{error}</p>
            ) : (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="user-id">User ID</Label>
                  <Input
                    id="user-id"
                    value={profile?.id ?? ""}
                    readOnly
                    className="bg-muted/40"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user-name">Name</Label>
                  <Input
                    id="user-name"
                    value={editing ? nameInput : profile?.name ?? ""}
                    onChange={(e) => setNameInput(e.target.value)}
                    readOnly={!editing}
                    className={editing ? "" : "bg-muted/40"}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user-role">Role</Label>
                  <Input
                    id="user-role"
                    value={profile?.role ?? ""}
                    readOnly
                    className="bg-muted/40"
                  />
                </div>
                {joinedText && (
                  <div className="grid gap-2">
                    <Label htmlFor="user-joined">Joined</Label>
                    <Input
                      id="user-joined"
                      value={joinedText}
                      readOnly
                      className="bg-muted/40"
                    />
                  </div>
                )}
              </>
            )}
            <div className="pt-2">
              {editing ? (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="success"
                    className="flex-1"
                    onClick={handleSave}
                    disabled={saving || !nameInput.trim()}
                  >
                    Save changes
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => setEditing(true)}
                  disabled={isLoading || !!error || !profile}
                >
                  Edit profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function UserProfilePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProfilePageInner />
    </QueryClientProvider>
  );
}
