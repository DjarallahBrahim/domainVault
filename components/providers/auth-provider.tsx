"use client";

import { useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { useAuthStore } from "@/lib/hooks/use-auth";

/**
 * Hydrates the client auth store with the user resolved on the server so
 * components like the settings page and sidebar footer can read it.
 */
export function AuthProvider({ user }: { user: User | null }) {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    setUser(user);
  }, [user, setUser]);

  return null;
}
