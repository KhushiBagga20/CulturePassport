"use client";

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="label rounded-full bg-ink px-5 py-3 text-ivory hover:bg-burgundy">
      Print labels
    </button>
  );
}
