import { NextResponse, NextRequest } from "next/server";
import { eq, and, count } from "drizzle-orm";
import { database } from "@/lib/db";
import {
  risRequests,
  risRequestItems,
  inventoryTransactions,
} from "@/lib/db/schema";
import { broadcastRequestsUpdated } from "@/lib/realtime";
import { readAuthenticatedUserIdFromCookies } from "@/lib/auth";

export async function DELETE(
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
      return NextResponse.json({ success: true }, { status: 200 });
    }

    await database
      .delete(risRequestItems)
      .where(eq(risRequestItems.requestId, requestId));

    await database
      .delete(risRequests)
      .where(
        and(eq(risRequests.id, requestId), eq(risRequests.userId, userId)),
      );
    await broadcastRequestsUpdated();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message ?? "Failed to delete request" },
      { status: 500 },
    );
  }
}

export async function PATCH(
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
        { success: false, message: "Invalid request ID" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const purpose = String(body.purpose ?? "").trim();
    const itemsInput = Array.isArray(body.items) ? body.items : [];

    if (!itemsInput.length) {
      return NextResponse.json(
        { success: false, message: "No items to save" },
        { status: 400 },
      );
    }

    // 1. Verify ownership and existence
    const [existingRequest] = await database
      .select()
      .from(risRequests)
      .where(and(eq(risRequests.id, requestId), eq(risRequests.userId, userId)))
      .limit(1);

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, message: "Request not found or access denied" },
        { status: 404 },
      );
    }

    // 2. Verify it's not released
    const [usage] = await database
      .select({ total: count() })
      .from(inventoryTransactions)
      .where(eq(inventoryTransactions.remarks, `RIS #${requestId}`));

    if (usage && usage.total > 0) {
      return NextResponse.json(
        { success: false, message: "Cannot edit a released request" },
        { status: 400 },
      );
    }

    await database
      .update(risRequests)
      .set({ purpose: purpose || null })
      .where(eq(risRequests.id, requestId));

    // Replace items: Delete old, Insert new
    await database
      .delete(risRequestItems)
      .where(eq(risRequestItems.requestId, requestId));

    const itemValues = itemsInput.map((item: any) => ({
      requestId: requestId,
      itemId: item.itemId ?? null,
      stockNo: item.stockNo ?? null,
      unit: item.unit ?? null,
      name: item.name ?? "",
      description: item.description ?? "",
      quantity: Number(item.quantity ?? 0) || 0,
      remarks: item.remarks ?? "",
    }));

    if (itemValues.length > 0) {
      await database.insert(risRequestItems).values(itemValues);
    }

    const responsePayload = {
      id: requestId,
      purpose: purpose,
      items: itemValues.map((i: any, index: number) => ({
        id: i.itemId ?? index + 1,
        stockNo: i.stockNo ?? "",
        unit: i.unit ?? "",
        name: i.name ?? "",
        description: i.description ?? "",
        quantity: i.quantity ?? 0,
        remarks: i.remarks ?? "",
      })),
    };

    await broadcastRequestsUpdated();

    return NextResponse.json(
      { success: true, request: responsePayload },
      { status: 200 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message ?? "Failed to update request" },
      { status: 500 },
    );
  }
}
