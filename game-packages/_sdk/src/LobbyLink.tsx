import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { useGameHost } from "./GameHostProvider";

/**
 * A drop-in replacement for the old `<Link href="/dashboard">` "Back to lobby" controls. It renders a normal
 * anchor with the same props and classes, and asks the host to leave the game when activated.
 */
export function LobbyLink({ onClick, ...rest }: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const host = useGameHost();
  return (
    <a
      {...rest}
      href="#lobby"
      onClick={(e: MouseEvent<HTMLAnchorElement>) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        e.preventDefault();
        host.exit();
      }}
    />
  );
}
