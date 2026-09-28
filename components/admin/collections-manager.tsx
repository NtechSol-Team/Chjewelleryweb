"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, Pencil, Plus } from "lucide-react";
import type { Collection } from "@/lib/db/schema";
import { moveCollection, saveCollection, setCollectionPublished } from "@/lib/actions/admin";
import { AButton, Badge, Field, inputClass } from "./ui";
import { Dialog, Toast } from "./dialog";

type Row = { c: Collection; pieces: number; clients: number };

export function CollectionsManager({ rows }: { rows: Row[] }) {
  const [editing, setEditing] = useState<Collection | "new" | null>(null);
  const [form, setForm] = useState({ name: "", tagline: "", description: "", coverUrl: "" });
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const open = (c: Collection | "new") => {
    setError(null);
    setEditing(c);
    setForm(c === "new" ? { name: "", tagline: "", description: "", coverUrl: "" } : { name: c.name, tagline: c.tagline ?? "", description: c.description ?? "", coverUrl: c.coverUrl ?? "" });
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <AButton variant="primary" onClick={() => open("new")}>
          <Plus className="h-4 w-4" /> New collection
        </AButton>
      </div>
      <ul className="space-y-3">
        {rows.map(({ c, pieces, clients }, i) => (
          <li key={c.id} className="flex flex-col gap-4 rounded-md border border-a-line bg-white p-3 sm:flex-row sm:items-center">
            <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded bg-cream sm:aspect-[4/3] sm:w-32">
              {c.coverUrl && <Image src={c.coverUrl} alt="" fill sizes="(min-width:640px) 128px, 100vw" className="object-cover" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[12px] tabular text-a-muted">{String(i + 1).padStart(2, "0")}</span>
                <p className="truncate text-[14px] font-semibold">{c.name}</p>
                {c.isPublished ? <Badge tone="ok">Published</Badge> : <Badge>Hidden</Badge>}
              </div>
              <p className="mt-0.5 truncate text-[13px] text-a-muted">{c.tagline}</p>
              <p className="mt-2 text-[12px] text-a-muted">
                <Link href={`/admin/products?collection=${c.slug}`} className="hover:underline">
                  {pieces} pieces
                </Link>{" "}
                · assigned to {clients} {clients === 1 ? "client" : "clients"}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <label className="mr-2 flex items-center gap-2 text-[12.5px]">
                <input
                  type="checkbox"
                  checked={c.isPublished}
                  onChange={(e) =>
                    start(async () => {
                      await setCollectionPublished(c.id, e.target.checked);
                      setToast(e.target.checked ? `${c.name} published` : `${c.name} hidden from clients`);
                    })
                  }
                  className="accent-charcoal"
                />
                Visible
              </label>
              <AButton variant="ghost" className="w-9 px-0" aria-label="Move up" disabled={i === 0 || pending} onClick={() => start(async () => void (await moveCollection(c.id, -1)))}>
                <ArrowUp className="h-3.5 w-3.5" />
              </AButton>
              <AButton variant="ghost" className="w-9 px-0" aria-label="Move down" disabled={i === rows.length - 1 || pending} onClick={() => start(async () => void (await moveCollection(c.id, 1)))}>
                <ArrowDown className="h-3.5 w-3.5" />
              </AButton>
              <AButton onClick={() => open(c)}>
                <Pencil className="h-3.5 w-3.5" /> Edit
              </AButton>
            </div>
          </li>
        ))}
      </ul>

      <Dialog
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing === "new" ? "New collection" : "Edit collection"}
        footer={
          <>
            <AButton onClick={() => setEditing(null)}>Cancel</AButton>
            <AButton
              variant="primary"
              disabled={pending || form.name.trim().length < 2}
              onClick={() =>
                start(async () => {
                  try {
                    await saveCollection(editing === "new" ? null : editing!.id, form);
                    setToast("Collection saved");
                    setEditing(null);
                  } catch {
                    setError("Please check the fields — the cover must be a valid image URL.");
                  }
                })
              }
            >
              Save
            </AButton>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Name">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Tagline">
            <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className={inputClass} placeholder="Exceptional forms. Curated diamonds." />
          </Field>
          <Field label="Description">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={`${inputClass} h-auto py-2`} />
          </Field>
          <Field label="Cover image URL">
            <input value={form.coverUrl} onChange={(e) => setForm({ ...form, coverUrl: e.target.value })} className={inputClass} />
          </Field>
          {error && <p className="text-[12.5px] text-danger">{error}</p>}
        </div>
      </Dialog>
      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}
