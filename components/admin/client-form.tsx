"use client";

import { useActionState, useState } from "react";
import { saveClient, type ClientFormState } from "@/lib/actions/admin";
import { AButton, Field, inputClass } from "./ui";
import { Toast } from "./dialog";

type Initial = {
  salutation?: string | null;
  firstName?: string;
  lastName?: string;
  company?: string | null;
  city?: string | null;
  email?: string | null;
  phone?: string | null;
  username?: string;
  advisor?: string | null;
  accessStartsAt?: string | null;
  accessEndsAt?: string | null;
  notes?: string | null;
};

export function ClientForm({ clientId, initial = {}, advisors }: { clientId: string | null; initial?: Initial; advisors: string[] }) {
  const [state, action, pending] = useActionState<ClientFormState, FormData>(saveClient.bind(null, clientId), {});
  const [toast, setToast] = useState<string | null>(null);
  const fe = state.fieldErrors ?? {};
  // Surface a toast once per successful save (state adjusted during render, not in an effect).
  const [seen, setSeen] = useState(state);
  if (state !== seen) {
    setSeen(state);
    if (state.ok) setToast("Client saved");
  }

  return (
    <form action={action} className="space-y-6" noValidate>
      <fieldset className="grid gap-4 sm:grid-cols-[7rem_1fr_1fr]">
        <legend className="mb-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-a-muted">Client</legend>
        <Field label="Title">
          <select name="salutation" defaultValue={initial.salutation ?? "Mr."} className={inputClass}>
            {["Mr.", "Mrs.", "Ms.", "Dr.", ""].map((s) => (
              <option key={s} value={s}>
                {s || "—"}
              </option>
            ))}
          </select>
        </Field>
        <Field label="First name" error={fe.firstName}>
          <input name="firstName" defaultValue={initial.firstName} className={inputClass} aria-invalid={!!fe.firstName} required />
        </Field>
        <Field label="Last name" error={fe.lastName}>
          <input name="lastName" defaultValue={initial.lastName} className={inputClass} aria-invalid={!!fe.lastName} required />
        </Field>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Company">
          <input name="company" defaultValue={initial.company ?? ""} className={inputClass} />
        </Field>
        <Field label="City">
          <input name="city" defaultValue={initial.city ?? ""} className={inputClass} />
        </Field>
        <Field label="Email" error={fe.email}>
          <input name="email" type="email" defaultValue={initial.email ?? ""} className={inputClass} aria-invalid={!!fe.email} />
        </Field>
        <Field label="Phone">
          <input name="phone" defaultValue={initial.phone ?? ""} className={inputClass} />
        </Field>
      </div>

      <fieldset className="grid gap-4 border-t border-a-line pt-6 sm:grid-cols-2">
        <legend className="mb-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-a-muted">Access</legend>
        <Field label="Username" error={fe.username} hint="Lowercase, e.g. arjun.mehta">
          <input name="username" defaultValue={initial.username} className={`${inputClass} font-mono`} aria-invalid={!!fe.username} autoComplete="off" required />
        </Field>
        <Field label={clientId ? "New password" : "Initial password"} error={fe.password} hint={clientId ? "Leave blank to keep the current password" : "At least 8 characters"}>
          <input name="password" type="password" className={inputClass} autoComplete="new-password" aria-invalid={!!fe.password} />
        </Field>
        <Field label="Access starts" hint="Optional">
          <input name="accessStartsAt" type="date" defaultValue={initial.accessStartsAt ?? ""} className={inputClass} />
        </Field>
        <Field label="Access ends" hint="Access closes at the end of this day">
          <input name="accessEndsAt" type="date" defaultValue={initial.accessEndsAt ?? ""} className={inputClass} />
        </Field>
        <Field label="Advisor">
          <select name="advisor" defaultValue={initial.advisor ?? advisors[0]} className={inputClass}>
            {advisors.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </Field>
      </fieldset>

      <Field label="Internal notes" hint="Never shown to the client">
        <textarea name="notes" rows={3} defaultValue={initial.notes ?? ""} className={`${inputClass} h-auto py-2`} />
      </Field>

      {state.error && (
        <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">
          {state.error}
        </p>
      )}
      <div className="flex justify-end gap-2 border-t border-a-line pt-5">
        <AButton type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : clientId ? "Save changes" : "Create client & assign catalogue"}
        </AButton>
      </div>
      <Toast message={toast} onDone={() => setToast(null)} />
    </form>
  );
}
