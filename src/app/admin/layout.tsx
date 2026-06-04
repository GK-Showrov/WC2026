import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield, LayoutDashboard, CalendarDays, Users, Trophy } from "lucide-react";

const adminNav = [
  { title: "Overview", href: "/admin", icon: LayoutDashboard },
  { title: "Fixtures", href: "/admin/fixtures", icon: CalendarDays },
  { title: "Users", href: "/admin/users", icon: Users },
  { title: "Leaderboard", href: "/admin/leaderboard", icon: Trophy },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-56 bg-red-950/10 border-r border-red-500/10 flex flex-col">
        <div className="p-4 border-b border-red-500/10">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-400" />
            <span className="font-bold text-red-400">Admin Panel</span>
          </div>
          <div className="text-xs text-muted-foreground mt-1">@{session.user.username}</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {adminNav.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.title}</span>
              </div>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-red-500/10">
          <Link href="/dashboard">
            <div className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Back to App</div>
          </Link>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
