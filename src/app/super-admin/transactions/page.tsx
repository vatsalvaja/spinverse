"use client";

import { useMemo } from "react";
import { ArrowDownLeft, HandCoins, ReceiptText } from "lucide-react";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { useAccess } from "@/features/access/AccessProvider";
import { newestFirst } from "@/features/access/selectors";
import { CoinTxTable, coins } from "@/features/access/ui/shared";

export default function SuperAdminTransactions() {
  const { data } = useAccess();
  const txs = useMemo(() => [...data.txs].sort(newestFirst), [data.txs]);
  const toMasters = data.txs.filter((t) => t.kind === "master_allocation").reduce((s, t) => s + t.amount, 0);
  const toClients = data.txs.filter((t) => t.kind === "client_allocation").reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <PageHeader title="Transactions" description="Every coin movement in the system: Super Admin to masters, and masters to their clients." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Issued to masters" value={coins(toMasters)} icon={<ArrowDownLeft />} hint="by Super Admin" />
        <StatCard label="Distributed to clients" value={coins(toClients)} icon={<HandCoins />} hint="by masters" />
        <StatCard label="Total transactions" value={String(txs.length)} icon={<ReceiptText />} hint="ledger entries" />
      </div>
      <CoinTxTable txs={txs} />
    </div>
  );
}
