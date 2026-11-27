import { redirect } from "next/navigation";

export default function AdminGameManagementDeployRedirect({ params }: { params: { gameId: string } }) {
  redirect(`/super-admin/game-management/${params.gameId}`);
}
