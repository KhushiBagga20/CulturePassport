"use client";

import { useEffect, useState } from "react";

/**
 * Shown on /passports when a short link (/p/123) pointed at a number that has no published passport.
 * Reads ?missing=… in the browser so the register itself can be prebuilt.
 */
export function MissingPassportNotice() {
  const [missing, setMissing] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from the URL after hydration
    setMissing(new URLSearchParams(window.location.search).get("missing"));
  }, []);
  if (!missing) return null;
  return (
    <p className="mt-6 max-w-xl border-l-4 border-brick bg-bone p-3 text-sm" role="alert">
      No published passport has the number “{missing}”. It may not exist yet, or it may still be in editorial review.
    </p>
  );
}
