import { redirect } from "next/navigation";

/** Staff sign-in now lives on the single role-based login page. */
export default function AdminLoginPage() {
  redirect("/login");
}
