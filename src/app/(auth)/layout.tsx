import Link from "next/link";
import { Trophy } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex stadium-bg relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
      </div>
      <div className="absolute inset-0 pitch-lines opacity-20" />

      {/* Left panel — branding */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative z-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center">
            <Trophy className="w-6 h-6 text-navy-950" />
          </div>
          <span className="font-display font-bold text-xl">
            World Cup <span className="gold-text">Predictor</span>
          </span>
        </Link>

        <div>
          <div className="w-24 h-24 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center mb-8 shadow-gold-lg">
            <Trophy className="w-12 h-12 text-navy-950" />
          </div>
          <h1 className="font-display text-4xl font-black mb-4 leading-tight">
            Predict Every Match.
            <br />
            <span className="gold-text">Win Every Round.</span>
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            Join the ultimate FIFA World Cup prediction platform. Start with £1,000 virtual currency, predict matches, and climb the global leaderboard.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Virtual Currency", value: "£1,000" },
              { label: "Matches", value: "64+" },
              { label: "Achievements", value: "14+" },
            ].map((stat) => (
              <div key={stat.label} className="glass-card p-4 text-center">
                <div className="font-display font-bold text-xl gold-text">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Virtual currency only. No real money involved. For entertainment purposes.
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-navy-950" />
            </div>
            <span className="font-display font-bold text-lg">
              World Cup <span className="gold-text">Predictor</span>
            </span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
