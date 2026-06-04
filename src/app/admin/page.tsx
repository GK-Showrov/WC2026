import { prisma } from "@/lib/db";
import { Shield, Users, CalendarDays, Target, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { AdminSyncPanel } from "@/components/admin/AdminSyncPanel";

export const metadata = { title: "Admin — World Cup Predictor" };

export default async function AdminPage() {
  const [userCount, fixtureCount, predictionCount, betCount, totalWallet, statusCounts] =
    await Promise.all([
      prisma.user.count(),
      prisma.fixture.count(),
      prisma.prediction.count(),
      prisma.bet.count(),
      prisma.wallet.aggregate({ _sum: { balance: true } }),
      prisma.fixture.groupBy({ by: ["status"], _count: { id: true } }),
    ]);

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, name: true, username: true, email: true, createdAt: true, role: true },
  });

  const statsByStatus = Object.fromEntries(
    statusCounts.map((s) => [s.status, s._count.id])
  );

  const stats = [
    { label: "Total Users",   value: userCount,       icon: Users,        color: "text-blue-400",   bg: "from-blue-500/20"   },
    { label: "Fixtures",      value: fixtureCount,     icon: CalendarDays, color: "text-gold",       bg: "from-gold/20"       },
    { label: "Predictions",   value: predictionCount,  icon: Target,       color: "text-green-400",  bg: "from-green-500/20"  },
    { label: "Bets Placed",   value: betCount,         icon: TrendingUp,   color: "text-purple-400", bg: "from-purple-500/20" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-6 h-6 text-red-400" />
          <h1 className="font-display text-3xl font-black">Admin Dashboard</h1>
        </div>
        <p className="text-muted-foreground">Platform overview and management</p>
      </div>

      {/* ── Live Data Sync ─────────────────────────────────────────── */}
      <AdminSyncPanel />

      {/* ── Fixture status summary ──────────────────────────────────── */}
      <div className="glass-card p-4 flex flex-wrap gap-4 text-sm">
        <span className="font-medium text-muted-foreground">Fixture status:</span>
        <span className="text-blue-400 font-bold">{statsByStatus["SCHEDULED"] ?? 0} scheduled</span>
        <span className="text-red-400 font-bold">{statsByStatus["LIVE"] ?? 0} live</span>
        <span className="text-green-400 font-bold">{statsByStatus["COMPLETED"] ?? 0} completed</span>
      </div>

      {/* ── Stats grid ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className={`glass-card p-5 bg-gradient-to-br ${stat.bg} to-transparent`}>
            <stat.icon className={`w-5 h-5 ${stat.color} mb-3`} />
            <div className="font-display font-black text-2xl">{stat.value.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-gold" />Recent Users
            </h2>
            <Link href="/admin/users" className="text-xs text-gold hover:text-gold/80">View all</Link>
          </div>
          {recentUsers.map((user) => (
            <div key={user.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center font-bold text-sm">
                {(user.name?.[0] || user.username[0]).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user.name || user.username}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
              {user.role === "ADMIN" && (
                <span className="text-xs px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded">Admin</span>
              )}
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="glass-card p-5 space-y-3">
          <h2 className="font-bold flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-400" />Quick Actions
          </h2>
          {[
            { label: "Manage Fixtures & Results", href: "/admin/fixtures", icon: CalendarDays, desc: "Manually update match scores" },
            { label: "Manage Users",              href: "/admin/users",    icon: Users,        desc: "Edit roles, adjust balances" },
          ].map((a) => (
            <Link key={a.href} href={a.href}>
              <div className="flex items-center gap-4 p-4 rounded-lg bg-white/3 hover:bg-white/5 transition-all cursor-pointer group">
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <a.icon className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <div className="font-medium text-sm group-hover:text-gold transition-colors">{a.label}</div>
                  <div className="text-xs text-muted-foreground">{a.desc}</div>
                </div>
              </div>
            </Link>
          ))}
          <div className="p-4 rounded-lg bg-gold/5 border border-gold/20">
            <div className="flex items-center gap-2 mb-1">
              <Wallet className="w-4 h-4 text-gold" />
              <span className="font-medium text-sm">Total Virtual Currency</span>
            </div>
            <div className="font-display font-black text-xl text-gold">
              £{(totalWallet._sum.balance || 0).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-muted-foreground">Across all wallets</div>
          </div>
        </div>
      </div>
    </div>
  );
}
