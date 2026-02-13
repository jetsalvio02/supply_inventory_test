import { database } from "@/lib/db";
import { items } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const itemId = Number(id);
    if (!Number.isFinite(itemId)) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const [item] = await database
      .select()
      .from(items)
      .where(eq(items.id, itemId))
      .limit(1);

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch item" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const body = await req.json();

  const { id } = await context.params;
  const itemId = Number(id);
  if (!Number.isFinite(itemId)) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const [updated] = await database
    .update(items)
    .set({
      name: body.name,
      description: body.description,
      stockNo: body.stockNo,
      unitId: body.unitId,
      unitCost: body.unitCost,
      totalCost: body.totalCost,
    })
    .where(eq(items.id, itemId))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const itemId = Number(id);
  if (!Number.isFinite(itemId)) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  await database.delete(items).where(eq(items.id, itemId));

  return NextResponse.json({ success: true });
}
