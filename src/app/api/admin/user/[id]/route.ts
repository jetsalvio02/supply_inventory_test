import { NextResponse, NextRequest } from "next/server";
import { database } from "@/lib/db";
import { users, inventoryTransactions } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = String(resolvedParams?.id ?? "").trim();

    if (!id) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const result = await database.select().from(users).where(eq(users.id, id));

    if (!result || result.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, user: result[0] },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = String(resolvedParams?.id ?? "").trim();

    if (!id) {
      return NextResponse.json({ error: "Invalid user ID" }, { status: 400 });
    }

    const result = await database.select().from(users).where(eq(users.id, id));

    if (!result || result.length === 0) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const [usage] = await database
      .select({ total: count() })
      .from(inventoryTransactions)
      .where(eq(inventoryTransactions.userId, id));

    if (usage && usage.total > 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Cannot delete this user because they have inventory transactions.",
        },
        { status: 400 }
      );
    }

    await database.delete(users).where(eq(users.id, id));

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message ?? "Failed to delete user",
      },
      { status: 500 }
    );
  }
}
