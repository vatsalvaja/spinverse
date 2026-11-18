import { LogoMark } from "@/components/brand/Logo";

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label="Loading">
      <div className="flex flex-col items-center gap-4">
        <LogoMark className="sv-pulse h-10 w-10" />
        <span className="block h-[2px] w-32 overflow-hidden rounded-full bg-white/10">
          <span className="sv-route-bar block h-full w-full bg-gradient-to-r from-transparent via-gold-300 to-white" />
        </span>
      </div>
    </div>
  );
}
