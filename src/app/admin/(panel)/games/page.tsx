import { redirect } from "next/navigation";

export default function AdminGamesRedirect() {
  redirect("/super-admin/games");
}
