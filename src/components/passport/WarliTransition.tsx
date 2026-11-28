"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { WarliLoader } from "@/components/site/WarliLoader";
import { arrivedByNavigation } from "@/lib/navigation";

/**
 * Opening an Indian passport from elsewhere on the site plays a short Warli circle-dance
 * transition. Direct visits skip it, so the passport is never hidden on first load.
 */
export function WarliTransition({ name }: { name: string }) {
  const pathname = usePathname() ?? "";
  const [show, setShow] = useState(() => arrivedByNavigation(pathname));
  useEffect(() => {
    if (!show) return;
    const t = setTimeout(() => setShow(false), 1300);
    return () => clearTimeout(t);
  }, [show]);
  if (!show) return null;
  return (
    <div aria-hidden className="warli-curtain pointer-events-none fixed inset-0 z-[70] flex items-center justify-center bg-cream">
      <WarliLoader label={`Opening ${name}…`} />
    </div>
  );
}
