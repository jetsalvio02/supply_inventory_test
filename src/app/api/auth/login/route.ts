import { NextResponse } from "next/server";
import { database } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const authCookieSecret = process.env.AUTH_COOKIE_SECRET || "dev-secret";

function signAuthValue(value: string) {
  return crypto.createHmac("sha256", authCookieSecret).update(value).digest("hex");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const rawId = body.id ?? body.accountNo;
    const password = String(body.password ?? "").trim();

    const numericId = Number(rawId);
    if (!rawId || Number.isNaN(numericId) || !password) {
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 400 }
      );
    }

    const result = await database
      .select()
      .from(users)
      .where(eq(users.id, numericId));

    if (!result || result.length === 0) {
      return NextResponse.json(
        { success: false, message: "Account not found" },
        { status: 401 }
      );
    }

    const user = result[0] as typeof users.$inferSelect;

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json(
        { success: false, message: "Incorrect password" },
        { status: 401 }
      );
    }

    const baseValue = `${user.id}:${user.role ?? "staff"}`;
    const signature = signAuthValue(baseValue);

    const res = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
      },
    });

    res.cookies.set("userId", String(user.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    res.cookies.set("userRole", user.role ?? "staff", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    res.cookies.set("userSig", signature, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    return res;
  } catch {
    return NextResponse.json(
      { success: false, message: "Login failed" },
      { status: 500 }
    );
  }
}
