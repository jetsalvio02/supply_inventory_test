import { database } from "@/lib/db";
import { units } from "@/lib/db/schema";

export async function GET() {
  const data = await database.select().from(units).orderBy(units.name);
  return Response.json(data);
}
