"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, Mail, Lock, User, Chrome, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { registerSchema, type RegisterInput } from "@/lib/validations";

const countries = [
  "Argentina", "Australia", "Belgium", "Brazil", "Cameroon", "Canada",
  "Costa Rica", "Croatia", "Denmark", "Ecuador", "England", "France",
  "Germany", "Ghana", "Iran", "Japan", "Mexico", "Morocco", "Netherlands",
  "Poland", "Portugal", "Qatar", "Saudi Arabia", "Senegal", "Serbia",
  "South Korea", "Spain", "Switzerland", "Tunisia", "United States",
  "Uruguay", "Wales", "Other"
];

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast({
          title: "Registration failed",
          description: result.error || "Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Account created! 🎉",
        description: "Signing you in...",
      });

      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-8"
    >
      <div className="mb-8">
        <h2 className="font-display text-3xl font-black mb-2">Join the competition</h2>
        <p className="text-muted-foreground">Create your free account and get £1,000 to start</p>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full mb-6 h-12 border-white/20 hover:bg-white/5 gap-3"
        onClick={() => {
          setIsGoogleLoading(true);
          signIn("google", { callbackUrl: "/dashboard" });
        }}
        disabled={isGoogleLoading}
      >
        {isGoogleLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Chrome className="w-4 h-4" />
        )}
        Continue with Google
      </Button>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-3 text-muted-foreground">Or register with email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Full Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                className="pl-10 h-11 bg-white/5 border-white/10 focus:border-gold/50"
                {...register("name")}
              />
            </div>
            {errors.name && <p className="text-red-400 text-xs">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium">Username</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">@</span>
              <Input
                id="username"
                type="text"
                placeholder="yourname"
                className="pl-8 h-11 bg-white/5 border-white/10 focus:border-gold/50"
                {...register("username")}
              />
            </div>
            {errors.username && <p className="text-red-400 text-xs">{errors.username.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                className="pl-10 h-11 bg-white/5 border-white/10 focus:border-gold/50"
                autoComplete="email"
                {...register("email")}
              />
            </div>
            {errors.email && <p className="text-red-400 text-xs">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium">Password</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Min. 8 chars, 1 uppercase, 1 number"
                className="pl-10 pr-10 h-11 bg-white/5 border-white/10 focus:border-gold/50"
                autoComplete="new-password"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-red-400 text-xs">{errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="country" className="text-sm font-medium">
              Country <span className="text-muted-foreground">(optional)</span>
            </Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                id="country"
                className="w-full pl-10 h-11 bg-white/5 border border-white/10 rounded-md text-sm focus:border-gold/50 focus:outline-none appearance-none cursor-pointer"
                {...register("country")}
              >
                <option value="">Select your country</option>
                {countries.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-12 btn-gold font-bold text-base mt-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create Free Account"
          )}
        </Button>
      </form>

      <p className="text-center text-xs text-muted-foreground mt-4 leading-relaxed">
        By creating an account, you agree that this platform uses virtual currency only and involves no real money.
      </p>

      <p className="text-center text-sm text-muted-foreground mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-gold hover:text-gold/80 font-medium transition-colors">
          Sign in
        </Link>
      </p>
    </motion.div>
  );
}
