import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireAdmin, AuthError, ForbiddenError } from "@/lib/auth";
import { getAppSettings, setRadioStations } from "@/lib/appSettings";

/** Any signed-in user can read the current per-station stream URLs (each null if that station isn't set up yet). */
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

// Each of the four stations is independently optional — an empty
// string clears that one station (hides it from the picker) without
// touching the other three.
const urlField = z.string().url().optional().or(z.literal(""));
const schema = z.object({
  radioStreamUrlKu: urlField,
  radioStreamUrlTr: urlField,
  radioStreamUrlAr: urlField,
  radioStreamUrlEn: urlField,
});

/** Admin-only: change (or clear) any of the four station stream URLs shown to everyone. */
export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await req.json());
    const updated = await setRadioStations({
      ku: body.radioStreamUrlKu || null,
      tr: body.radioStreamUrlTr || null,
      ar: body.radioStreamUrlAr || null,
      en: body.radioStreamUrlEn || null,
    });
    return NextResponse.json({
      radioStreamUrlKu: updated.radioStreamUrlKu,
      radioStreamUrlTr: updated.radioStreamUrlTr,
      radioStreamUrlAr: updated.radioStreamUrlAr,
      radioStreamUrlEn: updated.radioStreamUrlEn,
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
