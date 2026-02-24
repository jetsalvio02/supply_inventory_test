"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import FullLogo from "@/app/(Admin)/admin/layout/shared/logo/FullLogo";
import CardBox from "../shared/CardBox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EyeIcon, EyeOffIcon, QrCode } from "lucide-react";
import Swal from "sweetalert2";
import { Html5Qrcode } from "html5-qrcode";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Login = () => {
  const router = useRouter();
  const [accountNo, setAccountNo] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scanOpen, setScanOpen] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const qrRef = useRef<any>(null);

  useEffect(() => {
    if (!scanOpen) return;

    let scannerInstance: Html5Qrcode | null = null;
    let isStarting = false;

    const startScanner = async () => {
      if (isStarting) return;
      isStarting = true;

      await new Promise((resolve) => setTimeout(resolve, 150));

      const element = document.getElementById("qr-reader-login");
      if (!element) {
        isStarting = false;
        return;
      }

      try {
        const instance = new Html5Qrcode("qr-reader-login");
        scannerInstance = instance;
        qrRef.current = instance;

        await instance.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: 250 },
          (decodedText: string) => {
            setAccountNo(decodedText);
            setScanOpen(false);
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
        const toStop = scannerInstance;
        scannerInstance = null;
        qrRef.current = null;

        toStop
          .stop()
          .then(() => {
            toStop.clear();
          })
          .catch((err) => {
            console.debug("Scanner stop error:", err);
          });
      }
    };
  }, [scanOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // const trimmedAccount = accountNo.trim();
    // const trimmedPassword = password.trim();

    // if (!trimmedAccount || !trimmedPassword) {
    //   Swal.fire({
    //     icon: "error",
    //     title: "Oops...",
    //     text: "Enter account number and password.",
    //   });
    //   return;
    // }

    setLoading(true);
    setLoginError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: accountNo,
          password: password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setLoginError(
          data.message ?? "Login failed. Please check your credentials.",
        );
        return;
      }

      if (data.user?.role === "admin") {
        Swal.fire({
          icon: "success",
          title: "Login successful",
          text: "Welcome back!",
          timer: 1500,
          showConfirmButton: false,
        });
        router.push("/admin");
      } else {
        Swal.fire({
          icon: "success",
          title: "Login successful",
          text: "Welcome back!",
          timer: 1500,
          showConfirmButton: false,
        });
        router.push("/user");
      }
    } catch {
      setLoginError("Network error while logging in. Please try again.");
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
              {loginError &&
                (setTimeout(() => {
                  setLoginError(null);
                }, 3000),
                (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-md text-sm font-medium animate-in fade-in slide-in-from-top-1">
                    {loginError}
                  </div>
                ))}
              <div>
                <div className="mb-2 block">
                  <Label htmlFor="username1" className="font-medium">
                    Account No.
                  </Label>
                </div>
                <div className="flex gap-2">
                  <Input
                    id="username1"
                    type="number"
                    placeholder="Enter your account no."
                    value={accountNo}
                    onChange={(e) => setAccountNo(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-shrink-0"
                    onClick={() => setScanOpen(true)}
                  >
                    <QrCode size={16} className="mr-2" />
                    Scan
                  </Button>
                </div>
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
            {/* <div className="mt-1 text-center text-sm">
              <span className="text-muted-foreground italic">
                Forgot password?{" "}
              </span>
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Contact Admin
              </a>
            </div> */}
          </CardBox>
        </div>
      </div>

      <Dialog open={scanOpen} onOpenChange={setScanOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>Scan ID QR</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p className="text-xs text-muted-foreground">
              Point the camera at your ID QR code.
            </p>
            <div
              id="qr-reader-login"
              className="w-full aspect-square rounded-md border border-border overflow-hidden"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
