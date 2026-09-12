import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { requirePremium, PremiumRequiredError } from "@/lib/premium";
import { findNearbyUsers } from "@/lib/geo";

const VALID_GENDERS = new Set(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]);

/** Premium-only: list nearby language partners for the map. */
export async function GET(req: Request) {
  try {
    const user = await requireUser();
    await requirePremium(user.id);

    const { searchParams } = new URL(req.url);
    const radiusKm = Number(searchParams.get("radiusKm") ?? 50);
    // Nearby is already all-Premium, so no separate re-check is needed
    // here the way matches/route.ts re-checks its filters against a
    // non-Premium caller — anyone who reached this line is already
    // Premium (requirePremium above would have thrown otherwise).
    const genderParam = searchParams.get("gender");
    const gender = genderParam && VALID_GENDERS.has(genderParam) ? genderParam : null;

    // Coordinates here are already fuzzed per-user (see lib/geo.ts) —
    // the frontend's marker-cluster map groups/ungroups them by zoom
    // level, HelloTalk-style, without ever having anyone's exact
    // real location to plot in the first place.
    const users = await findNearbyUsers(user.id, radiusKm, 50, gender);
    // Include the viewer's own last-saved coordinates so the client can
    // center the map on page load without needing a fresh geolocation
    // prompt every time (see nearby/page.tsx — previously the map never
    // rendered on a normal page load because `center` was only ever set
    // inside the "share my location" button flow).
    return NextResponse.json({
      users,
      center: user.latitude != null && user.longitude != null
        ? { lat: user.latitude, lng: user.longitude }
        : null,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof PremiumRequiredError) {
      return NextResponse.json({ error: "premium_required" }, { status: 402 });
    }
    if (err instanceof Error && err.message === "Current user has no location set") {
      return NextResponse.json({ error: "location_not_set" }, { status: 400 });
    }
    console.error("[nearby]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
