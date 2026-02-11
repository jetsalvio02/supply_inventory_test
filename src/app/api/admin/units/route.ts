import { database } from "@/lib/db";
import { units } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const data = await database.select().from(units).orderBy(units.name);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const name = String(body.name || "").trim();

  if (!name) {
    return NextResponse.json(
      { error: "Unit name is required" },
      { status: 400 }
    );
  }

  const existing = await database
    .select()
    .from(units)
    .where(eq(units.name, name))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(existing[0], { status: 200 });
  }

  const [created] = await database
    .insert(units)
    .values({ name })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
