"use client";

import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SignOutButton({ label }: { label: string }) {
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button onClick={signOut} className="text-gray-500 hover:text-gray-800">
      {label}
    </button>
  );
}
