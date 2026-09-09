import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";

const schema = z.object({
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  isLocationVisible: z.boolean().optional(),
});

/**
 * Sets the user's coordinates and/or visibility for the "Nearby" map.
 * latitude/longitude are optional so this can also be called as a
 * plain visibility toggle ({ isLocationVisible: false }) without
 * resending coordinates — see nearby/page.tsx's visibility switch,
 * which any signed-in user can use: being DISCOVERABLE on the map is
 * free for everyone, only VIEWING the map is Premium-gated (see
 * /api/nearby). Nothing is shared with other users unless
 * isLocationVisible is explicitly true.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(body.latitude !== undefined ? { latitude: body.latitude } : {}),
        ...(body.longitude !== undefined ? { longitude: body.longitude } : {}),
        ...(body.latitude !== undefined || body.longitude !== undefined
          ? { locationUpdatedAt: new Date() }
          : {}),
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
