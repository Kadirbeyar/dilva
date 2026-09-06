import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware wrappers around Next.js navigation APIs — always use
// these (not the plain next/link, next/navigation ones) so links keep
// the current /ku|/tr|/en prefix automatically.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
