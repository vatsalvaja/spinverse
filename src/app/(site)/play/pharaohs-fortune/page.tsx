import type { Metadata } from "next";
import { PharaohsFortune } from "@/games/pharaohs-fortune/PharaohsFortune";

export const metadata: Metadata = { title: "Pharaoh’s Fortune" };

export default function PharaohsFortunePage() {
  return <PharaohsFortune />;
}
