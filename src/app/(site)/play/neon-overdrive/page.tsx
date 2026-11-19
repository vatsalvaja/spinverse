import type { Metadata } from "next";
import { NeonOverdrive } from "@/games/neon-overdrive/NeonOverdrive";

export const metadata: Metadata = { title: "Neon Overdrive" };

export default function NeonOverdrivePage() {
  return <NeonOverdrive />;
}
