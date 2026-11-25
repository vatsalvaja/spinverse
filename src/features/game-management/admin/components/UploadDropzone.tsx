"use client";

import { useCallback, useEffect, useRef, useState, type DragEvent } from "react";
import { CheckCircle2, FileArchive, ImagePlus, Trash2, UploadCloud, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MAX_PACKAGE_BYTES } from "../../lib/constants";
import { formatBytes } from "../../lib/format";
import { GmButton, GmProgress } from "../../ui/primitives";

/** What the form needs to know about the chosen package. The archive itself is never read or stored. */
export interface PackageFile {
  name: string;
  size: number;
  /** real check of the first bytes: ZIP archives start with "PK" */
  headerOk: boolean;
}

interface Props {
  value: PackageFile | null;
  onChange: (f: PackageFile | null) => void;
  disabled?: boolean;
  /** shown above the drop target; default is the add-game wording */
  title?: string;
}

type Phase = "idle" | "uploading" | "done" | "error";

async function readHeader(file: File): Promise<boolean> {
  try {
    const buf = new Uint8Array(await file.slice(0, 4).arrayBuffer());
    // PK\x03\x04 (normal), PK\x05\x06 (empty archive), PK\x07\x08 (spanned)
    return buf[0] === 0x50 && buf[1] === 0x4b && [0x03, 0x05, 0x07].includes(buf[2]);
  } catch {
    return false;
  }
}

/**
 * Drag-and-drop ZIP picker with a simulated upload. No bytes leave the browser: the progress bar is a simulation,
 * scaled by file size, standing in for the future upload endpoint.
 */
