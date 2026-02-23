import { NextResponse, NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { database } from "@/lib/db";
import {
  inventorySummary,
  inventoryTransactions,
  stockCards,
} from "@/lib/db/schema";
import { broadcastRequestsUpdated } from "@/lib/realtime";
import { readAuthenticatedUserIdFromCookies } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await readAuthenticatedUserIdFromCookies();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    const resolvedParams = await params;
    const idParam = resolvedParams?.id;
    const requestId = Number(idParam);

    if (!idParam || !Number.isFinite(requestId)) {
      return NextResponse.json(
        { success: false, message: "Invalid request id" },
        { status: 400 },
      );
    }

    // Find all OUT transactions created by the release for this RIS
    const transactions = await database
      .select({
        id: inventoryTransactions.id,
        itemId: inventoryTransactions.itemId,
        quantity: inventoryTransactions.quantity,
      })
      .from(inventoryTransactions)
      .where(
        and(
          eq(inventoryTransactions.remarks, `RIS #${requestId}`),
          eq(inventoryTransactions.type, "OUT"),
        ),
      );

    if (!transactions.length) {
      return NextResponse.json(
        {
          success: false,
          message: "This request has not been released yet.",
        },
        { status: 400 },
      );
    }

    let rolledBackCount = 0;

    for (const tx of transactions) {
      const quantity = tx.quantity;
      if (!Number.isFinite(quantity) || quantity <= 0) continue;

      // Restore inventory summary balances
      const [summary] = await database
        .select({
          id: inventorySummary.id,
          totalOut: inventorySummary.totalOut,
          actualBalance: inventorySummary.actualBalance,
        })
        .from(inventorySummary)
        .where(eq(inventorySummary.itemId, tx.itemId))
        .limit(1);

      if (summary) {
        const newBalance = (summary.actualBalance ?? 0) + quantity;
        const newTotalOut = Math.max((summary.totalOut ?? 0) - quantity, 0);

        await database
          .update(inventorySummary)
          .set({
            totalOut: newTotalOut,
            actualBalance: newBalance,
            updatedAt: new Date(),
          })
          .where(eq(inventorySummary.id, summary.id));
      }

      // Delete associated stock card entry (cascade should handle this,
      // but being explicit for safety)
      await database
        .delete(stockCards)
        .where(eq(stockCards.transactionId, tx.id));

      // Delete the inventory transaction itself
      await database
        .delete(inventoryTransactions)
        .where(eq(inventoryTransactions.id, tx.id));

      rolledBackCount += 1;
    }

    if (rolledBackCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No inventory changes were rolled back.",
        },
        { status: 400 },
      );
    }

    await broadcastRequestsUpdated();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message ?? "Failed to rollback release",
      },
      { status: 500 },
    );
  }
}
