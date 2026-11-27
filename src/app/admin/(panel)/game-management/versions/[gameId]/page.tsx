import { redirect } from "next/navigation";

export default function AdminGameManagementVersionDetailRedirect({ params }: { params: { gameId: string } }) {
  redirect(`/super-admin/game-management/versions/${params.gameId}`);
}
