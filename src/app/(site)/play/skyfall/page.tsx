import type { Metadata } from "next";
import { Skyfall } from "@/games/skyfall/Skyfall";

export const metadata: Metadata = { title: "SKYFALL" };

export default function SkyfallPage() {
  return <Skyfall />;
}
