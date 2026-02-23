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
import { useRouter } from "next/navigation";
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
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserProfileData {
  id: string;
  name: string;
  role: string;
  officeHead: string | null;
  officeHeadDepartment: string | null;
  department: string | null;
  createdAt: string | null;
}

const queryClient = new QueryClient();

const toTitleCase = (value: string) => {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
};

function UserProfilePageInner() {
  const router = useRouter();
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [officeHead, setOfficeHead] = useState("");
  const [officeHeadDepartment, setOfficeHeadDepartment] = useState("");
  const [department, setDepartment] = useState("");

  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [officeHeadOpen, setOfficeHeadOpen] = useState(false);
  const [officeHeadDeptOpen, setOfficeHeadDeptOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
        officeHead: data.user.officeHead ?? null,
        officeHeadDepartment: data.user.officeHeadDepartment ?? null,
        department: data.user.department ?? null,
        createdAt: data.user.createdAt ?? null,
      };
    },
  });

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

  useEffect(() => {
    if (profile && !editing) {
      setNameInput(profile.name);
      setOfficeHead(profile.officeHead ?? "");
      setOfficeHeadDepartment(profile.officeHeadDepartment ?? "");
      setDepartment(profile.department ?? "");
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
      setOfficeHead(profile.officeHead ?? "");
      setOfficeHeadDepartment(profile.officeHeadDepartment ?? "");
      setDepartment(profile.department ?? "");
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
        body: JSON.stringify({
          name: nameInput.trim(),
          officeHead: officeHead.trim(),
          officeHeadDepartment: officeHeadDepartment.trim(),
          department: department.trim(),
        }),
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
        officeHead: data.user.officeHead ?? null,
        officeHeadDepartment: data.user.officeHeadDepartment ?? null,
        department: data.user.department ?? null,
        createdAt: data.user.createdAt ?? null,
      });
      setEditing(false);
      router.push("/user");
    } catch {
      setUpdateError("Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-xl px-1 py-1 space-y-6 sm:px-1 sm:py-1">
        <div className="flex items-center gap-1">
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
                    value={editing ? nameInput : (profile?.name ?? "")}
                    onChange={(e) => setNameInput(toTitleCase(e.target.value))}
                    readOnly={!editing}
                    className={editing ? "" : "bg-muted/40"}
                  />
                </div>
                <div className="grid gap-2 hidden">
                  <Label htmlFor="user-role">Role</Label>
                  <Input
                    id="user-role"
                    value={profile?.role ?? ""}
                    readOnly={!editing}
                    className="bg-muted/40"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user-department">Department</Label>
                  {editing ? (
                    <Combobox
                      options={departmentsData}
                      value={department}
                      onSelect={setDepartment}
                      placeholder="Select department..."
                      open={departmentOpen}
                      onOpenChange={setDepartmentOpen}
                    />
                  ) : (
                    <Input
                      id="user-department"
                      value={profile?.department ?? ""}
                      readOnly
                      className="bg-muted/40"
                    />
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user-office-head">Office Head</Label>
                  {editing ? (
                    <Combobox
                      options={officeHeadsData}
                      value={officeHead}
                      onSelect={setOfficeHead}
                      placeholder="Select office head..."
                      open={officeHeadOpen}
                      onOpenChange={setOfficeHeadOpen}
                    />
                  ) : (
                    <Input
                      id="user-office-head"
                      value={profile?.officeHead ?? ""}
                      readOnly
                      className="bg-muted/40"
                    />
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="user-office-head-department">
                    Office Head Department
                  </Label>
                  {editing ? (
                    <Combobox
                      options={departmentsData}
                      value={officeHeadDepartment}
                      onSelect={setOfficeHeadDepartment}
                      placeholder="Select office head department..."
                      open={officeHeadDeptOpen}
                      onOpenChange={setOfficeHeadDeptOpen}
                    />
                  ) : (
                    <Input
                      id="user-office-head-department"
                      value={profile?.officeHeadDepartment ?? ""}
                      readOnly
                      className="bg-muted/40"
                    />
                  )}
                </div>
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
      <PopoverContent className="w-full p-0" align="start">
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

export default function UserProfilePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <UserProfilePageInner />
    </QueryClientProvider>
  );
}
