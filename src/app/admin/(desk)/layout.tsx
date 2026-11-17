import Link from "next/link";
import { redirect } from "next/navigation";
import { getEditor } from "@/lib/auth";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/passports/new", label: "New passport" },
  { href: "/admin/sources", label: "Sources" },
  { href: "/admin/media", label: "Media" },
  { href: "/admin/review", label: "Review queue" },
  { href: "/admin/qr", label: "QR labels" },
  { href: "/admin/history", label: "History" },
];

export default async function DeskLayout({ children }: LayoutProps<"/admin">) {
  const editor = await getEditor();
  if (!editor) redirect("/admin/login");
  return (
    <div className="mx-auto max-w-[1500px] px-4 py-8 sm:px-6 lg:grid lg:grid-cols-[13rem_1fr] lg:gap-10 lg:px-10">
      <aside className="mb-8 lg:mb-0">
        <div className="lg:sticky lg:top-20">
          <p className="label-sm text-ink-mute">Signed in as</p>
          <p className="font-title text-xl">{editor.name}</p>
          <p className="label-sm text-ink-mute">{editor.mode === "supabase" ? "Supabase editor" : "Local demo editor"}</p>
          <nav aria-label="Editorial desk" className="no-scrollbar mt-6 flex gap-1 overflow-x-auto lg:flex-col">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="label shrink-0 rounded px-3 py-2 hover:bg-paper">
                {n.label}
              </Link>
            ))}
          </nav>
          <form action={logoutAction} className="mt-6">
            <button type="submit" className="label-sm rounded-full border rule px-3 py-1.5 hover:border-ink">
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
