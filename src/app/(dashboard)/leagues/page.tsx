"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, LogIn, Copy, Trophy, Crown, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { useSession } from "next-auth/react";
import Link from "next/link";

type League = {
  id: string;
  name: string;
  description: string | null;
  code: string;
  ownerId: string;
  isPublic: boolean;
  maxMembers: number;
  createdAt: string;
  owner: { id: string; name: string | null; username: string };
  _count: { members: number };
};

export default function LeaguesPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "", isPublic: false, maxMembers: 50 });
  const [isCreating, setIsCreating] = useState(false);

  const loadLeagues = useCallback(async () => {
    setIsLoading(true);
    const res = await fetch("/api/leagues");
    const data = await res.json();
    setLeagues(data.leagues || []);
    setIsLoading(false);
  }, []);

  useEffect(() => { loadLeagues(); }, [loadLeagues]);

  const handleJoin = async () => {
    if (!joinCode.trim()) return;
    setIsJoining(true);
    try {
      const res = await fetch("/api/leagues/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: joinCode.trim().toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "Joined league! 🎉", description: `Welcome to ${data.league.name}` });
      setShowJoin(false);
      setJoinCode("");
      await loadLeagues();
    } catch (e: unknown) {
      toast({ title: "Failed to join", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.name.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/leagues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: "League created! 🏆", description: `Share code: ${data.league.code}` });
      setShowCreate(false);
      setCreateForm({ name: "", description: "", isPublic: false, maxMembers: 50 });
      await loadLeagues();
    } catch (e: unknown) {
      toast({ title: "Failed to create", description: (e as Error).message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Code copied!", description: `Share ${code} with friends` });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-black">
            <span className="gold-text">Private Leagues</span>
          </h1>
          <p className="text-muted-foreground mt-1">Compete with friends in your own league</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-white/20 hover:bg-white/5 gap-2"
            onClick={() => setShowJoin(!showJoin)}
          >
            <LogIn className="w-4 h-4" />
            Join
          </Button>
          <Button className="btn-gold gap-2" onClick={() => setShowCreate(!showCreate)}>
            <Plus className="w-4 h-4" />
            Create
          </Button>
        </div>
      </div>

      {/* Join League Panel */}
      <AnimatePresence>
        {showJoin && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-5 border-blue-500/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <LogIn className="w-4 h-4 text-blue-400" />
                Join a League
              </h3>
              <button onClick={() => setShowJoin(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="flex gap-3">
              <Input
                placeholder="Enter 8-character league code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                maxLength={8}
                className="bg-white/5 border-white/10 focus:border-gold/50 uppercase tracking-widest font-mono"
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              />
              <Button className="btn-gold whitespace-nowrap" onClick={handleJoin} disabled={isJoining || joinCode.length !== 8}>
                {isJoining ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create League Panel */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-5 border-gold/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <Plus className="w-4 h-4 text-gold" />
                Create New League
              </h3>
              <button onClick={() => setShowCreate(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>League Name</Label>
                <Input
                  placeholder="e.g. The Office Predictions"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((p) => ({ ...p, name: e.target.value }))}
                  className="bg-white/5 border-white/10 focus:border-gold/50"
                />
              </div>
              <div className="space-y-2">
                <Label>Description (optional)</Label>
                <Input
                  placeholder="What's this league about?"
                  value={createForm.description}
                  onChange={(e) => setCreateForm((p) => ({ ...p, description: e.target.value }))}
                  className="bg-white/5 border-white/10 focus:border-gold/50"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="space-y-2 flex-1">
                  <Label>Max Members</Label>
                  <Input
                    type="number"
                    min={2}
                    max={100}
                    value={createForm.maxMembers}
                    onChange={(e) => setCreateForm((p) => ({ ...p, maxMembers: Number(e.target.value) }))}
                    className="bg-white/5 border-white/10 focus:border-gold/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <div className="flex gap-2">
                    {[
                      { value: false, label: "Private" },
                      { value: true, label: "Public" },
                    ].map((opt) => (
                      <button
                        key={String(opt.value)}
                        onClick={() => setCreateForm((p) => ({ ...p, isPublic: opt.value }))}
                        className={cn(
                          "px-3 py-2 rounded-lg text-sm transition-all",
                          createForm.isPublic === opt.value
                            ? "bg-gold text-navy-950 font-bold"
                            : "bg-white/5 text-muted-foreground hover:bg-white/10"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <Button className="w-full btn-gold" onClick={handleCreate} disabled={isCreating || !createForm.name.trim()}>
                {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Create League
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leagues list */}
      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="loading-skeleton h-24 rounded-xl" />)}</div>
      ) : leagues.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 text-center"
        >
          <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-display font-bold text-xl mb-2">No leagues yet</h3>
          <p className="text-muted-foreground mb-6">Create a league and invite friends to compete</p>
          <div className="flex gap-3 justify-center">
            <Button className="btn-gold gap-2" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4" />
              Create League
            </Button>
            <Button variant="outline" className="border-white/20 gap-2" onClick={() => setShowJoin(true)}>
              <LogIn className="w-4 h-4" />
              Join with Code
            </Button>
          </div>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {leagues.map((league, i) => {
            const isOwner = league.ownerId === session?.user?.id;
            return (
              <motion.div
                key={league.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <Link href={`/leagues/${league.id}`}>
                  <div className="glass-card p-5 hover:border-gold/20 transition-all cursor-pointer group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-2xl">
                        🏆
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold truncate">{league.name}</h3>
                          {isOwner && <Crown className="w-4 h-4 text-gold flex-shrink-0" />}
                        </div>
                        {league.description && (
                          <p className="text-sm text-muted-foreground truncate">{league.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {league._count.members} / {league.maxMembers}
                          </span>
                          <span>Owner: {league.owner.username}</span>
                          {league.isPublic ? (
                            <span className="text-green-400">Public</span>
                          ) : (
                            <span className="text-blue-400">Private</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOwner && (
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              copyCode(league.code);
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-white/10 text-xs text-muted-foreground transition-all"
                          >
                            <Copy className="w-3 h-3" />
                            {league.code}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
