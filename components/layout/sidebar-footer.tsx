"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/lib/hooks/use-auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

function getInitials(email: string): string {
  return email.charAt(0).toUpperCase();
}

function getColorFromEmail(email: string): string {
  const colors = [
    "#6366f1", "#10b981", "#f59e0b", "#ef4444",
    "#8b5cf6", "#ec4899", "#06b6d4", "#f97316",
  ];
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function SidebarFooter() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const clearUser = useAuthStore((state) => state.clearUser);
  const email = user?.email ?? "";

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    clearUser();
    router.push("/login");
  }

  return (
    <div className="border-t border-border p-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9">
          <AvatarFallback
            style={{ backgroundColor: getColorFromEmail(email) }}
            className="text-white text-sm font-medium"
          >
            {getInitials(email)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{email}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Logout">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
