import type { Metadata } from "next";
import { Roulette } from "@/games/roulette/Roulette";

export const metadata: Metadata = { title: "Roulette" };

export default function RoulettePage() {
  return <Roulette />;
}
