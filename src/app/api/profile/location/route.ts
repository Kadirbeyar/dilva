import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

const schema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  isLocationVisible: z.boolean().optional(),
});

/**
 * Sets the user's coordinates for the Premium "Nearby" feature. The
 * browser geolocation coordinates are sent here; nothing is shared
 * with other users unless isLocationVisible is explicitly true.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        latitude: body.latitude,
        longitude: body.longitude,
        locationUpdatedAt: new Date(),
        ...(body.isLocationVisible !== undefined
          ? { isLocationVisible: body.isLocationVisible }
          : {}),
      },
      select: { latitude: true, longitude: true, isLocationVisible: true },
    });

    return NextResponse.json({ location: updated });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation_error" }, { status: 400 });
    }
    console.error("[profile/location]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
