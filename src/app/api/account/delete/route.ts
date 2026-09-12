import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Permanently deletes the signed-in user's account: their Supabase Auth
 * identity AND every row Prisma's schema cascades from User (posts,
 * messages, follows, subscription, voice rooms, notifications, etc. —
 * see schema.prisma, every User relation is onDelete: Cascade or
 * SetNull, so a single prisma.user.delete does the rest). Irreversible
 * — the Settings page requires typing a confirmation phrase before
 * calling this.
 *
 * Order matters: the auth identity is deleted FIRST. If the DB step
 * below then failed partway for some reason, the account would still
 * be unusable (can't sign in, most data already gone) rather than
 * fully alive with silently missing pieces — the safer of the two
 * failure modes for something this irreversible.
 */
export async function POST() {
  try {
    const user = await requireUser();

    try {
      const admin = createServiceRoleClient();
      await admin.auth.admin.deleteUser(user.id);
    } catch (authDeleteErr) {
      console.error("[account/delete] auth.admin.deleteUser failed", authDeleteErr);
      return NextResponse.json({ error: "server_error" }, { status: 500 });
    }

    await prisma.user.delete({ where: { id: user.id } });

    // Clear the now-dangling session cookie in this browser right away,
    // rather than waiting for the next getUser() call to notice the
    // auth user is gone.
    const supabase = await createClient();
    await supabase.auth.signOut();

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[account/delete]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
