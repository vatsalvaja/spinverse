import type { Metadata } from "next";
import { AtlantisCascade } from "@/games/atlantis-cascade/AtlantisCascade";

export const metadata: Metadata = { title: "Atlantis Cascade" };

export default function AtlantisCascadePage() {
  return <AtlantisCascade />;
}
