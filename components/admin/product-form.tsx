"use client";

import { useActionState, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { saveProduct, type ProductFormState } from "@/lib/actions/admin";
import { CATEGORIES, SHAPES } from "@/lib/taxonomy";
import { AButton, Field, inputClass } from "./ui";
import { Toast } from "./dialog";

type Initial = {
  code?: string;
  name?: string;
  category?: string;
  gender?: string;
  shape?: string | null;
  collectionId?: string | null;
  description?: string | null;
  status?: string;
  isNew?: boolean;
  specifications?: { label: string; value: string }[];
};

export function ProductForm({ productId, initial = {}, collections }: { productId: string | null; initial?: Initial; collections: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState<ProductFormState, FormData>(saveProduct.bind(null, productId), {});
  const [specs, setSpecs] = useState(initial.specifications?.length ? initial.specifications : [{ label: "Metal", value: "" }]);
  const [toast, setToast] = useState<string | null>(null);
  const fe = state.fieldErrors ?? {};
  // Surface a toast once per successful save (state adjusted during render, not in an effect).
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) setToast("Product saved");
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <Field label="Product code" error={fe.code} hint="e.g. R-1024">
          <input name="code" defaultValue={initial.code} className={`${inputClass} font-mono uppercase`} aria-invalid={!!fe.code} required />
        </Field>
        <Field label="Product name" error={fe.name}>
          <input name="name" defaultValue={initial.name} className={inputClass} aria-invalid={!!fe.name} required />
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Category">
          <select name="category" defaultValue={initial.category ?? "RING"} className={inputClass}>
            {CATEGORIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label} ({c.code})
              </option>
            ))}
          </select>
        </Field>
        <Field label="Gender">
          <select name="gender" defaultValue={initial.gender ?? "FEMALE"} className={inputClass}>
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
          </select>
        </Field>
        <Field label="Shape">
          <select name="shape" defaultValue={initial.shape ?? ""} className={inputClass}>
            <option value="">—</option>
            {SHAPES.map((s) => (
              <option key={s.code} value={s.code}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Collection">
          <select name="collectionId" defaultValue={initial.collectionId ?? ""} className={inputClass}>
            <option value="">None</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field label="Description" hint="Shown to clients on the piece page">
        <textarea name="description" rows={4} defaultValue={initial.description ?? ""} className={`${inputClass} h-auto py-2 leading-relaxed`} />
      </Field>

      <div>
        <p className="text-[12px] font-medium">Specifications</p>
        <p className="text-[12px] text-a-muted">Selected details shown under “Selected Specifications”.</p>
        <input type="hidden" name="specifications" value={JSON.stringify(specs)} />
        <ul className="mt-2 space-y-2">
          {specs.map((s, i) => (
            <li key={i} className="grid grid-cols-[1fr_1.6fr_auto] gap-2">
              <input
                value={s.label}
                onChange={(e) => setSpecs((xs) => xs.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))}
                placeholder="Label"
                aria-label={`Specification ${i + 1} label`}
                className={inputClass}
              />
              <input
                value={s.value}
                onChange={(e) => setSpecs((xs) => xs.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))}
                placeholder="Value"
                aria-label={`Specification ${i + 1} value`}
                className={inputClass}
              />
              <button type="button" onClick={() => setSpecs((xs) => xs.filter((_, j) => j !== i))} aria-label="Remove specification" className="grid h-9 w-9 place-items-center rounded-md text-a-muted hover:bg-a-subtle hover:text-danger">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setSpecs((xs) => [...xs, { label: "", value: "" }])} className="mt-2 flex items-center gap-1.5 text-[12.5px] text-a-muted hover:text-a-text">
          <Plus className="h-3.5 w-3.5" /> Add specification
        </button>
      </div>

      <div className="flex flex-wrap items-end gap-4 border-t border-a-line pt-5">
        <Field label="Status" className="w-40">
          <select name="status" defaultValue={initial.status ?? "draft"} className={inputClass}>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </Field>
        <label className="flex h-9 items-center gap-2 text-[13px]">
          <input type="checkbox" name="isNew" defaultChecked={initial.isNew} className="accent-charcoal" /> Mark as new arrival
        </label>
        <div className="ml-auto">
          <AButton type="submit" variant="primary" disabled={pending}>
            {pending ? "Saving…" : productId ? "Save product" : "Create product"}
          </AButton>
        </div>
      </div>
      {state.error && (
        <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">
          {state.error}
        </p>
      )}
      <Toast message={toast} onDone={() => setToast(null)} />
    </form>
  );
}
