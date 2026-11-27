"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Eye, EyeOff, KeyRound, Save, ShieldCheck, UserCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { AButton, AInput, Badge, Card, CardHeader, PageHeader } from "@/components/admin/ui";
import { useToast } from "@/components/ui/toast";
import { useAccess } from "@/features/access/AccessProvider";
import { clientsOf, masterStats } from "@/features/access/selectors";
import { ROLE_LABEL } from "@/features/access/types";
import { StatusPill, coins } from "@/features/access/ui/shared";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useMasterProfile } from "../_lib/masterData";

export default function MasterProfilePage() {
  const { data, current } = useAccess();
  const toast = useToast();

  const me = current?.role === "master" ? current : null;
  const profile = useMasterProfile(me);
  const stats = useMemo(() => (me ? masterStats(data, me) : null), [data, me]);
  const clients = useMemo(() => (me ? clientsOf(data, me.id) : []), [data, me]);

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [profileErr, setProfileErr] = useState("");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwErr, setPwErr] = useState("");

  useEffect(() => {
    setDisplayName(profile.displayName);
    setEmail(profile.email);
    setPhone(profile.phone);
    setNotes(profile.notes);
  }, [profile.displayName, profile.email, profile.phone, profile.notes]);

  if (!me || !stats) return null;

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.trim().length < 2) {
      setProfileErr("Display name must be at least 2 characters.");
      return;
    }
    if (email.trim() && !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setProfileErr("Enter a valid email address or leave it empty.");
      return;
    }
    setProfileErr("");
    profile.saveOverride({
      displayName: displayName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
    });
    toast("Profile details saved.", "success");
  };

  const changePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPw) {
      setPwErr("Enter your current password.");
      return;
    }
    if (currentPw !== me.password) {
      setPwErr("Current password does not match your active demo account.");
      return;
    }
    if (newPw.length < 6) {
      setPwErr("New password must be at least 6 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setPwErr("New password and confirmation do not match.");
      return;
    }
    setPwErr("");
    profile.saveOverride({ passwordUpdatedAt: new Date().toISOString() });
    setCurrentPw("");
    setNewPw("");
    setConfirmPw("");
    toast("Password change validated (demo UI — login credentials remain unchanged).", "success");
  };

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="My Profile"
        description="Manage your permitted profile details, review account status and update security settings."
      />

      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar name={profile.displayName} tone="light" size={58} />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-slate-900">{profile.displayName}</h2>
                <StatusPill status={me.status} />
                <Badge tone="gold">{ROLE_LABEL[me.role]}</Badge>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                <span className="ad-mono">@{me.username}</span> · <span className="ad-mono">{me.id}</span> · Member since {formatDate(me.createdAt)}
              </p>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-right ring-1 ring-slate-200/70">
            <p className="text-xs text-slate-500">Available coin balance</p>
            <p className="mt-0.5 text-lg font-semibold tabular-nums text-slate-900">{coins(stats.available)} coins</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Account details" description="Username, Account ID, role and status are managed by Super Admin." />
          <dl className="divide-y divide-slate-100 px-5 py-1 text-sm">
            <div className="flex items-center justify-between py-3"><dt className="text-slate-500">Master ID</dt><dd className="ad-mono font-medium text-slate-900">{me.id}</dd></div>
            <div className="flex items-center justify-between py-3"><dt className="text-slate-500">Username</dt><dd className="ad-mono font-medium text-slate-900">@{me.username}</dd></div>
            <div className="flex items-center justify-between py-3"><dt className="text-slate-500">Role</dt><dd className="font-medium text-slate-900">{ROLE_LABEL[me.role]}</dd></div>
            <div className="flex items-center justify-between py-3"><dt className="text-slate-500">Account status</dt><dd><StatusPill status={me.status} /></dd></div>
            <div className="flex items-center justify-between py-3"><dt className="text-slate-500">Total clients</dt><dd className="font-medium tabular-nums text-slate-900">{clients.length} ({stats.activeClients} active)</dd></div>
            <div className="flex items-center justify-between py-3"><dt className="text-slate-500">Created on</dt><dd className="font-medium text-slate-900">{formatDate(me.createdAt)}</dd></div>
          </dl>
        </Card>

        <Card>
          <CardHeader title="Edit permitted profile details" description="Changes are saved locally in this browser." />
          <form onSubmit={saveProfile} className="space-y-4 p-5" noValidate>
            <AInput label="Display name" value={displayName} onChange={(e) => { setDisplayName(e.target.value); setProfileErr(""); }} />
            <AInput label="Contact email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); setProfileErr(""); }} placeholder="you@example.com" />
            <AInput label="Contact phone (optional)" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 0100" />
            <AInput label="Operations note (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Shift / desk reference" />
            {profileErr && <p role="alert" className="text-xs text-rose-600">{profileErr}</p>}
            <AButton type="submit" variant="primary"><Save className="h-4 w-4" /> Save profile</AButton>
          </form>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Change password"
            description="Password validation UI (demo mode preserves existing login credentials)."
          />
          <form onSubmit={changePassword} className="space-y-4 p-5" noValidate>
            <div className="relative">
              <AInput
                label="Current password"
                type={showPw ? "text" : "password"}
                value={currentPw}
                onChange={(e) => { setCurrentPw(e.target.value); setPwErr(""); }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? "Hide passwords" : "Show passwords"}
                className="absolute right-2.5 top-[30px] text-slate-400 hover:text-slate-700"
              >
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <AInput
              label="New password"
              type={showPw ? "text" : "password"}
              value={newPw}
              onChange={(e) => { setNewPw(e.target.value); setPwErr(""); }}
              hint="Minimum 6 characters."
              autoComplete="new-password"
            />
            <AInput
              label="Confirm new password"
              type={showPw ? "text" : "password"}
              value={confirmPw}
              onChange={(e) => { setConfirmPw(e.target.value); setPwErr(""); }}
              autoComplete="new-password"
            />
            {pwErr && <p role="alert" className="text-xs text-rose-600">{pwErr}</p>}
            {profile.passwordUpdatedAt && (
              <p className="flex items-center gap-1.5 text-xs text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" /> Last password check completed {formatDateTime(profile.passwordUpdatedAt)}.
              </p>
            )}
            <AButton type="submit" variant="gold"><KeyRound className="h-4 w-4" /> Update password</AButton>
          </form>
        </Card>

        <Card>
          <CardHeader title="Master permissions & scope" description="Operations permitted under your Master role." />
          <ul className="space-y-3 p-5 text-sm text-slate-600">
            {[
              "View your coin balance and coins issued by Super Admin",
              "Create, edit, activate, and deactivate your own Clients",
              "Allocate coins to active Clients up to your available balance",
              "Inspect your own coin transactions and client-wise / game-wise reports",
              "Cannot view other Masters, Super Admin controls, or global game packages",
            ].map((perm) => (
              <li key={perm} className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{perm}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
            <UserCircle className="mr-1 inline h-3.5 w-3.5" /> Signed in as <span className="ad-mono">@{me.username}</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
