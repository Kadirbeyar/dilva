import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/** Returns the full Language catalogue (used by onboarding / edit-profile pickers). */
export async function GET() {
  const languages = await prisma.language.findMany({
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ languages });
}
