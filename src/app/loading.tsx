import { WarliLoader } from "@/components/site/WarliLoader";

/** Shown while a page's data loads during navigation. */
export default function Loading() {
  return (
    <div className="flex min-h-[60svh] items-center justify-center px-4 py-24">
      <WarliLoader label="Opening the archive…" />
    </div>
  );
}
