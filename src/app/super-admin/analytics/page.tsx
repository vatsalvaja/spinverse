import type { Metadata } from "next";
import { AdminAnalyticsView } from "@/components/admin/views/AdminAnalyticsView";

export const metadata: Metadata = { title: "Analytics" };

export default function SuperAdminAnalyticsPage() {
  return <AdminAnalyticsView basePath="/super-admin" />;
}
