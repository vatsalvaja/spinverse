import { GmSectionShell } from "@/features/game-management/admin/components/GmSectionShell";

export default function SuperAdminGameManagementLayout({ children }: { children: React.ReactNode }) {
  return <GmSectionShell>{children}</GmSectionShell>;
}
