import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";
import { AuthProvider } from "@/components/providers/auth-provider";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.email_confirmed_at) {
    redirect("/verify-email");
  }

  return (
    <div className="flex min-h-screen">
      <AuthProvider user={user} />
      <Sidebar />
      <main className="flex-1 min-w-0">
        <div className="w-full px-4 py-6 pb-28 md:px-6 md:py-8 md:pb-10 lg:px-8 xl:px-10">
          {children}
        </div>
      </main>
      <BottomTabBar />
    </div>
  );
}
