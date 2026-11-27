import { redirect } from "next/navigation";

export default function AdminUserDetailRedirect({ params }: { params: { id: string } }) {
  redirect(`/super-admin/users/${params.id}`);
}
