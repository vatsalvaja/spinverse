import { animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/** Eases a displayed number toward `target` whenever the target changes. Jumps straight there when reduced. */
export function useTween(target: number, duration = 0.8, reduced = false): number {
  const [shown, setShown] = useState(target);
  const from = useRef(target);

  useEffect(() => {
    if (reduced || from.current === target) {
      from.current = target;
      setShown(target);
      return;
    }
    const controls = animate(from.current, target, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => {
        from.current = v;
        setShown(Math.round(v));
      },
      onComplete: () => {
        from.current = target;
        setShown(target);
      },
    });
    return () => controls.stop();
  }, [target, duration, reduced]);

  return shown;
}
