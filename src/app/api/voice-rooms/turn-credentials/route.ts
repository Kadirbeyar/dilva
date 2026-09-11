import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";

/**
 * Returns TURN/STUN server credentials for the Voice Rooms WebRTC
 * mesh, built server-side so nothing secret is sent to the browser.
 *
 * Why this exists: plain STUN (the app's original setup) only works
 * when at least one side has a directly-reachable public IP — many
 * mobile/home ISPs (carrier-grade NAT especially) sit both sides
 * behind NAT that STUN can't punch through, which showed up as
 * peers seeing each other in the room (that's Realtime Presence, a
 * separate system) but the actual RTCPeerConnection never leaving
 * connectionState "disconnected" — no relay, no audio. The free
 * public TURN server this app first tried (openrelay.metered.ca with
 * static shared credentials) turned out to be a since-deprecated
 * legacy offering, not a maintained service.
 *
 * Fix: a free metered.ca account's own TURN Server product. Two ways
 * to wire it up, in the order this checks them:
 *
 * 1) Static credential (simplest — this is what the "TURN Server" →
 *    "TURN Credentials" → "Add Credential" button in the metered.ca
 *    dashboard directly hands you: a Username + Password pair, no
 *    "Projects"/API-key hunting needed — Projects are an
 *    Enterprise/Business-only feature, skip that button entirely).
 *    Set:
 *      METERED_TURN_SUBDOMAIN   e.g. "dilva" (your app's subdomain,
 *                               shown in the dashboard sidebar — the
 *                               URL becomes dilva.metered.live)
 *      METERED_TURN_USERNAME    the "Username" column value
 *      METERED_TURN_PASSWORD    the "Password" column value
 *
 * 2) Dynamic per-request credentials via metered.ca's REST API, if
 *    you have a per-credential API key (shown via that credential's
 *    "Instructions"/"Show API Key" action) instead of/in addition to
 *    the above. Set METERED_TURN_API_KEY alongside
 *    METERED_TURN_SUBDOMAIN and this takes priority.
 *
 * Until either is configured, this returns iceServers: null and the
 * client falls back to STUN-only — calls between two devices on the
 * SAME network will still work, cross-network ones may not.
 */
export async function GET() {
  try {
    await requireUser();

    const subdomain = process.env.METERED_TURN_SUBDOMAIN;
    if (!subdomain) {
      return NextResponse.json({ iceServers: null });
    }

    const apiKey = process.env.METERED_TURN_API_KEY;
    if (apiKey) {
      const res = await fetch(
        `https://${subdomain}.metered.live/api/v1/turn/credentials?apiKey=${encodeURIComponent(apiKey)}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        return NextResponse.json({ iceServers: await res.json() });
      }
      console.error("[voice-rooms/turn-credentials:GET] metered.ca REST call returned", res.status);
      // fall through to the static-credential path below, if configured
    }

    const username = process.env.METERED_TURN_USERNAME;
    const password = process.env.METERED_TURN_PASSWORD;
    if (!username || !password) {
      return NextResponse.json({ iceServers: null });
    }

    const iceServers = [
      { urls: `stun:${subdomain}.metered.live:80` },
      { urls: `turn:${subdomain}.metered.live:80`, username, credential: password },
      { urls: `turn:${subdomain}.metered.live:80?transport=tcp`, username, credential: password },
      { urls: `turn:${subdomain}.metered.live:443`, username, credential: password },
      { urls: `turn:${subdomain}.metered.live:443?transport=tcp`, username, credential: password },
    ];
    return NextResponse.json({ iceServers });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[voice-rooms/turn-credentials:GET]", err);
    return NextResponse.json({ iceServers: null });
  }
}
