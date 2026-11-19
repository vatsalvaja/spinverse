import type { Metadata } from "next";
import { VaultLogin } from "@/components/site/VaultLogin";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return <VaultLogin />;
}
