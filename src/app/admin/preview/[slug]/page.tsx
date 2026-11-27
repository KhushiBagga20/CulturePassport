import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getEditor } from "@/lib/auth";
import { findTradition, getEditorArchive } from "@/lib/data/archive";
import { PassportView } from "@/components/passport/PassportView";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview", robots: { index: false } };

/** Editors preview drafts here; the public passport route only serves published content. */
export default async function PreviewPage({ params }: PageProps<"/admin/preview/[slug]">) {
  if (!(await getEditor())) redirect("/admin/login");
  const { slug } = await params;
  const archive = await getEditorArchive();
  const found = findTradition(archive, slug);
  if (!found) notFound();
  return <PassportView t={found.tradition} archive={archive} preview />;
}
