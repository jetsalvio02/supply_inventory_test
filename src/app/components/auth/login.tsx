"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FullLogo from "@/app/(Admin)/admin/layout/shared/logo/FullLogo";
import CardBox from "../shared/CardBox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EyeIcon, EyeOffIcon } from "lucide-react";

export const Login = () => {
  const router = useRouter();
  const [accountNo, setAccountNo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedAccount = accountNo.trim();
    const trimmedPassword = password.trim();

    if (!trimmedAccount || !trimmedPassword) {
      alert("Enter account number and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: Number(trimmedAccount),
          password: trimmedPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        alert(data.message ?? "Login failed.");
        return;
      }

      router.push("/admin");
    } catch {
      alert("Network error while logging in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="h-screen w-full flex justify-center items-center bg-lightprimary">
        <div className="md:min-w-[450px] min-w-max">
          <CardBox>
            <div className="flex justify-center mb-4">
              <FullLogo />
            </div>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="username1" className="font-medium">
                    Account No.
                  </Label>
                </div>
                <Input
                  id="username1"
                  type="number"
                  placeholder="Enter your account no."
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                  required
                />
              </div>
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="password1" className="font-medium">
                    Password
                  </Label>
                </div>
                <div className="relative">
                  <Input
                    id="password1"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
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
              <Button className="w-full" type="submit" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardBox>
        </div>
      </div>
    </>
  );
};
