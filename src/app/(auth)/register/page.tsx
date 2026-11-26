import { redirect } from "next/navigation";

/** Accounts are created by a master now; there is no public sign-up. */
export default function Page() {
  redirect("/login");
}
