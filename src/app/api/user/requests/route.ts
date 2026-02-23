import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { desc, eq, count } from "drizzle-orm";
import { database } from "@/lib/db";
import {
  risRequests,
  risRequestItems,
  inventoryTransactions,
  users,
  officeHeads,
  departments,
} from "@/lib/db/schema";
import { broadcastRequestsUpdated } from "@/lib/realtime";
import { readAuthenticatedUserIdFromCookies } from "@/lib/auth";
import { aliasedTable } from "drizzle-orm";

export async function GET() {
  try {
    const userId = await readAuthenticatedUserIdFromCookies();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
      );
    }

    const userDept = aliasedTable(departments, "user_dept");
    const headDept = aliasedTable(departments, "head_dept");

    const rows = await database
      .select({
        requestId: risRequests.id,
        createdAt: risRequests.createdAt,
        purpose: risRequests.purpose,
        itemId: risRequestItems.id,
        stockNo: risRequestItems.stockNo,
        unit: risRequestItems.unit,
        name: risRequestItems.name,
        description: risRequestItems.description,
        quantity: risRequestItems.quantity,
        remarks: risRequestItems.remarks,
        userName: users.name,
        officeHead: officeHeads.name,
        userDepartment: userDept.name,
        officeHeadDepartment: headDept.name,
      })
      .from(risRequests)
      .leftJoin(risRequestItems, eq(risRequestItems.requestId, risRequests.id))
      .leftJoin(users, eq(users.id, risRequests.userId))
      .leftJoin(officeHeads, eq(officeHeads.id, users.officeHeadId))
      .leftJoin(userDept, eq(userDept.id, users.departmentId))
      .leftJoin(headDept, eq(headDept.id, users.officeHeadDepartmentId))
      .where(eq(risRequests.userId, userId))
      .orderBy(desc(risRequests.createdAt));

    const map = new Map<
      number,
      {
        id: number;
        createdAt: string;
        purpose: string;
        user: {
          name: string;
          officeHead: string | null;
          department: string | null;
          officeHeadDepartment: string | null;
        };
        items: {
          id: number;
          stockNo: string;
          unit: string;
          name: string;
          description: string;
          quantity: number;
          remarks: string;
        }[];
      }
    >();

    for (const row of rows) {
      const existing = map.get(row.requestId);
      const base = existing ?? {
        id: row.requestId,
        createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
        purpose: row.purpose ?? "",
        user: {
          name: row.userName ?? "N/A",
          officeHead: row.officeHead ?? null,
          department: row.userDepartment ?? null,
          officeHeadDepartment: row.officeHeadDepartment ?? null,
        },
        items: [],
      };

      if (row.itemId) {
        base.items.push({
          id: row.itemId,
          stockNo: row.stockNo ?? "",
          unit: row.unit ?? "",
          name: row.name ?? "",
          description: row.description ?? "",
          quantity: row.quantity ?? 0,
          remarks: row.remarks ?? "",
        });
      }

      if (!existing) {
        map.set(row.requestId, base);
      }
    }

    const normalized = Array.from(map.values());

    const withStatus = await Promise.all(
      normalized.map(async (req) => {
        const [usage] = await database
          .select({ total: count() })
          .from(inventoryTransactions)
          .where(eq(inventoryTransactions.remarks, `RIS #${req.id}`));

        const released = !!usage && usage.total > 0;

        return { ...req, released };
      }),
    );

    return NextResponse.json({ success: true, requests: withStatus });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message ?? "Failed to load requests" },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const userId = await readAuthenticatedUserIdFromCookies();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 },
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

    // Allow admins to create requests on behalf of another user
    let effectiveUserId = userId;
    if (body.forUserId) {
      const store = await cookies();
      const role = store.get("userRole")?.value ?? "staff";
      if (role === "admin") {
        effectiveUserId = String(body.forUserId);
      }
    }

    const [request] = await database
      .insert(risRequests)
      .values({
        userId: effectiveUserId,
        purpose: purpose || null,
      })
      .returning();

    const itemValues = itemsInput.map((item: any) => ({
      requestId: request.id,
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

    const [userProfile] = await database
      .select({
        name: users.name,
        officeHead: officeHeads.name,
        userDepartment: departments.name,
      })
      .from(users)
      .leftJoin(officeHeads, eq(officeHeads.id, users.officeHeadId))
      .leftJoin(departments, eq(departments.id, users.departmentId))
      .where(eq(users.id, effectiveUserId))
      .limit(1);

    const [headDept] = await database
      .select({ name: departments.name })
      .from(users)
      .leftJoin(departments, eq(departments.id, users.officeHeadDepartmentId))
      .where(eq(users.id, effectiveUserId))
      .limit(1);

    const responsePayload = {
      id: request.id,
      createdAt: (request.createdAt ?? new Date()).toISOString(),
      purpose: request.purpose ?? "",
      user: {
        name: userProfile?.name ?? "N/A",
        officeHead: userProfile?.officeHead ?? null,
        department: userProfile?.userDepartment ?? null,
        officeHeadDepartment: headDept?.name ?? null,
      },
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
      { status: 201 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message ?? "Failed to save request" },
      { status: 500 },
    );
  }
}
