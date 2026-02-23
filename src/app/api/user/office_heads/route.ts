import { NextResponse } from "next/server";
import { database } from "@/lib/db";
import { officeHeads } from "@/lib/db/schema";
import { asc } from "drizzle-orm";

export async function GET() {
  try {
    const data = await database
      .select()
      .from(officeHeads)
      .orderBy(asc(officeHeads.name));
    return NextResponse.json({ success: true, officeHeads: data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}
