import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/validations";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          username: profile.email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_"),
          role: "USER",
        };
      },
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validated = loginSchema.safeParse(credentials);
        if (!validated.success) return null;

        const { email, password } = validated.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: { wallet: true },
        });

        if (!user || !user.password) return null;

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          username: user.username,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = (user as { username?: string }).username;
        token.role = (user as { role?: string }).role || "USER";
      }
      if (trigger === "update" && session) {
        token.name = session.name;
        token.username = session.username;
        token.image = session.image;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string;
        session.user.role = token.role as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          let username = user.email!.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");
          const usernameExists = await prisma.user.findUnique({ where: { username } });
          if (usernameExists) {
            username = `${username}_${Math.floor(Math.random() * 9999)}`;
          }

          const newUser = await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              image: user.image,
              username,
              emailVerified: new Date(),
            },
          });

          await prisma.wallet.create({
            data: {
              userId: newUser.id,
              balance: 1000,
            },
          });

          await prisma.transaction.create({
            data: {
              walletId: (await prisma.wallet.findUnique({ where: { userId: newUser.id } }))!.id,
              userId: newUser.id,
              type: "INITIAL_DEPOSIT",
              amount: 1000,
              balance: 1000,
              description: "Welcome bonus - £1,000 virtual currency",
            },
          });

          await awardFirstAchievementCheck(newUser.id);
        }
      }
      return true;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  trustHost: true,
});

async function awardFirstAchievementCheck(userId: string) {
  // No-op - achievements will be awarded as user interacts
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}
