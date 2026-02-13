import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, lt } from "drizzle-orm";
import { database } from "@/lib/db";
import {
  items,
  inventorySummary,
  inventoryTransactions,
} from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const yearParam = searchParams.get("year");
  const year = yearParam ? Number(yearParam) : new Date().getFullYear();

  if (Number.isNaN(year)) {
    return NextResponse.json(
      { success: false, message: "Invalid year parameter" },
      { status: 400 }
    );
  }

  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const baseRows = await database
    .select({
      id: items.id,
      name: items.name,
      description: items.description,
      beginningStock: inventorySummary.beginningStock,
      forwardedBalance: inventorySummary.forwardedBalance,
      totalIn: inventorySummary.totalIn,
      totalOut: inventorySummary.totalOut,
      actualBalance: inventorySummary.actualBalance,
    })
    .from(items)
    .leftJoin(inventorySummary, eq(items.id, inventorySummary.itemId));

  const txRows = await database
    .select({
      itemId: inventoryTransactions.itemId,
      quantity: inventoryTransactions.quantity,
      createdAt: inventoryTransactions.createdAt,
      type: inventoryTransactions.type,
    })
    .from(inventoryTransactions)
    .where(
      and(
        eq(inventoryTransactions.type, "OUT"),
        gte(inventoryTransactions.createdAt, start),
        lt(inventoryTransactions.createdAt, end)
      )
    );

  const perItem: Record<
    number,
    { janFeb: number; march: number; april: number; may: number; june: number }
  > = {};

  for (const row of txRows) {
    const itemId = row.itemId;
    if (!perItem[itemId]) {
      perItem[itemId] = {
        janFeb: 0,
        march: 0,
        april: 0,
        may: 0,
        june: 0,
      };
    }

    if (!row.createdAt) {
      continue;
    }

    const createdAt =
      row.createdAt instanceof Date
        ? row.createdAt
        : new Date(row.createdAt as any);
    const month = createdAt.getMonth();
    const quantity = row.quantity ?? 0;

    if (month === 0 || month === 1) {
      perItem[itemId].janFeb += quantity;
    } else if (month === 2) {
      perItem[itemId].march += quantity;
    } else if (month === 3) {
      perItem[itemId].april += quantity;
    } else if (month === 4) {
      perItem[itemId].may += quantity;
    } else if (month === 5) {
      perItem[itemId].june += quantity;
    }
  }

  const itemsReport = baseRows.map((row) => {
    const monthly = perItem[row.id] ?? {
      janFeb: 0,
      march: 0,
      april: 0,
      may: 0,
      june: 0,
    };

    return {
      id: row.id,
      name: row.name,
      description: row.description ?? "",
      beginningStock: row.beginningStock ?? 0,
      forwardedBalance: row.forwardedBalance ?? 0,
      newDelivery: row.totalIn ?? 0,
      released: row.totalOut ?? 0,
      actualBalance: row.actualBalance ?? 0,
      janFeb: monthly.janFeb,
      march: monthly.march,
      april: monthly.april,
      may: monthly.may,
      june: monthly.june,
    };
  });

  return NextResponse.json({
    success: true,
    year,
    items: itemsReport,
  });
}
