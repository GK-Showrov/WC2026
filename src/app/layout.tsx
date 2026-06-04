import type { Metadata, Viewport } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "World Cup Predictor | Predict. Bet. Win.",
    template: "%s | World Cup Predictor",
  },
  description:
    "The ultimate FIFA World Cup prediction platform. Predict match results, place virtual bets, earn points, and compete on global leaderboards.",
  keywords: [
    "World Cup",
    "FIFA",
    "Football predictions",
    "Virtual betting",
    "Fantasy football",
    "Leaderboard",
  ],
  authors: [{ name: "World Cup Predictor" }],
  creator: "World Cup Predictor",
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: "World Cup Predictor",
    description: "Predict. Bet. Win. The ultimate World Cup prediction platform.",
    siteName: "World Cup Predictor",
  },
  twitter: {
    card: "summary_large_image",
    title: "World Cup Predictor",
    description: "Predict. Bet. Win. The ultimate World Cup prediction platform.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1e" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
