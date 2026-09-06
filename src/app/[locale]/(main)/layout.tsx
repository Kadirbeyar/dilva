import { getCurrentUser } from "@/lib/auth";
import NavBar from "@/components/layout/NavBar";
import MobileShell from "@/components/layout/MobileShell";
import NavBadgeProvider from "@/components/layout/NavBadgeProvider";
import PresenceHeartbeat from "@/components/layout/PresenceHeartbeat";
import RadioPlayerButton from "@/components/layout/RadioPlayerButton";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-dvh flex-col">
      {user && <PresenceHeartbeat />}
      {user && <RadioPlayerButton />}
      <NavBadgeProvider enabled={Boolean(user)}>
        <NavBar
          user={
            user
              ? {
                  username: user.username,
                  displayName: user.displayName,
                  avatarUrl: user.avatarUrl,
                  isAdmin: user.isAdmin,
                }
              : null
          }
        />
        <MobileShell user={user ? { username: user.username } : null}>{children}</MobileShell>
      </NavBadgeProvider>
    </div>
  );
}
