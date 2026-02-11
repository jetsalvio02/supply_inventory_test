import { database } from "@/lib/db";
import { items, units, inventorySummary } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

/* ================================
   GET – List items with balance
================================ */
export async function GET() {
  const data = await database
    .select({
      id: items.id,
      name: items.name,
      description: items.description,
      status: items.status,
      // category: categories.name,
      beginingStock: items.beginingStock,
      newDeliveryStock: items.newDeliveryStock,
      stockNo: items.stockNo,
      unit: units.name,
      balance: inventorySummary.actualBalance,
    })
    .from(items)
    // .leftJoin(categories, eq(items.categoryId, categories.id))
    .leftJoin(units, eq(items.unitId, units.id))
    .leftJoin(inventorySummary, eq(items.id, inventorySummary.itemId))
    .orderBy(desc(items.createdAt));

  return NextResponse.json(data);
}

/* ================================
   POST – Create item
================================ */
export async function POST(req: Request) {
  const body = await req.json();

  const beginningStock =
    Number(body.beginningStock ?? body.beginning_stock ?? 0) || 0;
  const newDelivery =
    Number(body.newDelivery ?? body.new_delivery ?? 0) || 0;

  const [item] = await database
    .insert(items)
    .values({
      name: body.name,
      description: body.description,
      // categoryId: body.categoryId, 
      beginingStock: beginningStock,
      newDeliveryStock: newDelivery,
      stockNo: body.stockNo,
      unitId: body.unitId,
      unitCost: body.unitCost,
    })
    .returning();

  await database.insert(inventorySummary).values({
    itemId: item.id,
    beginningStock,
    totalIn: newDelivery,
    actualBalance: beginningStock + newDelivery,
  });

  return NextResponse.json(item);
}
