import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";
import { BottomTabBar } from "@/components/layout/bottom-tab-bar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.email_confirmed_at) {
    redirect("/verify-email");
  }

  return (
    <>
      <Sidebar />
      <main className="md:pl-64 pb-16 md:pb-0 p-4 md:p-6 lg:p-8 min-h-screen">
        {children}
      </main>
      <BottomTabBar />
    </>
  );
}
