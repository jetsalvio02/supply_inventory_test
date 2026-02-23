import { NextResponse } from "next/server";
import { database } from "@/lib/db";
import { users as usersTable, departments, officeHeads } from "@/lib/db/schema";
import { eq, aliasedTable } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const officeHeadDeptTable = aliasedTable(departments, "officeHeadDept");

    const result = await database
      .select({
        id: usersTable.id,
        name: usersTable.name,
        role: usersTable.role,
        createdAt: usersTable.createdAt,
        officeHead: officeHeads.name,
        officeHeadDepartment: officeHeadDeptTable.name,
        department: departments.name,
      })
      .from(usersTable)
      .leftJoin(officeHeads, eq(usersTable.officeHeadId, officeHeads.id))
      .leftJoin(departments, eq(usersTable.departmentId, departments.id))
      .leftJoin(
        officeHeadDeptTable,
        eq(usersTable.officeHeadDepartmentId, officeHeadDeptTable.id),
      );

    return NextResponse.json({ success: true, users: result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
