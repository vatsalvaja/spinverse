import { Badge } from "@/components/admin/ui";
import type { AccountStatus, AccountType, TxStatus, TxType } from "@/data/types";
import { TX_TYPE_LABEL } from "@/data/types";

export function StatusBadge({ status }: { status: AccountStatus }) {
  const map = { active: ["green", "Active"], inactive: ["slate", "Inactive"], blocked: ["red", "Blocked"] } as const;
  const [tone, label] = map[status];
  return <Badge tone={tone} dot>{label}</Badge>;
}

export function AccountBadge({ type }: { type: AccountType }) {
  return <Badge tone={type === "Guest" ? "amber" : "blue"}>{type}</Badge>;
}

export function TxStatusBadge({ status }: { status: TxStatus }) {
  const map = { completed: ["green", "Completed"], pending: ["amber", "Pending"], failed: ["red", "Failed"] } as const;
  const [tone, label] = map[status];
  return <Badge tone={tone} dot>{label}</Badge>;
}

export function TxTypeBadge({ type }: { type: TxType }) {
  const tone = { earned: "green", spent: "slate", reward: "gold", bonus: "blue", adjustment: "amber" } as const;
  return <Badge tone={tone[type]}>{TX_TYPE_LABEL[type]}</Badge>;
}
