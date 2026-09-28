"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Search, Users, Layers, Gem, Lock } from "lucide-react";
import { saveAssignments } from "@/lib/actions/admin";
import { CATEGORIES, categoryLabel } from "@/lib/taxonomy";
import { LineLottie } from "@/components/animations/line-lottie";
import { AButton, Badge, inputClass, inlineInput } from "./ui";
import { Toast } from "./dialog";
import { cn } from "@/lib/cn";

type ClientOpt = { id: string; name: string; company: string | null; status: string };
type Col = { id: string; name: string; cover: string | null; published: boolean };
type Prod = { id: string; code: string; name: string; category: string; collectionId: string | null; status: string; cover: string | null };

export function AssignmentEditor({
  clients,
  clientId,
  collections,
  products,
  initialCollections,
  initialProducts,
  isNew,
}: {
  clients: ClientOpt[];
  clientId: string;
  collections: Col[];
  products: Prod[];
  initialCollections: string[];
  initialProducts: string[];
  isNew?: boolean;
}) {
  const [cols, setCols] = useState(() => new Set(initialCollections));
  const [prods, setProds] = useState(() => new Set(initialProducts));
  const [saved, setSaved] = useState({ cols: initialCollections.sort().join(), prods: initialProducts.sort().join() });
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [onlySelected, setOnlySelected] = useState(false);
  const [clientQ, setClientQ] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const client = clients.find((c) => c.id === clientId)!;
  const colName = useMemo(() => new Map(collections.map((c) => [c.id, c.name])), [collections]);
  const publishedCols = useMemo(() => new Set(collections.filter((c) => c.published).map((c) => c.id)), [collections]);
  const viaCollection = (p: Prod) => !!p.collectionId && cols.has(p.collectionId) && publishedCols.has(p.collectionId);
  const visibleProducts = products.filter((p) => p.status === "published" && (viaCollection(p) || prods.has(p.id)));
  const individual = [...prods].filter((id) => {
    const p = products.find((x) => x.id === id);
    return p && !viaCollection(p);
  });
  const dirty = [...cols].sort().join() !== saved.cols || [...prods].sort().join() !== saved.prods;

  const filtered = products.filter(
    (p) =>
      (!cat || p.category === cat) &&
      (!q || p.code.toLowerCase().includes(q.toLowerCase()) || p.name.toLowerCase().includes(q.toLowerCase())) &&
      (!onlySelected || viaCollection(p) || prods.has(p.id)),
  );

  const toggle = <T,>(set: Set<T>, v: T) => {
    const n = new Set(set);
    if (n.has(v)) n.delete(v);
    else n.add(v);
    return n;
  };

  const save = () =>
    start(async () => {
      // Drop individual picks already covered by a selected collection.
      const cleanProds = [...prods].filter((id) => {
        const p = products.find((x) => x.id === id);
        return p && !viaCollection(p);
      });
      await saveAssignments(clientId, [...cols], cleanProds);
      setProds(new Set(cleanProds));
      setSaved({ cols: [...cols].sort().join(), prods: cleanProds.sort().join() });
      setToast(`Catalogue saved for ${client.name}`);
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2600);
    });

  return (
    <div className="pb-28">
      {isNew && (
        <div className="mx-5 mt-5 rounded-md border border-champagne/40 bg-[#fbf6ea] px-4 py-3 text-[13px] md:mx-8">
          <strong className="font-semibold">{client.name}</strong> has been created. Now choose what they may see — nothing is visible until you save.
        </div>
      )}

      {/* Flow: CLIENT ↓ COLLECTIONS ↓ PRODUCTS */}
      <div className="grid gap-px border-b border-a-line bg-a-line sm:grid-cols-3">
        <Step icon={Users} n={1} label="Client" value={client.name} sub={client.company ?? undefined}>
          <div className="relative mt-2">
            <button onClick={() => setPickerOpen((o) => !o)} aria-expanded={pickerOpen} className="flex items-center gap-1 text-[12px] text-a-muted hover:text-a-text">
              Change client <ChevronDown className="h-3 w-3" />
            </button>
            <AnimatePresence>
              {pickerOpen && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute left-0 top-6 z-30 w-72 rounded-md border border-a-line bg-white p-2 shadow-lg">
                  <input autoFocus value={clientQ} onChange={(e) => setClientQ(e.target.value)} placeholder="Search clients" className={inputClass} aria-label="Search clients" />
                  <ul className="mt-2 max-h-64 overflow-auto">
                    {clients
                      .filter((c) => c.name.toLowerCase().includes(clientQ.toLowerCase()) || (c.company ?? "").toLowerCase().includes(clientQ.toLowerCase()))
                      .map((c) => (
                        <li key={c.id}>
                          <Link href={`/admin/assignments?client=${c.id}`} className={cn("flex items-center justify-between rounded px-2 py-2 text-[13px] hover:bg-a-subtle", c.id === clientId && "bg-a-subtle font-medium")}>
                            <span>
                              {c.name}
                              {c.company && <span className="block text-[11.5px] text-a-muted">{c.company}</span>}
                            </span>
                            {c.status === "disabled" && <Badge tone="danger">Disabled</Badge>}
                          </Link>
                        </li>
                      ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Step>
        <Step icon={Layers} n={2} label="Collections" value={`${cols.size} of ${collections.length} assigned`} />
        <Step icon={Gem} n={3} label="Products" value={`${visibleProducts.length} pieces visible`} sub={`${individual.length} assigned individually`} />
      </div>

      <div className="grid gap-5 p-5 md:p-8 xl:grid-cols-[360px_1fr]">
        {/* Collections */}
        <section aria-labelledby="cols-h">
          <h2 id="cols-h" className="mb-3 text-[13px] font-semibold">
            Collections <span className="font-normal text-a-muted">— every published piece inside is included</span>
          </h2>
          <ul className="space-y-2">
            {collections.map((c) => {
              const on = cols.has(c.id);
              const count = products.filter((p) => p.collectionId === c.id && p.status === "published").length;
              return (
                <li key={c.id}>
                  <button
                    onClick={() => setCols((s) => toggle(s, c.id))}
                    role="switch"
                    aria-checked={on}
                    className={cn("flex w-full items-center gap-3 rounded-md border bg-white p-2.5 text-left transition-colors", on ? "border-charcoal/70 ring-1 ring-charcoal/10" : "border-a-line hover:border-a-muted/40")}
                  >
                    <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded bg-cream">{c.cover && <Image src={c.cover} alt="" fill sizes="48px" className="object-cover" />}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium">{c.name}</span>
                      <span className="text-[12px] text-a-muted">
                        {count} pieces{!c.published && " · unpublished"}
                      </span>
                    </span>
                    <span className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", on ? "bg-charcoal" : "bg-a-line")}>
                      <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform", on ? "translate-x-[18px]" : "translate-x-0.5")} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Products */}
        <section aria-labelledby="prods-h">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 id="prods-h" className="mr-auto text-[13px] font-semibold">
              Individual pieces
            </h2>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-a-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Code or name" aria-label="Search products" className={`${inlineInput} w-44 pl-8`} />
            </div>
            <select value={cat} onChange={(e) => setCat(e.target.value)} aria-label="Filter by category" className={`${inlineInput} w-36`}>
              <option value="">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </select>
            <label className="flex items-center gap-2 text-[12.5px] text-a-muted">
              <input type="checkbox" checked={onlySelected} onChange={(e) => setOnlySelected(e.target.checked)} className="accent-charcoal" /> Assigned only
            </label>
          </div>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {filtered.map((p) => {
              const via = viaCollection(p);
              const on = via || prods.has(p.id);
              return (
                <li key={p.id}>
                  <button
                    onClick={() => !via && setProds((s) => toggle(s, p.id))}
                    disabled={via}
                    aria-pressed={on}
                    title={via ? `Included via ${colName.get(p.collectionId!)}` : undefined}
                    className={cn(
                      "group relative block w-full overflow-hidden rounded-md border bg-white text-left transition-colors",
                      on ? "border-charcoal/60" : "border-a-line hover:border-a-muted/40",
                      via && "cursor-default",
                      p.status !== "published" && "opacity-60",
                    )}
                  >
                    <span className="relative block aspect-[4/3] bg-cream">
                      {p.cover && <Image src={p.cover} alt="" fill sizes="200px" className="object-cover" />}
                      <span className={cn("absolute left-2 top-2 grid h-5 w-5 place-items-center rounded border shadow-sm", on ? "border-charcoal bg-charcoal text-white" : "border-white/80 bg-white/90")}>
                        {via ? <Lock className="h-2.5 w-2.5" /> : on && <Check className="h-3 w-3" strokeWidth={2.5} />}
                      </span>
                    </span>
                    <span className="block px-2.5 py-2">
                      <span className="block text-[12px] font-semibold">{p.code}</span>
                      <span className="block truncate text-[12px] text-a-muted">{p.name}</span>
                      <span className="mt-1 block truncate text-[11px] text-a-muted">
                        {via ? `Via ${colName.get(p.collectionId!)}` : p.status !== "published" ? `${p.status} — not visible` : categoryLabel(p.category)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {filtered.length === 0 && <p className="py-10 text-center text-[13px] text-a-muted">No pieces match.</p>}
        </section>
      </div>

      {/* Confirmation bar */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-a-line bg-white/95 backdrop-blur lg:left-[248px]">
        <div className="flex flex-wrap items-center gap-3 px-5 py-3 md:px-8">
          <AnimatePresence>
            {justSaved && (
              <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <LineLottie kind="success" size={32} color="#3d7a55" label="Saved" />
              </motion.span>
            )}
          </AnimatePresence>
          <p className="text-[13px]">
            <strong className="font-semibold tabular">{visibleProducts.length}</strong> products assigned ·{" "}
            <strong className="font-semibold tabular">{cols.size}</strong> collections assigned
            <span className="text-a-muted"> · {individual.length} individual</span>
          </p>
          {dirty && <Badge tone="warn">Unsaved changes</Badge>}
          <div className="ml-auto flex gap-2">
            <AButton
              disabled={!dirty || pending}
              onClick={() => {
                setCols(new Set(saved.cols ? saved.cols.split(",") : []));
                setProds(new Set(saved.prods ? saved.prods.split(",") : []));
              }}
            >
              Reset
            </AButton>
            <AButton variant="primary" disabled={!dirty || pending} onClick={save}>
              {pending ? "Saving…" : "Save catalogue"}
            </AButton>
          </div>
        </div>
      </div>
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}

function Step({ icon: Icon, n, label, value, sub, children }: { icon: typeof Users; n: number; label: string; value: string; sub?: string; children?: React.ReactNode }) {
  return (
    <div className="bg-white px-5 py-4 md:px-8">
      <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.12em] text-a-muted">
        <span className="grid h-5 w-5 place-items-center rounded-full bg-a-subtle text-[10px] text-a-text">{n}</span>
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="mt-2 truncate text-[15px] font-semibold">{value}</p>
      {sub && <p className="text-[12px] text-a-muted">{sub}</p>}
      {children}
    </div>
  );
}
