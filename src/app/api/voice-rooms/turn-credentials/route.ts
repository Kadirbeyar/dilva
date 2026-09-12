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
 * Fix: a free metered.ca account's own TURN Server product. Their
 * current dashboard ("TURN Server" → "TURN Credentials" → "Add
 * Credential") hands you a Username + Password pair that authenticate
 * against FIXED global relay hostnames — stun.relay.metered.ca and
 * global.relay.metered.ca — confirmed directly from that credential's
 * own "Show ICE Servers Array" panel. There is no per-app subdomain
 * to configure (an earlier version of this file assumed the older
 * <subdomain>.metered.live pattern metered.ca has since moved away
 * from). Set:
 *   METERED_TURN_USERNAME   the "Username" column value
 *   METERED_TURN_PASSWORD   the "Password" column value
 *
 * Until both are configured, this returns iceServers: null and the
 * client falls back to STUN-only — calls between two devices on the
 * SAME network will still work, cross-network ones may not.
 */
export async function GET() {
  try {
    await requireUser();

    const username = process.env.METERED_TURN_USERNAME;
    const password = process.env.METERED_TURN_PASSWORD;
    if (!username || !password) {
      return NextResponse.json({ iceServers: null });
    }

    const iceServers = [
      { urls: "stun:stun.relay.metered.ca:80" },
      { urls: "turn:global.relay.metered.ca:80", username, credential: password },
      { urls: "turn:global.relay.metered.ca:80?transport=tcp", username, credential: password },
      { urls: "turn:global.relay.metered.ca:443", username, credential: password },
      { urls: "turns:global.relay.metered.ca:443?transport=tcp", username, credential: password },
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
