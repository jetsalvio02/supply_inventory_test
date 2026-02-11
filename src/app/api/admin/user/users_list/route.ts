import { NextResponse } from "next/server";
import { database } from "@/lib/db";
import { users as usersTable } from "@/lib/db/schema";

export async function GET(req: Request) {
  try {
    const result = await database.select().from(usersTable);

    return NextResponse.json({ success: true, users: result }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
