import type { Metadata, Viewport } from "next";
import { Cinzel_Decorative, IBM_Plex_Mono, IBM_Plex_Sans, Instrument_Serif, Marcellus, Outfit, Oxanium, Unbounded } from "next/font/google";
import "./globals.css";
import { DemoDataProvider } from "@/data/provider";
import { SessionProvider } from "@/lib/session";
import { ToastProvider } from "@/components/ui/toast";

// Player-facing type system: wide display, editorial serif accents, techno numerals, plus one title face per world.
const display = Unbounded({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"], variable: "--font-display", display: "swap" });
const serif = Instrument_Serif({ subsets: ["latin"], weight: "400", style: ["normal", "italic"], variable: "--font-serif", display: "swap" });
const body = Outfit({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const num = Oxanium({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-num", display: "swap" });
const pharaoh = Cinzel_Decorative({ subsets: ["latin"], weight: ["400", "700", "900"], variable: "--font-pharaoh", display: "swap" });
const atlantis = Marcellus({ subsets: ["latin"], weight: "400", variable: "--font-atlantis", display: "swap" });
const admin = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-admin", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: { default: "SPINVERSE — Every Spin Tells a Different Story", template: "%s · SPINVERSE" },
  description: "A luxury entertainment lounge of story-driven slot worlds, played with virtual points only.",
};

export const viewport: Viewport = { themeColor: "#06060b", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${serif.variable} ${body.variable} ${num.variable} ${pharaoh.variable} ${atlantis.variable} ${admin.variable} ${mono.variable}`}>
      <body>
        <DemoDataProvider>
          <SessionProvider>
            <ToastProvider>{children}</ToastProvider>
          </SessionProvider>
        </DemoDataProvider>
      </body>
    </html>
  );
}
