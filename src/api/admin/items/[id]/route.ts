import { database } from "@/lib/db";
import { items } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/* ================================
   PUT – Update item
================================ */
export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  const body = await req.json();

  const [updated] = await database
    .update(items)
    .set({
      name: body.name,
      description: body.description,
      // categoryId: body.categoryId,
      unitId: body.unitId,
    })
    .where(eq(items.id, Number(params.id)))
    .returning();

  return NextResponse.json(updated);
}
