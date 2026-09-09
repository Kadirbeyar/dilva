import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, requireAdmin, AuthError, ForbiddenError } from "@/lib/auth";
import { getAppSettings, setManualPaymentSettings } from "@/lib/appSettings";

/** Any signed-in user can read the current bank/crypto payment instructions shown on /premium. */
export async function GET() {
  try {
    await requireUser();
    const settings = await getAppSettings();
    return NextResponse.json({
      manualPaymentBankInfo: settings.manualPaymentBankInfo,
      manualPaymentCryptoInfo: settings.manualPaymentCryptoInfo,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[settings/manual-payment:GET]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}

const schema = z.object({
  manualPaymentBankInfo: z.string().max(2000).optional().or(z.literal("")),
  manualPaymentCryptoInfo: z.string().max(2000).optional().or(z.literal("")),
});

/** Admin-only: change the bank/Qi Card + crypto instructions shown to everyone on /premium. */
export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const body = schema.parse(await req.json());
    const updated = await setManualPaymentSettings(
      body.manualPaymentBankInfo || null,
      body.manualPaymentCryptoInfo || null
    );
    return NextResponse.json({
      manualPaymentBankInfo: updated.manualPaymentBankInfo,
      manualPaymentCryptoInfo: updated.manualPaymentCryptoInfo,
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
    console.error("[settings/manual-payment:PATCH]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
