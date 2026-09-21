import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

const display = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});
const sans = Inter({ variable: "--font-sans", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"] });

const SITE_URL = "https://skillforge.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "SkillForge — The Free Open Registry for Reusable AI Agent Skills",
    template: "%s · SkillForge",
  },
  description:
    "Search, safety-score, compose and install reusable SKILL.md agent skills for OpenClaw, Claude Code, Cursor and any MCP agent. Free forever, no API keys, offline-first.",
  keywords: [
    "AI agent skills",
    "reusable agent skills",
    "SKILL.md",
    "OpenClaw",
    "Claude Code",
    "MCP",
    "Model Context Protocol",
    "agentic AI",
    "AI safety",
    "skill registry",
  ],
  authors: [{ name: "aniruddhaadak80" }],
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "SkillForge — Reusable Skills for AI Agents",
    description:
      "The free open registry for SKILL.md agent skills. Search, safety-score, compose, install. Works with OpenClaw, Claude Code, Cursor, any MCP agent.",
    url: SITE_URL,
    siteName: "SkillForge",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillForge — Reusable Skills for AI Agents",
    description:
      "Search, safety-score, compose and install agent skills. Free forever, no keys.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="bg-void text-snow font-sans min-h-full flex flex-col">
        <div className="bg-blueprint bg-noise pointer-events-none fixed inset-0 z-0" />
        <Nav />
        <main className="relative z-10 flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
