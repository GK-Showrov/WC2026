"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Trophy,
  TrendingUp,
  Users,
  Globe,
  Star,
  ArrowRight,
  ChevronRight,
  Zap,
  Shield,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 },
  },
};

const features = [
  {
    icon: <Trophy className="w-6 h-6" />,
    title: "Predict & Earn",
    description:
      "Predict match results and earn points. Exact scores earn 10 points, correct winner gets 3 points.",
    color: "from-yellow-500/20 to-orange-500/20",
    border: "border-yellow-500/30",
  },
  {
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Virtual Betting",
    description:
      "Start with £1,000 virtual currency. Place smart bets with real-time odds. No real money involved.",
    color: "from-green-500/20 to-emerald-500/20",
    border: "border-green-500/30",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: "Private Leagues",
    description:
      "Create private leagues, invite friends, and compete in your own exclusive leaderboard.",
    color: "from-blue-500/20 to-indigo-500/20",
    border: "border-blue-500/30",
  },
  {
    icon: <Globe className="w-6 h-6" />,
    title: "Global Leaderboard",
    description:
      "Compete against players worldwide. Climb the rankings and prove you're the ultimate predictor.",
    color: "from-purple-500/20 to-pink-500/20",
    border: "border-purple-500/30",
  },
  {
    icon: <Star className="w-6 h-6" />,
    title: "Achievements",
    description:
      "Unlock badges and achievements as you predict, win bets, and reach milestones.",
    color: "from-gold/20 to-amber-500/20",
    border: "border-gold/30",
  },
  {
    icon: <BarChart3 className="w-6 h-6" />,
    title: "Deep Statistics",
    description:
      "Track your performance with detailed stats, prediction history, and betting analytics.",
    color: "from-cyan-500/20 to-teal-500/20",
    border: "border-cyan-500/30",
  },
];

const stats = [
  { value: "104", label: "Matches", prefix: "", suffix: "" },
  { value: "48", label: "Teams", prefix: "", suffix: "" },
  { value: "1K", label: "Starting Balance", prefix: "£", suffix: "" },
  { value: "3", label: "Host Nations", prefix: "", suffix: "" },
];

