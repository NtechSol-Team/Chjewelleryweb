"use client";

import { useActionState } from "react";
import { adminLogin, type AdminLoginState } from "@/lib/actions/admin";
import { AButton, Field, inputClass } from "./ui";

export function AdminLoginForm() {
  const [state, action, pending] = useActionState<AdminLoginState, FormData>(adminLogin, {});
  return (
    <form action={action} className="mt-8 space-y-4">
      <Field label="Email">
        <input name="email" type="email" autoComplete="username" required defaultValue={state.email} className={inputClass} aria-invalid={!!state.error} />
      </Field>
      <Field label="Password">
        <input name="password" type="password" autoComplete="current-password" required className={inputClass} aria-invalid={!!state.error} />
      </Field>
      {state.error && (
        <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">
          {state.error}
        </p>
      )}
      <AButton type="submit" variant="primary" className="h-10 w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </AButton>
    </form>
  );
}
