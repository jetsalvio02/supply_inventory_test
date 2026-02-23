import { NextResponse } from "next/server";
import { database } from "@/lib/db";
import { users, departments, officeHeads } from "@/lib/db/schema";
import { eq, aliasedTable } from "drizzle-orm";
import { readAuthenticatedUserIdFromCookies } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await readAuthenticatedUserIdFromCookies();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    const officeHeadDeptTable = aliasedTable(departments, "officeHeadDept");

    const [user] = await database
      .select({
        id: users.id,
        name: users.name,
        role: users.role,
        createdAt: users.createdAt,
        officeHead: officeHeads.name,
        officeHeadDepartment: officeHeadDeptTable.name,
        department: departments.name,
      })
      .from(users)
      .leftJoin(officeHeads, eq(users.officeHeadId, officeHeads.id))
      .leftJoin(departments, eq(users.departmentId, departments.id))
      .leftJoin(
        officeHeadDeptTable,
        eq(users.officeHeadDepartmentId, officeHeadDeptTable.id),
      )
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          role: user.role ?? "staff",
          officeHead: user.officeHead ?? null,
          officeHeadDepartment: user.officeHeadDepartment ?? null,
          department: user.department ?? null,
          createdAt: user.createdAt ? user.createdAt.toISOString() : null,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message ?? "Failed to load profile",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await readAuthenticatedUserIdFromCookies();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    const officeHeadName = String(body?.officeHead ?? "").trim();
    const officeHeadDeptName = String(body?.officeHeadDepartment ?? "").trim();
    const departmentName = String(body?.department ?? "").trim();

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Name is required" },
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

    const [updated] = await database
      .update(users)
      .set({
        name,
        departmentId,
        officeHeadId,
        officeHeadDepartmentId,
      })
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: updated.id,
          name: updated.name,
          role: updated.role ?? "staff",
          officeHead: officeHeadName || null,
          officeHeadDepartment: officeHeadDeptName || null,
          department: departmentName || null,
          createdAt: updated.createdAt ? updated.createdAt.toISOString() : null,
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message ?? "Failed to update profile",
      },
      { status: 500 },
    );
  }
}
