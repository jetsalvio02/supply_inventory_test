import { NextResponse } from "next/server";
import { database } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const rawId = body.id ?? body.userId;
    const name = (body.name ?? "").trim();
    const role = (body.role ?? "staff").trim() || "staff";
    const password = body.password ?? "";

    const hashedPassword = await bcrypt.hash(password, 10);

    const numericId = Number(rawId);

    if (!name || Number.isNaN(numericId)) {
      return NextResponse.json(
        { success: false, message: "Invalid name or id" },
        { status: 400 }
      );
    }

    const existing = await database
      .select()
      .from(users)
      .where(eq(users.id, numericId));

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: "User with this ID already exists" },
        { status: 400 }
      );
    }

    const [created] = await database
      .insert(users)
      .values({
        id: numericId,
        name,
        role,
        password: hashedPassword,
      })
      .returning();

    return NextResponse.json({ success: true, user: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message ?? "Failed to create user" },
      { status: 500 }
    );
  }
}
