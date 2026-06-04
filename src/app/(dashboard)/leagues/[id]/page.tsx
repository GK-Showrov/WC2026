"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Crown, Copy, Trophy, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, getRankIcon } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";
import Link from "next/link";

type LeagueDetail = {
  id: string;
  name: string;
  description: string | null;
  code: string;
  ownerId: string;
  maxMembers: number;
  owner: { id: string; name: string | null; username: string };
  _count: { members: number };
  leaderboard: Array<{
    rank: number;
    userId: string;
    username: string;
    name: string | null;
    image: string | null;
    country: string | null;
    points: number;
  }>;
};

export default function LeagueDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [league, setLeague] = useState<LeagueDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/leagues/${id}`)
      .then((r) => r.json())
      .then((d) => { setLeague(d.league); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, [id]);

  const copyCode = () => {
    if (!league) return;
    navigator.clipboard.writeText(league.code);
    toast({ title: "Code copied!", description: `Share ${league.code} with friends` });
  };

  if (isLoading) return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="loading-skeleton h-24 rounded-xl" />
      <div className="loading-skeleton h-96 rounded-xl" />
    </div>
  );

  if (!league) return (
    <div className="text-center py-20">
      <p className="text-muted-foreground">League not found</p>
      <Link href="/leagues"><Button className="mt-4">Back to Leagues</Button></Link>
    </div>
  );

  const isOwner = league.ownerId === session?.user?.id;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/leagues" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" />
        Back to Leagues
      </Link>

      {/* League info */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 border-gold/20 bg-gold/5"
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-gold/20 border border-gold/30 flex items-center justify-center text-3xl">
            🏆
          </div>
          <div className="flex-1">
            <h1 className="font-display font-black text-2xl flex items-center gap-2">
              {league.name}
              {isOwner && <Crown className="w-5 h-5 text-gold" />}
            </h1>
            {league.description && <p className="text-muted-foreground">{league.description}</p>}
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {league._count.members} / {league.maxMembers} members
              </span>
              <span>Owner: @{league.owner.username}</span>
            </div>
          </div>
          {isOwner && (
            <button
              onClick={copyCode}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
            >
              <Copy className="w-4 h-4 text-gold" />
              <span className="font-mono font-bold text-gold tracking-widest">{league.code}</span>
            </button>
          )}
        </div>
      </motion.div>

      {/* Leaderboard */}
      <div className="glass-card overflow-hidden">
        <div className="p-5 border-b border-white/5 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-gold" />
          <h2 className="font-display font-bold text-lg">League Rankings</h2>
        </div>

        {league.leaderboard.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No predictions yet — start predicting to see rankings!
          </div>
        ) : (
          <div>
            {league.leaderboard.map((entry, i) => {
              const isMe = entry.userId === session?.user?.id;
              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 border-b border-white/3",
                    isMe && "bg-gold/5"
                  )}
                >
                  <div className="w-10 text-center">
                    {i < 3 ? (
                      <span className="text-xl">{getRankIcon(entry.rank)}</span>
                    ) : (
                      <span className={cn("font-bold text-sm", isMe ? "text-gold" : "text-muted-foreground")}>
                        {entry.rank}
                      </span>
                    )}
                  </div>
                  <div className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm",
                    isMe ? "bg-gold/20 text-gold" : "bg-white/10"
                  )}>
                    {(entry.name?.[0] || entry.username[0]).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn("font-medium text-sm", isMe && "text-gold")}>
                      {entry.name || entry.username}
                      {isMe && " (You)"}
                    </div>
                    <div className="text-xs text-muted-foreground">@{entry.username}</div>
                  </div>
                  <div className="font-bold text-gold">{entry.points}pts</div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
