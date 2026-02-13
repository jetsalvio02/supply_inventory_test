import { NextResponse } from "next/server";
import { database } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { readAuthenticatedUserIdFromCookies } from "@/lib/auth";

export async function GET() {
  try {
    const userId = await readAuthenticatedUserIdFromCookies();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const [user] = await database
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          name: user.name,
          role: user.role ?? "staff",
          createdAt: user.createdAt ? user.createdAt.toISOString() : null,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message ?? "Failed to load profile",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const userId = await readAuthenticatedUserIdFromCookies();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const nameRaw = typeof body?.name === "string" ? body.name : "";
    const name = nameRaw.trim();

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Name is required" },
        { status: 400 }
      );
    }

    const [updated] = await database
      .update(users)
      .set({ name })
      .where(eq(users.id, userId))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        user: {
          id: updated.id,
          name: updated.name,
          role: updated.role ?? "staff",
          createdAt: updated.createdAt ? updated.createdAt.toISOString() : null,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message ?? "Failed to update profile",
      },
      { status: 500 }
    );
  }
}
