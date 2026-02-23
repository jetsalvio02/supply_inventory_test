import { NextResponse } from "next/server";
import { database } from "@/lib/db";
import { departments } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const data = await database
      .select()
      .from(departments)
      .orderBy(asc(departments.name));
    return NextResponse.json({ success: true, departments: data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
