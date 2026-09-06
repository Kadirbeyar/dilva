import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUser, AuthError } from "@/lib/auth";
import { translateText, toLibreTranslateCode, TranslateError } from "@/lib/translate";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  text: z.string().min(1).max(4000),
  target: z.string().min(2),
  source: z.string().optional(),
  // If provided, cache the result against this message so we don't
  // re-translate the same text every time it's rendered.
  messageId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    await requireUser();
    const { text, target, source, messageId } = schema.parse(await req.json());
    const targetCode = toLibreTranslateCode(target);

    if (messageId) {
      const cached = await prisma.messageTranslation.findUnique({
        where: { messageId_targetLanguageCode: { messageId, targetLanguageCode: target } },
      });
      if (cached) {
        return NextResponse.json({ translatedText: cached.translatedText, cached: true });
      }
    }

    const translatedText = await translateText(text, targetCode, source ? toLibreTranslateCode(source) : "auto");

    if (messageId) {
      await prisma.messageTranslation.upsert({
        where: { messageId_targetLanguageCode: { messageId, targetLanguageCode: target } },
        update: { translatedText },
        create: { messageId, targetLanguageCode: target, translatedText },
      });
    }

    return NextResponse.json({ translatedText, cached: false });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "validation_error" }, { status: 400 });
    }
    if (err instanceof TranslateError) {
      return NextResponse.json({ error: "translation_unavailable" }, { status: 502 });
    }
    console.error("[translate]", err);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