const scoringRules = [
  { points: 10, label: "Exact Score", icon: "🎯", color: "text-gold" },
  { points: 5, label: "Correct Goal Difference", icon: "⚡", color: "text-blue-400" },
  { points: 3, label: "Correct Winner / Draw", icon: "✓", color: "text-green-400" },
  { points: 0, label: "Incorrect Prediction", icon: "✗", color: "text-red-400" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md bg-navy-950/80 border-b border-white/5">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
            <Trophy className="w-5 h-5 text-navy-950" />
          </div>
          <span className="font-display font-bold text-lg">
            World Cup <span className="gold-text">Predictor</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
          <Link href="#scoring" className="hover:text-foreground transition-colors">How it Works</Link>
          <Link href="#prizes" className="hover:text-foreground transition-colors">Leaderboard</Link>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Sign In
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="btn-gold">
              Get Started
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden stadium-bg pt-16">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-navy-600/10 rounded-full blur-3xl" />
        </div>

        {/* Pitch lines overlay */}
        <div className="absolute inset-0 pitch-lines opacity-30" />

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8 flex justify-center"
          >
            <div className="relative">
              <div className="w-28 h-28 bg-gradient-to-br from-gold-500 to-gold-600 rounded-full flex items-center justify-center shadow-gold-lg animate-float">
                <Trophy className="w-14 h-14 text-navy-950 trophy-glow" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold animate-pulse">
                LIVE
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold/10 border border-gold/30 text-gold text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              FIFA World Cup 2026 — USA · Canada · Mexico
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="font-display text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight tracking-tight"
          >
            Predict.{" "}
            <span className="gold-text">Bet.</span>
            {" "}Win.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            The ultimate FIFA World Cup 2026 prediction platform.{" "}
            <span className="text-gold font-semibold">48 teams. 104 matches.</span> Start with{" "}
            <span className="text-gold font-semibold">£1,000 virtual currency</span>, predict matches,
            place bets, and compete on global leaderboards.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
          >
            <Link href="/register">
              <Button size="lg" className="btn-gold px-8 py-6 text-lg font-bold h-auto">
                Start Predicting Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="outline"
                className="px-8 py-6 text-lg h-auto border-white/20 hover:bg-white/5"
              >
                Sign In
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto"
          >
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="glass-card p-4 text-center"
              >
                <div className="text-3xl font-display font-black gold-text">
                  {stat.prefix}{stat.value}{stat.suffix}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground"
        >
          <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
          <div className="w-6 h-10 border border-white/20 rounded-full flex items-start justify-center p-1">
            <motion.div
              animate={{ y: [0, 14, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-1.5 h-1.5 bg-gold rounded-full"
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 px-4 bg-navy-950 relative">
        <div className="absolute inset-0 pitch-lines opacity-10" />
        <div className="max-w-6xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-gold text-sm font-semibold uppercase tracking-widest">Features</span>
            <h2 className="font-display text-4xl md:text-5xl font-black mt-3 mb-4">
              Everything You Need to
              <br />
              <span className="gold-text">Dominate the Tournament</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A complete prediction and virtual betting platform built for football fans.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className={`glass-card p-6 border hover:border-gold/20 transition-all duration-300 bg-gradient-to-br ${feature.color} ${feature.border}`}
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-4 text-gold">
                  {feature.icon}
                </div>
                <h3 className="font-display font-bold text-lg mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Scoring Section */}
      <section id="scoring" className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 to-navy-950" />
        <div className="max-w-5xl mx-auto relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-gold text-sm font-semibold uppercase tracking-widest">How It Works</span>
            <h2 className="font-display text-4xl md:text-5xl font-black mt-3 mb-4">
              Simple{" "}
              <span className="gold-text">Scoring System</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              The more accurate your predictions, the more points you earn.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-4"
            >
              {scoringRules.map((rule, i) => (
                <div key={i} className="glass-card p-5 flex items-center gap-5 hover:border-gold/20 transition-all duration-300">
                  <div className="text-3xl">{rule.icon}</div>
                  <div className="flex-1">
                    <div className={`font-display font-bold text-2xl ${rule.color}`}>
                      {rule.points} pts
                    </div>
                    <div className="text-muted-foreground text-sm">{rule.label}</div>
                  </div>
                  <div className={`w-2 h-12 rounded-full ${
                    rule.points === 10 ? "bg-gold" :
                    rule.points === 5 ? "bg-blue-400" :
                    rule.points === 3 ? "bg-green-400" : "bg-red-400/30"
                  }`} />
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass-card p-8 text-center"
            >
              <div className="text-6xl mb-4">⚽</div>
              <h3 className="font-display font-bold text-2xl mb-3">Plus Virtual Betting</h3>
              <p className="text-muted-foreground mb-6">
                Use your £1,000 starting balance to place virtual bets on match outcomes,
                exact scores, tournament winners, and more.
              </p>
              <div className="space-y-3 text-sm">
                {[
                  "Match Winner bets",
                  "Exact Score bets",
                  "Tournament Winner bets",
                  "Group Winner bets",
                  "Golden Boot bets",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-muted-foreground">
                    <div className="w-1.5 h-1.5 bg-gold rounded-full" />
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-6 p-3 bg-gold/10 rounded-lg border border-gold/20">
                <div className="text-xs text-gold font-medium">Virtual currency only — entertainment purposes</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-800/50 to-navy-950" />
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold/5 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative max-w-3xl mx-auto text-center"
        >
          <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center mx-auto mb-8 shadow-gold-lg">
            <Trophy className="w-10 h-10 text-navy-950" />
          </div>
          <h2 className="font-display text-5xl md:text-6xl font-black mb-6">
            Ready to Become the
            <br />
            <span className="gold-text">Ultimate Predictor?</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join thousands of fans competing for the top spot. Start with £1,000 virtual currency. Free forever.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <Button size="lg" className="btn-gold px-10 py-6 text-lg font-bold h-auto">
                Create Free Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="px-10 py-6 text-lg h-auto border-white/20 hover:bg-white/5">
                Sign In
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-green-400" />
            No real money. No deposits. Entertainment only.
          </p>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-white/5 bg-navy-950">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gold rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-navy-950" />
              </div>
              <span className="font-display font-bold">World Cup Predictor</span>
            </Link>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link href="/login" className="hover:text-foreground transition-colors">Sign In</Link>
              <Link href="/register" className="hover:text-foreground transition-colors">Register</Link>
              <span className="text-muted-foreground/40">|</span>
              <span>Virtual currency only — No real gambling</span>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/5 text-center text-sm text-muted-foreground">
            <p>© 2026 World Cup Predictor — FIFA World Cup 2026 (USA · Canada · Mexico). For entertainment purposes only. No real money involved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
