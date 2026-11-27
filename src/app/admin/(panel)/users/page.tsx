import { redirect } from "next/navigation";

export default function AdminUsersRedirect({ searchParams }: { searchParams?: { q?: string } }) {
  const q = typeof searchParams?.q === "string" && searchParams.q ? `?q=${encodeURIComponent(searchParams.q)}` : "";
  redirect(`/super-admin/users${q}`);
}
