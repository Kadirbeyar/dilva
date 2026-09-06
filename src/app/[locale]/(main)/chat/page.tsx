import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeIsOnline } from "@/lib/presence";
import PremiumCrown from "@/components/profile/PremiumCrown";

function relativeTime(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString();
}

export default async function ChatListPage() {
  const t = await getTranslations("chat");
  const user = await getCurrentUser();
  if (!user) return null; // middleware already redirects unauthenticated users

  const conversations = await prisma.conversation.findMany({
    where: { participants: { some: { userId: user.id } } },
    orderBy: { updatedAt: "desc" },
    include: {
      participants: {
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isOnline: true,
              lastSeenAt: true,
              isPremiumCached: true,
            },
          },
        },
      },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="px-1 text-2xl font-bold">{t("title")}</h1>

      {conversations.length === 0 ? (
        <p className="mt-8 px-1 text-gray-500 dark:text-gray-400">{t("noConversations")}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-1">
          {conversations.map((c: (typeof conversations)[number]) => {
            const other = c.participants.find((p) => p.userId !== user.id)?.user;
            const last = c.messages[0];
            const online = other ? computeIsOnline(other) : false;
            return (
              <li key={c.id}>
                <Link
                  href={`/chat/${c.id}` as any}
                  className="flex items-center gap-3 rounded-2xl px-2.5 py-2.5 transition hover:bg-white dark:hover:bg-gray-800"
                >
                  <div className="relative h-[52px] w-[52px] shrink-0 overflow-hidden rounded-full bg-gray-200 ring-2 ring-white dark:bg-gray-700 dark:ring-gray-900">
                    {other?.avatarUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={other.avatarUrl} alt="" className="h-full w-full object-cover" />
                    )}
                    {other?.isPremiumCached && <PremiumCrown />}
                    {online && (
                      <span className="absolute bottom-0 end-0 h-3 w-3 rounded-full border-2 border-white bg-green-500 dark:border-gray-900" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-semibold">{other?.displayName || other?.username}</p>
                      {last && (
                        <span className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
                          {relativeTime(last.createdAt.toISOString())}
                        </span>
                      )}
                    </div>
                    {last && (
                      <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                        {last.type === "AUDIO" ? `🎤 ${t("voiceMessage")}` : last.content}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
