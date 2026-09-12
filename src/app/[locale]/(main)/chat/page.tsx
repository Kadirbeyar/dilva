import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeIsOnline } from "@/lib/presence";
import PremiumCrown from "@/components/profile/PremiumCrown";
import VerifiedBadge from "@/components/profile/VerifiedBadge";

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

  // Unread counts per conversation — messages sent by the OTHER person
  // that this user hasn't marked read yet (see api/conversations/[id]/read,
  // which flips Message.isRead when the user opens a thread). One query
  // for every conversation's unread messages, counted in JS rather than
  // via prisma.message.groupBy(): groupBy's TypeScript types are a deep
  // conditional-generic chain, and combining it with a ternary fallback
  // (for the "no conversations yet" case) plus an explicit result type
  // was enough to derail that inference — it type-checked fine against
  // this project's local Prisma stub (no real database in this sandbox)
  // but failed the real build against the actual generated client. A
  // plain findMany + manual tally sidesteps groupBy's inference entirely
  // and is just as cheap for the small unread counts a chat list has.
  const unreadRows =
    conversations.length === 0
      ? []
      : await prisma.message.findMany({
          where: {
            conversationId: { in: conversations.map((c: (typeof conversations)[number]) => c.id) },
            senderId: { not: user.id },
            isRead: false,
          },
          select: { conversationId: true },
        });
  const unreadByConversation = new Map<string, number>();
  for (const row of unreadRows as { conversationId: string }[]) {
    unreadByConversation.set(row.conversationId, (unreadByConversation.get(row.conversationId) ?? 0) + 1);
  }

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
            const unread = unreadByConversation.get(c.id) ?? 0;
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
                      <p className="truncate font-semibold">
                        {other?.displayName || other?.username}
                        {other?.isPremiumCached && <VerifiedBadge size="sm" />}
                      </p>
                      {last && (
                        <span className="shrink-0 text-[11px] text-gray-400 dark:text-gray-500">
                          {relativeTime(last.createdAt.toISOString())}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      {last && (
                        <p
                          className={`truncate text-sm ${
                            unread > 0
                              ? "font-semibold text-gray-900 dark:text-white"
                              : "text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {last.type === "AUDIO"
                            ? `🎤 ${t("voiceMessage")}`
                            : last.type === "IMAGE"
                              ? `📷 ${t("photoMessage")}`
                              : last.content}
                        </p>
                      )}
                      {unread > 0 && (
                        <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-semibold leading-none text-white">
                          {unread > 9 ? "9+" : unread}
                        </span>
                      )}
                    </div>
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
