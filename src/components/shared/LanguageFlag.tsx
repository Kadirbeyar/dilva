import { KURDISH_CODES, LANGUAGE_FLAGS } from "@/lib/languageFlags";
import KurdistanFlagIcon from "./KurdistanFlagIcon";

/**
 * Renders a flag next to a language name — used in richer UI (chips,
 * profile tags, filter pickers) where actual markup is allowed. For
 * plain <select><option> text, use flagEmoji() from lib/languageFlags
 * instead (SVG can't render inside <option>).
 */
export default function LanguageFlag({
  code,
  className = "h-3.5 w-5 rounded-[2px] object-cover align-middle",
}: {
  code: string;
  className?: string;
}) {
  if (KURDISH_CODES.has(code)) {
    return <KurdistanFlagIcon className={className} />;
  }
  const emoji = LANGUAGE_FLAGS[code];
  if (emoji) {
    return <span className="align-middle">{emoji}</span>;
  }
  return <span className="align-middle" aria-hidden="true">🌐</span>;
}
