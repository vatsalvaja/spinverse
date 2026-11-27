"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowDownLeft, Coins, Download, HandCoins, ReceiptText } from "lucide-react";
import { AButton, Card, EmptyState, PageHeader, StatCard } from "@/components/admin/ui";
import { AdminTransactionsView } from "@/components/admin/views/AdminTransactionsView";
import { useToast } from "@/components/ui/toast";
import { useAccess } from "@/features/access/AccessProvider";
import { newestFirst } from "@/features/access/selectors";
import { CoinTxTable, coins } from "@/features/access/ui/shared";
import { cn } from "@/lib/utils";

type Tab = "coins" | "ledger";

function TransactionsContent() {
  const params = useSearchParams();
  const initialTab: Tab = params.get("tab") === "ledger" ? "ledger" : "coins";
  const [tab, setTab] = useState<Tab>(initialTab);
  const { data } = useAccess();
  const toast = useToast();

  const txs = useMemo(() => [...data.txs].sort(newestFirst), [data.txs]);
  const toMasters = data.txs.filter((t) => t.kind === "master_allocation").reduce((s, t) => s + t.amount, 0);
  const toClients = data.txs.filter((t) => t.kind === "client_allocation").reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <PageHeader
        title="Coin & Transactions"
        description="Hierarchy coin allocations alongside the full platform virtual points ledger."
        actions={
          tab === "ledger" ? (
            <AButton onClick={() => toast("Exported transactions.csv (demo: no file is created).", "info")}><Download className="h-4 w-4" /> Export CSV</AButton>
          ) : undefined
        }
      />

      <div className="mb-6 inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-panel" role="tablist" aria-label="Transaction views">
        <button
          role="tab"
          aria-selected={tab === "coins"}
          onClick={() => setTab("coins")}
          className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition", tab === "coins" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900")}
        >
          <Coins className="h-4 w-4" /> Hierarchy Coin Transfers
        </button>
        <button
          role="tab"
          aria-selected={tab === "ledger"}
          onClick={() => setTab("ledger")}
          className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition", tab === "ledger" ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900")}
        >
          <ReceiptText className="h-4 w-4" /> Platform Wallet Ledger
        </button>
      </div>

      {tab === "coins" ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard label="Issued to masters" value={coins(toMasters)} icon={<ArrowDownLeft />} hint="by Super Admin" />
            <StatCard label="Distributed to clients" value={coins(toClients)} icon={<HandCoins />} hint="by masters" />
            <StatCard label="Total transactions" value={String(txs.length)} icon={<ReceiptText />} hint="hierarchy entries" />
          </div>
          {txs.length ? (
            <CoinTxTable txs={txs} />
          ) : (
            <Card><EmptyState title="No hierarchy coin transactions yet" body="Allocate coins to a master from Master Management to record movements here." /></Card>
          )}
        </>
      ) : (
        <AdminTransactionsView basePath="/super-admin" embedded />
      )}
    </div>
  );
}

export default function SuperAdminTransactions() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading transactions…</p>}>
      <TransactionsContent />
    </Suspense>
  );
}
