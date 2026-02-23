import { NextResponse } from "next/server";
import { database } from "@/lib/db";
import { users, departments, officeHeads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const rawId = body.id ?? body.userId;
    const name = (body.name ?? "").trim();
    const role = (body.role ?? "staff").trim() || "staff";
    const password = body.password ?? "";

    // New fields
    const officeHeadName = String(body?.officeHead ?? "").trim();
    const officeHeadDeptName = String(body?.officeHeadDepartment ?? "").trim();
    const departmentName = String(body?.department ?? "").trim();

    const hashedPassword = await bcrypt.hash(password, 10);

    const id = String(rawId ?? "").trim();

    if (!name || !id || !/^\d+$/.test(id)) {
      return NextResponse.json(
        { success: false, message: "Invalid name or id" },
        { status: 400 },
      );
    }

    const existing = await database
      .select()
      .from(users)
      .where(eq(users.id, id));

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, message: "User with this ID already exists" },
        { status: 400 },
      );
    }

    // Resolve Department ID
    let departmentId: number | null = null;
    if (departmentName) {
      const [existing] = await database
        .select()
        .from(departments)
        .where(eq(departments.name, departmentName))
        .limit(1);
      if (existing) {
        departmentId = existing.id;
      } else {
        const [inserted] = await database
          .insert(departments)
          .values({ name: departmentName })
          .returning();
        departmentId = inserted.id;
      }
    }

    // Resolve Office Head ID
    let officeHeadId: number | null = null;
    if (officeHeadName) {
      const [existing] = await database
        .select()
        .from(officeHeads)
        .where(eq(officeHeads.name, officeHeadName))
        .limit(1);
      if (existing) {
        officeHeadId = existing.id;
      } else {
        const [inserted] = await database
          .insert(officeHeads)
          .values({ name: officeHeadName })
          .returning();
        officeHeadId = inserted.id;
      }
    }

    // Resolve Office Head Department ID
    let officeHeadDepartmentId: number | null = null;
    if (officeHeadDeptName) {
      const [existing] = await database
        .select()
        .from(departments)
        .where(eq(departments.name, officeHeadDeptName))
        .limit(1);
      if (existing) {
        officeHeadDepartmentId = existing.id;
      } else {
        const [inserted] = await database
          .insert(departments)
          .values({ name: officeHeadDeptName })
          .returning();
        officeHeadDepartmentId = inserted.id;
      }
    }

    const [created] = await database
      .insert(users)
      .values({
        id,
        name,
        role,
        password: hashedPassword,
        departmentId,
        officeHeadId,
        officeHeadDepartmentId,
      })
      .returning();

    return NextResponse.json({ success: true, user: created }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message ?? "Failed to create user" },
      { status: 500 },
    );
  }
}
