"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Zap, CheckCircle, XCircle, Clock, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SyncResult = {
  success: boolean;
  message: string;
  syncedAt: string;
  results?: {
    openFootball: { fetched: number; updated: number; errors: number };
    espn:         { fetched: number; updated: number; errors: number };
    settled:      number;
  };
  fetched?: number;
  updated?: number;
  error?: string;
};

export function AdminSyncPanel() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLiveSyncing, setIsLiveSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncResult | null>(null);
  const [lastLiveResult, setLastLiveResult] = useState<SyncResult | null>(null);

  const doFullSync = async () => {
    setIsSyncing(true);
    setLastResult(null);
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      const data: SyncResult = await res.json();
      setLastResult(data);
    } catch {
      setLastResult({ success: false, message: "Network error", syncedAt: new Date().toISOString() });
    } finally {
      setIsSyncing(false);
    }
  };

  const doLiveSync = async () => {
    setIsLiveSyncing(true);
    setLastLiveResult(null);
    try {
      const res = await fetch("/api/admin/sync");
      const data: SyncResult = await res.json();
      setLastLiveResult(data);
    } catch {
      setLastLiveResult({ success: false, message: "Network error", syncedAt: new Date().toISOString() });
    } finally {
      setIsLiveSyncing(false);
    }
  };

  return (
    <div className="glass-card p-5 border-blue-500/20 bg-blue-500/3">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <Database className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="font-bold">Live Data Sync</h2>
          <p className="text-xs text-muted-foreground">
            Pull real FIFA WC 2026 fixtures &amp; scores from openfootball + ESPN
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        {/* Full sync */}
        <button
          onClick={doFullSync}
          disabled={isSyncing || isLiveSyncing}
          className={cn(
            "p-4 rounded-xl border text-left transition-all",
            "bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20",
            "hover:border-blue-500/40 hover:bg-blue-500/15",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <RefreshCw className={cn("w-4 h-4 text-blue-400", isSyncing && "animate-spin")} />
            <span className="font-semibold text-sm">Full Sync</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Fetches complete schedule + all results from openfootball, then overlays today&apos;s live scores from ESPN.
            Awards points &amp; settles bets for completed matches.
          </p>
          <div className="mt-3">
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs h-7 px-3"
              disabled={isSyncing || isLiveSyncing}
              onClick={(e) => { e.stopPropagation(); doFullSync(); }}
            >
              {isSyncing ? (
                <><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Syncing…</>
              ) : (
                <><Database className="w-3 h-3 mr-1" />Run Full Sync</>
              )}
            </Button>
          </div>
        </button>

        {/* Live-only sync */}
        <button
          onClick={doLiveSync}
          disabled={isSyncing || isLiveSyncing}
          className={cn(
            "p-4 rounded-xl border text-left transition-all",
            "bg-gradient-to-br from-red-500/10 to-transparent border-red-500/20",
            "hover:border-red-500/40 hover:bg-red-500/15",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          <div className="flex items-center gap-2 mb-1">
            <Zap className={cn("w-4 h-4 text-red-400", isLiveSyncing && "animate-pulse")} />
            <span className="font-semibold text-sm">Live Scores Only</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Quick refresh — fetches only today&apos;s matches from ESPN. Run during a match day for
            real-time score updates.
          </p>
          <div className="mt-3">
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-500 text-white text-xs h-7 px-3"
              disabled={isSyncing || isLiveSyncing}
              onClick={(e) => { e.stopPropagation(); doLiveSync(); }}
            >
              {isLiveSyncing ? (
                <><Zap className="w-3 h-3 mr-1 animate-pulse" />Refreshing…</>
              ) : (
                <><Zap className="w-3 h-3 mr-1" />Refresh Live</>
              )}
            </Button>
          </div>
        </button>
      </div>

      {/* Data sources info */}
      <div className="flex flex-wrap gap-3 text-xs text-muted-foreground border-t border-white/5 pt-3">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-blue-400 rounded-full" />
          <strong className="text-foreground">openfootball</strong> — full schedule &amp; results (GitHub, no key)
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 bg-orange-400 rounded-full" />
          <strong className="text-foreground">ESPN</strong> — live scores (public API, no key)
        </span>
      </div>

      {/* Sync result feedback */}
      <AnimatePresence>
        {(lastResult || lastLiveResult) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 overflow-hidden"
          >
            {[
              { result: lastResult,     label: "Full Sync" },
              { result: lastLiveResult, label: "Live Sync" },
            ].map(({ result, label }) =>
              result ? (
                <div
                  key={label}
                  className={cn(
                    "p-3 rounded-lg text-xs flex items-start gap-2 mb-2",
                    result.success
                      ? "bg-green-500/10 border border-green-500/20 text-green-300"
                      : "bg-red-500/10 border border-red-500/20 text-red-300"
                  )}
                >
                  {result.success
                    ? <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    : <XCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                  <div>
                    <span className="font-semibold">{label}: </span>
                    {result.message || (result.success ? "Success" : result.error)}
                    {result.results && (
                      <span className="ml-2 text-white/60">
                        openfootball: {result.results.openFootball.updated} updated ·
                        ESPN: {result.results.espn.updated} updated ·
                        {result.results.settled} matches settled
                      </span>
                    )}
                    {result.updated !== undefined && (
                      <span className="ml-2 text-white/60">
                        {result.fetched} fetched · {result.updated} updated
                      </span>
                    )}
                    <span className="ml-2 opacity-50 flex items-center gap-1 inline-flex">
                      <Clock className="w-3 h-3" />
                      {new Date(result.syncedAt).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
              ) : null
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
