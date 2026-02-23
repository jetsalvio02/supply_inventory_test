import { NextResponse } from "next/server";
import { database } from "@/lib/db";
import { officeHeads } from "@/lib/db/schema";
import { desc } from "drizzle-orm";

export async function GET() {
  try {
    const result = await database
      .select()
      .from(officeHeads)
      .orderBy(desc(officeHeads.createdAt));

    return NextResponse.json(
      { success: true, officeHeads: result },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const { name } = await req.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 },
      );
    }

    const [created] = await database
      .insert(officeHeads)
      .values({ name: name.trim() })
      .returning();

    return NextResponse.json(
      { success: true, officeHead: created },
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to create office head",
      },
      { status: 500 },
    );
  }
}
