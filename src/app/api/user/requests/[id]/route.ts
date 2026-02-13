import { NextResponse, NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { database } from "@/lib/db";
import { risRequests, risRequestItems } from "@/lib/db/schema";
import { broadcastRequestsUpdated } from "@/lib/realtime";
import { readAuthenticatedUserIdFromCookies } from "@/lib/auth";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await readAuthenticatedUserIdFromCookies();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
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
        and(eq(risRequests.id, requestId), eq(risRequests.userId, userId))
      );
    await broadcastRequestsUpdated();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message ?? "Failed to delete request" },
      { status: 500 }
    );
  }
}
