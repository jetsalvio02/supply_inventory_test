import { NextResponse } from "next/server";
import { database } from "@/lib/db";
import { officeHeads } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { name } = await req.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 },
      );
    }

    const [updated] = await database
      .update(officeHeads)
      .set({ name: name.trim() })
      .where(eq(officeHeads.id, parseInt(id)))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Office head not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, officeHead: updated },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to update office head",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const [deleted] = await database
      .delete(officeHeads)
      .where(eq(officeHeads.id, parseInt(id)))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, message: "Office head not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { success: true, message: "Office head deleted" },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error.message || "Failed to delete office head",
      },
      { status: 500 },
    );
  }
}
