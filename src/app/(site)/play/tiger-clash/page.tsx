import type { Metadata } from "next";
import { TigerClash } from "@/games/tiger-clash/TigerClash";

export const metadata: Metadata = { title: "TIGER CLASH" };

export default function TigerClashPage() {
  return <TigerClash />;
}
