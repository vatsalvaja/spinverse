"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FolderKanban, Pencil, Plus, Power, PowerOff, RefreshCw } from "lucide-react";
import { AButton, AInput, ASelect, Badge, Card, EmptyState, PageHeader, SearchInput, StatCard, Th } from "@/components/admin/ui";
import { BackendModeBanner } from "@/components/admin/views/BackendModeBanner";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { GAME_CATEGORIES } from "@/features/game-management/lib/constants";
import { useGames } from "@/features/game-management/store/useGm";
import { adminCategoriesApi, BackendApiError, isBackendConfigured, type BackendGameCategory } from "@/lib/adminBackendApi";
import { formatDateTime } from "@/lib/utils";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export default function SuperAdminGameCategoriesPage() {
  const toast = useToast();
  const games = useGames();
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [items, setItems] = useState<BackendGameCategory[]>([]);
  const [q, setQ] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "true" | "false">("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<BackendGameCategory | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", sortOrder: "0" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const hasBackend = isBackendConfigured();
    setConnected(hasBackend);
    if (!hasBackend) {
      setItems([]);
      setApiError(null);
      return;
    }
    setLoading(true);
    setApiError(null);
    try {
      const res = await adminCategoriesApi.list({
        search: q.trim() || undefined,
        isActive: activeFilter === "all" ? undefined : activeFilter === "true",
        limit: 100,
      });
      setItems(res.items);
    } catch (e) {
      setApiError(e instanceof BackendApiError ? e.message : "Failed to load categories from backend.");
    } finally {
      setLoading(false);
    }
  }, [q, activeFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const demoRows = useMemo(() => {
    const s = q.trim().toLowerCase();
    return GAME_CATEGORIES.map((name, idx) => ({
      id: `demo-cat-${idx + 1}`,
      name,
      slug: slugify(name),
      description: "Frontend constant from GAME_CATEGORIES (mock fallback)",
      sortOrder: idx + 1,
      isActive: true,
      gameCount: games.filter((g) => g.category === name).length,
    })).filter((c) => (activeFilter === "all" || activeFilter === "true") && (!s || `${c.name} ${c.slug}`.toLowerCase().includes(s)));
  }, [games, q, activeFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", slug: "", description: "", sortOrder: String(items.length + 1) });
    setModalOpen(true);
  };

  const openEdit = (cat: BackendGameCategory) => {
    setEditing(cat);
    setForm({ name: cat.name, slug: cat.slug, description: cat.description ?? "", sortOrder: String(cat.sortOrder) });
    setModalOpen(true);
  };

  const submit = async () => {
    if (!connected) {
      toast("Connect the NestJS backend in Platform Settings to create or modify categories.", "info");
      return;
    }
    if (!form.name.trim()) {
      toast("Category name is required.", "error");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        ...(form.slug.trim() ? { slug: form.slug.trim() } : {}),
        description: form.description.trim() || null,
        sortOrder: Number(form.sortOrder) || 0,
      };
      if (editing) {
        await adminCategoriesApi.update(editing.id, payload);
        toast(`Updated category “${payload.name}”.`);
      } else {
        await adminCategoriesApi.create(payload);
        toast(`Created category “${payload.name}”.`);
      }
      setModalOpen(false);
      await load();
    } catch (e) {
      toast(e instanceof BackendApiError ? e.message : "Could not save category.", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (cat: BackendGameCategory) => {
    try {
      if (cat.isActive) await adminCategoriesApi.deactivate(cat.id);
      else await adminCategoriesApi.activate(cat.id);
      toast(`${cat.name} ${cat.isActive ? "deactivated" : "activated"}.`);
      await load();
    } catch (e) {
      toast(e instanceof BackendApiError ? e.message : "Status update failed.", "error");
    }
  };

  const rows = connected ? items : demoRows;

  return (
    <div>
      <PageHeader
        title="Game Categories"
        description="Manage catalog categories, sort order, and active/inactive visibility."
        actions={
          <>
            <AButton onClick={() => void load()} disabled={loading}><RefreshCw className="h-4 w-4" /> Refresh</AButton>
            <AButton variant="primary" onClick={openCreate} disabled={!connected} title={!connected ? "Connect backend API in Platform Settings to create categories" : undefined}>
              <Plus className="h-4 w-4" /> Create category
            </AButton>
          </>
        }
      />

      <BackendModeBanner connected={connected} error={apiError} endpoints={["GET/POST/PATCH /admin/game-categories", "PATCH /:id/activate|deactivate"]} />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total categories" value={String(rows.length)} icon={<FolderKanban />} hint={connected ? "from PostgreSQL" : "static GAME_CATEGORIES"} />
        <StatCard label="Active" value={String(rows.filter((r) => r.isActive).length)} icon={<Power />} hint="visible in player catalog" />
        <StatCard label="Inactive" value={String(rows.filter((r) => !r.isActive).length)} icon={<PowerOff />} hint="hidden from catalog" />
      </div>

      <Card>
        <div className="grid gap-3 border-b border-slate-100 p-4 sm:grid-cols-[minmax(0,1fr)_180px]">
          <div className="flex flex-col gap-1 text-xs font-medium text-slate-500">
            <span>Search</span>
            <SearchInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by category name or slug" aria-label="Search categories" />
          </div>
          <ASelect label="Status" value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as "all" | "true" | "false")}>
            <option value="all">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </ASelect>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/70">
              <tr>
                <Th>Category</Th>
                <Th>Slug</Th>
                <Th>Description</Th>
                <Th align="right">Order</Th>
                <Th>Status</Th>
                <Th>{connected ? "Updated" : "Games (mock)"}</Th>
                {connected && <Th align="right">Actions</Th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {connected
                ? items.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                      <td className="ad-mono px-4 py-3 text-xs text-slate-600">{c.slug}</td>
                      <td className="max-w-[260px] truncate px-4 py-3 text-slate-500">{c.description || "—"}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{c.sortOrder}</td>
                      <td className="px-4 py-3"><Badge tone={c.isActive ? "green" : "slate"} dot>{c.isActive ? "Active" : "Inactive"}</Badge></td>
                      <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDateTime(c.updatedAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1.5">
                          <AButton size="sm" onClick={() => openEdit(c)} aria-label={`Edit ${c.name}`}><Pencil className="h-3.5 w-3.5" /></AButton>
                          <AButton size="sm" onClick={() => void toggleStatus(c)}>{c.isActive ? "Deactivate" : "Activate"}</AButton>
                        </div>
                      </td>
                    </tr>
                  ))
                : demoRows.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-medium text-slate-900">{c.name}</td>
                      <td className="ad-mono px-4 py-3 text-xs text-slate-600">{c.slug}</td>
                      <td className="max-w-[260px] truncate px-4 py-3 text-slate-500">{c.description}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-slate-700">{c.sortOrder}</td>
                      <td className="px-4 py-3"><Badge tone="green" dot>Active (static)</Badge></td>
                      <td className="px-4 py-3 tabular-nums text-slate-700">{c.gameCount}</td>
                    </tr>
                  ))}
            </tbody>
          </table>
          {!rows.length && <EmptyState title="No categories found" body={loading ? "Loading categories from backend…" : "Adjust your search or create a category."} />}
        </div>
      </Card>

      <Modal
        theme="light"
        size="sm"
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? `Edit ${editing.name}` : "Create category"}
        footer={
          <>
            <AButton onClick={() => setModalOpen(false)}>Cancel</AButton>
            <AButton variant="primary" onClick={() => void submit()} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create category"}
            </AButton>
          </>
        }
      >
        <div className="space-y-4">
          <AInput label="Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value, slug: editing ? f.slug : slugify(e.target.value) }))} placeholder="Hold & Respin" />
          <AInput label="Slug" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} placeholder="hold-respin" hint="Lowercase letters, numbers and hyphens." />
          <AInput label="Description (optional)" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <AInput label="Sort order" type="number" min={0} value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}
