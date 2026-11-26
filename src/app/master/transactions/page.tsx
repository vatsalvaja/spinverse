"use client";

import { useMemo } from "react";
import { ArrowDownLeft, ArrowUpRight, ReceiptText } from "lucide-react";
import { PageHeader, StatCard } from "@/components/admin/ui";
import { useAccess } from "@/features/access/AccessProvider";
import { masterStats, txsOfMaster } from "@/features/access/selectors";
import { CoinTxTable, coins } from "@/features/access/ui/shared";

export default function MasterTransactions() {
  const { data, current } = useAccess();
  const me = current?.role === "master" ? current : null;
  const txs = useMemo(() => (me ? txsOfMaster(data, me.id) : []), [data, me]);
  const stats = useMemo(() => (me ? masterStats(data, me) : null), [data, me]);
  if (!me || !stats) return null;

  return (
    <div>
      <PageHeader title="Transactions" description="Coins you received from the Super Admin and coins you allocated to your clients. Only your own activity is shown." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Received" value={coins(stats.received)} icon={<ArrowDownLeft />} hint="from Super Admin" />
        <StatCard label="Distributed" value={coins(stats.distributed)} icon={<ArrowUpRight />} hint="to clients, net of returns" />
        <StatCard label="Transactions" value={String(txs.length)} icon={<ReceiptText />} hint="ledger entries" />
      </div>
      <CoinTxTable txs={txs} perspective={me.id} />
    </div>
  );
}
