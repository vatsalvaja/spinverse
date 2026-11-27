import { redirect } from "next/navigation";

export default function AdminGameManagementConfigDetailRedirect({ params }: { params: { gameId: string } }) {
  redirect(`/super-admin/game-management/configuration/${params.gameId}`);
}
