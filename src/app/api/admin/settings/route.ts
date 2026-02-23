import { NextRequest, NextResponse } from "next/server";
import { database } from "@/lib/db";
import { systemSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const rows = await database.select().from(systemSettings).limit(1);
  const row = rows[0];

  return NextResponse.json({
    success: true,
    settings: row ?? null,
  });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();

  const rows = await database.select().from(systemSettings).limit(1);
  const existing = rows[0];

  if (existing) {
    const [updated] = await database
      .update(systemSettings)
      .set({
        entityName: body.entityName ?? existing.entityName,
        division: body.division ?? existing.division,
        referenceIarNo: body.referenceIarNo ?? existing.referenceIarNo,
        fundCluster: body.fundCluster ?? existing.fundCluster,
        updatedAt: new Date(),
      })
      .where(eq(systemSettings.id, existing.id))
      .returning();

    return NextResponse.json({ success: true, settings: updated });
  }

  const [created] = await database
    .insert(systemSettings)
    .values({
      entityName: body.entityName ?? null,
      referenceIarNo: body.referenceIarNo ?? null,
      fundCluster: body.fundCluster ?? null,
    })
    .returning();

  return NextResponse.json({ success: true, settings: created });
}
