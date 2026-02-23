import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/db";
import {
  users,
  inventoryTransactions,
  risRequests,
  departments,
  officeHeads,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const resolvedParams = await params;
    const idParam = resolvedParams?.id;
    const currentId = String(idParam ?? "").trim();

    if (!currentId || !/^\d+$/.test(currentId)) {
      return NextResponse.json(
        { success: false, message: "Invalid user id" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const name = String(body.name ?? "").trim();
    const role = (body.role ?? "staff").trim() || "staff";
    const passwordRaw =
      typeof body.password === "string" ? body.password.trim() : "";
    const bodyIdRaw = body.id ?? body.userId ?? currentId;
    const newId = String(bodyIdRaw ?? "").trim();

    // New fields
    const officeHeadName = String(body?.officeHead ?? "").trim();
    const officeHeadDeptName = String(body?.officeHeadDepartment ?? "").trim();
    const departmentName = String(body?.department ?? "").trim();

    if (!newId || !/^\d+$/.test(newId)) {
      return NextResponse.json(
        { success: false, message: "Invalid new user id" },
        { status: 400 },
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 },
      );
    }

    const existing = await database
      .select()
      .from(users)
      .where(eq(users.id, currentId));

    if (!existing || existing.length === 0) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    const existingUser = existing[0];

    const passwordToSave = passwordRaw
      ? await bcrypt.hash(passwordRaw, 10)
      : existingUser.password;

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

    if (newId === currentId) {
      const [updated] = await database
        .update(users)
        .set({
          name,
          role,
          password: passwordToSave,
          departmentId,
          officeHeadId,
          officeHeadDepartmentId,
        })
        .where(eq(users.id, currentId))
        .returning();

      return NextResponse.json(
        {
          success: true,
          user: updated,
        },
        { status: 200 },
      );
    }

    const existingNew = await database
      .select()
      .from(users)
      .where(eq(users.id, newId));

    if (existingNew && existingNew.length > 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Another user with this ID already exists",
        },
        { status: 400 },
      );
    }

    const [newUser] = await database
      .insert(users)
      .values({
        id: newId,
        name,
        role,
        password: passwordToSave,
        departmentId,
        officeHeadId,
        officeHeadDepartmentId,
        createdAt: existingUser.createdAt,
      })
      .returning();

    await database
      .update(inventoryTransactions)
      .set({ userId: newId })
      .where(eq(inventoryTransactions.userId, currentId));

    await database
      .update(risRequests)
      .set({ userId: newId })
      .where(eq(risRequests.userId, currentId));

    await database.delete(users).where(eq(users.id, currentId));

    return NextResponse.json(
      {
        success: true,
        user: newUser,
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message ?? "Failed to update user",
      },
      { status: 500 },
    );
  }
}
