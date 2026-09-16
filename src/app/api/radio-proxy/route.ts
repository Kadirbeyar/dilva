import { NextResponse } from "next/server";
import { requireUser, AuthError } from "@/lib/auth";
import { getAppSettings } from "@/lib/appSettings";
import type { RadioStationCode } from "@/lib/radioStations";

// A live radio stream never ends on its own, but a Vercel serverless
// function does have a maximum execution time (10s on Hobby by
// default, more on paid plans) — this just asks for as much of that
// ceiling as the plan allows, so each individual proxied connection
// lasts as long as possible before the client's own auto-reconnect
// (see RadioPlayerButton.tsx) has to open a fresh one.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const URL_FIELD = {
  ku: "radioStreamUrlKu",
  tr: "radioStreamUrlTr",
  ar: "radioStreamUrlAr",
  en: "radioStreamUrlEn",
} as const satisfies Record<RadioStationCode, string>;

/**
 * Relays one of the four admin-configured radio streams (see
 * RadioSettingsForm) through Dilva's own HTTPS domain.
 *
 * Why this exists: most free/small radio hosts only serve their
 * stream over plain http://. Pointed at directly from an <audio src>
 * on Dilva's https:// pages, Chrome silently "autoupgrades" that
 * request to https first — and when the host has nothing listening
 * on https (the common case here), it drops the request entirely
 * rather than falling back to http, so the station never plays even
 * though the exact same link works fine typed directly into the
 * address bar (confirmed against a couple of real station URLs while
 * chasing this). Fetching the stream here, server-side, and
 * re-serving those bytes over Dilva's own https:// connection
 * sidesteps that: the browser never talks to the http:// host itself.
 *
 * Takes a station CODE, never an arbitrary URL, so this can't become
 * an open proxy for fetching whatever address a caller likes — only
 * the four stations an admin has actually configured.
 */
export async function GET(request: Request) {
  try {
    await requireUser();

    const { searchParams } = new URL(request.url);
    const station = searchParams.get("station") as RadioStationCode | null;
    if (!station || !(station in URL_FIELD)) {
      return NextResponse.json({ error: "unknown_station" }, { status: 400 });
    }

    const settings = await getAppSettings();
    const streamUrl = settings[URL_FIELD[station]];
    if (!streamUrl) {
      return NextResponse.json({ error: "station_not_configured" }, { status: 404 });
    }

    // Icy-MetaData: 0 — explicitly opt OUT of Shoutcast/Icecast's
    // periodic metadata frames interleaved into the raw audio bytes.
    // The <audio> element has no idea how to parse those out, so
    // asking the upstream server not to send them in the first place
    // keeps this a plain, playable audio stream on the other end.
    const upstream = await fetch(streamUrl, {
      headers: { "Icy-MetaData": "0", "User-Agent": "Dilva/1.0" },
      cache: "no-store",
    });

    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
    }

    return new NextResponse(upstream.body, {
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[radio-proxy:GET]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
