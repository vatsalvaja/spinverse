import { GmSectionShell } from "@/features/game-management/admin/components/GmSectionShell";

export default function GameManagementLayout({ children }: { children: React.ReactNode }) {
  return <GmSectionShell>{children}</GmSectionShell>;
}
