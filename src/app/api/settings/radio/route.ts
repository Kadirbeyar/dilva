import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireAdmin, AuthError, ForbiddenError } from "@/lib/auth";
import { getAppSettings, setRadioSetting } from "@/lib/appSettings";

/** Any signed-in user can read the current radio stream URL (or null if none is set yet). */
export async function GET() {
  try {
    await requireUser();
    const settings = await getAppSettings();
    return NextResponse.json(settings);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[settings/radio:GET]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const schema = z.object({
  radioStreamUrl: z.string().url().optional().or(z.literal("")),
  radioLabel: z.string().max(60).optional().or(z.literal("")),
});

/** Admin-only: change (or clear) the radio stream URL shown to everyone. */
export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await req.json());
    const updated = await setRadioSetting(body.radioStreamUrl || null, body.radioLabel || null);
    return NextResponse.json({
      radioStreamUrl: updated.radioStreamUrl,
      radioLabel: updated.radioLabel,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation_error" }, { status: 400 });
    }
    console.error("[settings/radio:PATCH]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
