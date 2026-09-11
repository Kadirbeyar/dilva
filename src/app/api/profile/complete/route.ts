import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser, AuthError } from "@/lib/auth";
import { calculateAge, MIN_SIGNUP_AGE } from "@/lib/age";
import { createClient } from "@/lib/supabase/server";
import { WORLD_COUNTRIES } from "@/lib/countries";
import { applyReferralIfEligible } from "@/lib/referral";

const languageSelectionSchema = z.object({
  code: z.string().min(2),
  proficiency: z
    .enum(["BEGINNER", "ELEMENTARY", "INTERMEDIATE", "ADVANCED", "FLUENT"])
    .optional(),
});

const bodySchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/, "letters, numbers and underscores only"),
  displayName: z.string().max(60).optional(),
  bio: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional().or(z.literal("")),
  // Mandatory, same as the languages below — every profile must say
  // which country the user is from. Picked from a fixed list (not
  // free text) so lib/matching.ts's exact-string country filter
  // actually matches between two users.
  country: z.enum(WORLD_COUNTRIES as [string, ...string[]]),
  city: z.string().max(60).optional(),
  // Mandatory — every profile must state an age (see lib/age.ts for
  // the minimum), enforced below rather than as a DB constraint so
  // it doesn't break already-onboarded rows.
  birthDate: z.string().refine((v) => !Number.isNaN(Date.parse(v)), "invalid date"),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  nativeLanguages: z.array(languageSelectionSchema).min(1),
  targetLanguages: z.array(languageSelectionSchema).min(1).max(4),
  // Captured once, client-side, by the mandatory location check on
  // the onboarding form (verifies the GPS coordinates resolve to the
  // same country picked above) — stored so the account already has
  // coordinates for the Premium "Nearby" feature without asking
  // again. Optional here only so already-onboarded profile edits
  // that reuse this same schema don't break; the onboarding page
  // itself never submits without them.
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  // Referrer's username, carried through from a ?ref=<username> signup
  // link (see the landing/signup pages, which stash it in
  // localStorage until onboarding finishes). Only ever applied on a
  // genuine first-time onboarding — see the isFirstOnboarding guard
  // below — so re-submitting this same form later (e.g. from
  // Settings) can never retroactively attach or change a referral.
  referralCode: z.string().max(30).optional(),
});

/**
 * Finishes onboarding for the current Supabase-authenticated user:
 * sets their (self-chosen) username + profile fields and their
 * native/target languages, which feed the matching engine.
 */
export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const json = await req.json();
    const body = bodySchema.parse(json);

    const birthDate = new Date(body.birthDate);
    if (calculateAge(birthDate) < MIN_SIGNUP_AGE) {
      return NextResponse.json(
        { error: "underage", minAge: MIN_SIGNUP_AGE },
        { status: 400 }
      );
    }

    // Case-insensitive on purpose: "Ahmad" and "ahmad" must collide
    // here, matching the functional unique index added on
    // lower(username) in prisma/sql/17_username_login.sql — otherwise
    // two case-variant accounts could exist that a username-based
    // login (see /api/auth/login) could never tell apart.
    const usernameOwner = await prisma.user.findFirst({
      where: { username: { equals: body.username, mode: "insensitive" } },
      select: { id: true },
    });
    if (usernameOwner && usernameOwner.id !== user.id) {
      return NextResponse.json(
        { error: "username_taken" },
        { status: 409 }
      );
    }

    // Country is locked after it's first set (see Settings, where the
    // field is shown disabled): it was verified against the user's
    // real GPS location at signup, and letting it be silently changed
    // afterward — whether from the UI or a hand-crafted request to
    // this same endpoint — would undo that verification. Once
    // user.country is already set, ignore whatever the request sent
    // and keep the existing value; only a first-time onboarding
    // (country still null) actually applies body.country.
    const country = user.country ?? body.country;
    // Same signal used for the country lock above: country is only
    // ever null before a user's very first onboarding submit. Reusing
    // it here means a later profile edit (Settings reuses this same
    // endpoint) can never retroactively attach a referral just because
    // the request happens to include a leftover/forged referralCode.
    const isFirstOnboarding = user.country == null;

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const profile = await tx.user.update({
        where: { id: user.id },
        data: {
          username: body.username,
          displayName: body.displayName,
          bio: body.bio,
          avatarUrl: body.avatarUrl || undefined,
          country,
          city: body.city,
          birthDate,
          gender: body.gender,
          // Being discoverable on the "Nearby" map is mandatory now,
          // not an opt-in toggle (see nearby/page.tsx) — since
          // supplying coordinates is itself already a mandatory part
          // of onboarding (the location-match check on this same
          // form), there is no separate visibility step left to ask
          // for: having coordinates at all means being visible.
          ...(body.latitude != null && body.longitude != null
            ? {
                latitude: body.latitude,
                longitude: body.longitude,
                locationUpdatedAt: new Date(),
                isLocationVisible: true,
              }
            : {}),
        },
      });

      // Replace language selections wholesale — simplest correct
      // behaviour for an onboarding/edit-profile form.
      await tx.userLanguage.deleteMany({ where: { userId: user.id } });
      await tx.userLanguage.createMany({
        data: [
          ...body.nativeLanguages.map((l, i) => ({
            userId: user.id,
            languageCode: l.code,
            type: "NATIVE" as const,
            isPrimary: i === 0,
          })),
          ...body.targetLanguages.map((l, i) => ({
            userId: user.id,
            languageCode: l.code,
            type: "LEARNING" as const,
            proficiency: l.proficiency ?? "BEGINNER",
            isPrimary: i === 0,
          })),
        ],
      });

      return profile;
    });

    // Marks this account as having finished onboarding, stored on the
    // Supabase session's own user_metadata rather than a DB column so
    // middleware can gate every page on it (redirecting anyone who
    // hasn't finished yet back to /onboarding) using the SAME
    // supabase.auth.getUser() call it already makes — no extra Prisma
    // query on every navigation, which matters given the connection
    // pool's connection_limit=1.
    const supabase = await createClient();
    await supabase.auth.updateUser({ data: { onboarded: true } });

    if (isFirstOnboarding && body.referralCode) {
      // Never lets a referral problem fail account creation — the
      // profile above is already saved at this point either way.
      try {
        await applyReferralIfEligible(user.id, body.referralCode);
      } catch (referralErr) {
        console.error("[profile/complete] referral", referralErr);
      }
    }

    return NextResponse.json({ user: updated });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "validation_error", issues: err.issues },
        { status: 400 }
      );
    }
    console.error("[profile/complete]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