export function PackageDropzone({ value, onChange, disabled, title = "Game package (.zip)" }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const [drag, setDrag] = useState(false);
  const [phase, setPhase] = useState<Phase>(value ? "done" : "idle");
  const [progress, setProgress] = useState(value ? 100 : 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  // the parent can clear the file (e.g. after a successful save)
  useEffect(() => {
    if (!value && phase === "done") {
      setPhase("idle");
      setProgress(0);
    }
  }, [value, phase]);

  const reject = (msg: string) => {
    setError(msg);
    setPhase("error");
    setProgress(0);
    onChange(null);
  };

  const accept = useCallback(
    async (file: File) => {
      if (timer.current) clearInterval(timer.current);
      setError(null);
      if (!/\.zip$/i.test(file.name)) return reject("Only .zip packages are accepted. Pre-built frontend bundles must be zipped.");
      if (file.size === 0) return reject("That file is empty.");
      if (file.size > MAX_PACKAGE_BYTES) return reject(`That package is ${formatBytes(file.size)}. The limit is ${formatBytes(MAX_PACKAGE_BYTES)}.`);
      const headerOk = await readHeader(file);
      onChange(null);
      setPhase("uploading");
      setProgress(0);
      // simulated upload: bigger files take a little longer, never more than ~4s
      const total = Math.min(4200, 1200 + file.size / 60000);
      const started = Date.now();
      timer.current = setInterval(() => {
        const f = Math.min(1, (Date.now() - started) / total);
        setProgress(Math.round(f * 100));
        if (f >= 1) {
          if (timer.current) clearInterval(timer.current);
          setPhase("done");
          onChange({ name: file.name, size: file.size, headerOk });
        }
      }, 70);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onChange],
  );

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDrag(false);
    if (disabled) return;
    const f = e.dataTransfer.files?.[0];
    if (f) void accept(f);
  };

  const clear = () => {
    if (timer.current) clearInterval(timer.current);
    setPhase("idle");
    setProgress(0);
    setError(null);
    onChange(null);
    if (input.current) input.current.value = "";
  };

  const showFile = (phase === "uploading" || phase === "done") && (value || phase === "uploading");

  return (
    <div>
      <p className="mb-1.5 text-[12.5px] font-semibold text-white/75">{title} <span className="text-gold-400">*</span></p>
      <input ref={input} type="file" accept=".zip,application/zip,application/x-zip-compressed" className="sr-only" aria-label="Choose game package" disabled={disabled} onChange={(e) => e.target.files?.[0] && void accept(e.target.files[0])} />

      {!showFile ? (
        <div
          onDragOver={(e) => { e.preventDefault(); if (!disabled) setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
          className={cn(
            "relative flex flex-col items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition",
            drag ? "border-gold-300 bg-gold-400/10 shadow-[0_0_40px_-12px_rgba(212,175,79,.6)]" : "border-white/15 bg-black/30 hover:border-gold-400/40",
            phase === "error" && "border-rose-400/40",
            disabled && "opacity-50",
          )}
        >
          <span className={cn("flex h-14 w-14 items-center justify-center rounded-2xl border transition", drag ? "border-gold-300/60 bg-gold-400/20 text-gold-200" : "border-gold-400/25 bg-gold-400/10 text-gold-300")}>
            <UploadCloud className="h-7 w-7" />
          </span>
          <p className="mt-4 text-sm font-semibold text-white">Drag and drop your game package here</p>
          <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-white/45">A pre-built frontend bundle in a .zip (HTML, JS, CSS and assets), up to {formatBytes(MAX_PACKAGE_BYTES)}. This is not an npm package.</p>
          <GmButton variant="gold" size="sm" className="mt-5" disabled={disabled} onClick={() => input.current?.click()}>Browse files</GmButton>
          {phase === "error" && error && (
            <p role="alert" className="mt-4 flex max-w-md items-start gap-2 text-left text-[13px] text-rose-300"><XCircle className="mt-0.5 h-4 w-4 shrink-0" /> {error}</p>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
          <div className="flex items-center gap-3">
            <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border", phase === "done" ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300" : "border-neon-cyan/30 bg-neon-cyan/10 text-neon-cyan")}>
              {phase === "done" ? <CheckCircle2 className="h-5 w-5" /> : <FileArchive className="h-5 w-5" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{value?.name ?? "Uploading…"}</p>
              <p className="text-xs text-white/45">
                {value ? formatBytes(value.size) : "Reading package…"} · {phase === "done" ? "Upload complete (simulated)" : `${progress}%`}
              </p>
            </div>
            <div className="flex shrink-0 gap-1.5">
              <GmButton size="sm" variant="outline" disabled={disabled} onClick={() => input.current?.click()}>Replace</GmButton>
              <GmButton size="sm" variant="ghost" aria-label="Remove package" disabled={disabled} onClick={clear}><Trash2 className="h-4 w-4" /></GmButton>
            </div>
          </div>
          <GmProgress className="mt-4" value={progress} tone={phase === "done" ? "green" : "cyan"} label="Package upload progress" />
          {phase === "done" && value && !value.headerOk && (
            <p role="alert" className="mt-3 flex items-start gap-2 text-[13px] text-rose-300"><XCircle className="mt-0.5 h-4 w-4 shrink-0" /> This file does not start with a ZIP signature, so it will fail validation.</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

/** Downscales an image to a small data URL so it fits comfortably in localStorage. */
export function imageToThumbnail(file: File, maxSide = 520): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const s = Math.min(1, maxSide / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.max(1, Math.round(img.width * s));
      c.height = Math.max(1, Math.round(img.height * s));
      c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("That file could not be read as an image."));
    };
    img.src = url;
  });
}

export function ThumbnailUploader({ value, onChange, disabled }: { value: string | null; onChange: (dataUrl: string | null) => void; disabled?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const pick = async (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) return setError("Choose an image file (PNG, JPG or WebP).");
    if (file.size > 8 * 1024 * 1024) return setError("Thumbnails must be under 8 MB.");
    setBusy(true);
    try {
      onChange(await imageToThumbnail(file));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="mb-1.5 text-[12.5px] font-semibold text-white/75">Game thumbnail</p>
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" aria-label="Choose game thumbnail" disabled={disabled} onChange={(e) => e.target.files?.[0] && void pick(e.target.files[0])} />
      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={disabled || busy}
          onClick={() => input.current?.click()}
          aria-label={value ? "Replace thumbnail" : "Upload thumbnail"}
          className="group relative flex h-[120px] w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-white/20 bg-black/40 transition hover:border-gold-400/50"
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="Thumbnail preview" className="h-full w-full object-cover" />
          ) : (
            <ImagePlus className="h-6 w-6 text-white/35 transition group-hover:text-gold-300" />
          )}
        </button>
        <div className="min-w-0 text-[13px] text-white/45">
          <p>Portrait artwork works best (4:5). It is resized in your browser and shown in the catalogue.</p>
          <div className="mt-2.5 flex gap-2">
            <GmButton size="sm" variant="outline" disabled={disabled || busy} loading={busy} onClick={() => input.current?.click()}>{value ? "Replace" : "Upload image"}</GmButton>
            {value && <GmButton size="sm" variant="ghost" disabled={disabled} onClick={() => { onChange(null); if (input.current) input.current.value = ""; }}>Remove</GmButton>}
          </div>
          {error && <p role="alert" className="mt-2 text-xs text-rose-300">{error}</p>}
        </div>
      </div>
    </div>
  );
}
