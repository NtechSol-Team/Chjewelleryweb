"use client";

import { useState, useTransition } from "react";
import type { AppSettings } from "@/lib/settings";
import { saveSettings } from "@/lib/actions/admin";
import { AButton, Card, Field, inputClass } from "./ui";
import { Toast } from "./dialog";

function Switch({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description: string }) {
  return (
    <div className="flex items-start justify-between gap-6 py-3">
      <div>
        <p className="text-[13px] font-medium">{label}</p>
        <p className="mt-0.5 max-w-lg text-[12.5px] text-a-muted">{description}</p>
      </div>
      <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className={`relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${checked ? "bg-charcoal" : "bg-a-line"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[18px]" : "translate-x-0.5"}`} />
      </button>
    </div>
  );
}

export function SettingsForm({ initial }: { initial: AppSettings }) {
  const [s, setS] = useState(initial);
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="max-w-3xl space-y-5">
      <Card title="Content protection" description="Deterrence and traceability. No website can fully prevent screenshots or photos of the screen.">
        <Switch label="Dynamic watermark" description="Tile product media with CH JEWELS · PRIVATE VIEWING, the client's name and session reference." checked={s.watermark.enabled} onChange={(v) => setS({ ...s, watermark: { ...s.watermark, enabled: v } })} />
        <div className="flex items-center gap-4 pb-3 pl-0">
          <label htmlFor="wm" className="w-32 text-[12.5px] text-a-muted">Watermark strength</label>
          <input id="wm" type="range" min={0.03} max={0.2} step={0.01} value={s.watermark.opacity} onChange={(e) => setS({ ...s, watermark: { ...s.watermark, opacity: Number(e.target.value) } })} className="flex-1 accent-charcoal" disabled={!s.watermark.enabled} />
          <span className="w-10 text-right text-[12.5px] tabular">{Math.round(s.watermark.opacity * 100)}%</span>
        </div>
        <div className="border-t border-a-line">
          <Switch label="Blur when the window loses focus" description="Veil the showroom when the client switches tab or app, with a gentle “Return to this window” message." checked={s.privacyBlur.enabled} onChange={(v) => setS({ ...s, privacyBlur: { enabled: v } })} />
        </div>
      </Card>

      <Card title="Sessions">
        <Switch label="Single active session" description="Signing in on a new device ends the client's previous session." checked={s.session.singleSession} onChange={(v) => setS({ ...s, session: { ...s.session, singleSession: v } })} />
        <div className="mt-3 grid gap-4 border-t border-a-line pt-4 sm:grid-cols-2">
          <Field label="Idle timeout (minutes)" hint="5–240">
            <input type="number" min={5} max={240} value={s.session.idleMinutes} onChange={(e) => setS({ ...s, session: { ...s.session, idleMinutes: Number(e.target.value) } })} className={inputClass} />
          </Field>
          <Field label="Maximum session length (hours)" hint="1–72">
            <input type="number" min={1} max={72} value={s.session.maxHours} onChange={(e) => setS({ ...s, session: { ...s.session, maxHours: Number(e.target.value) } })} className={inputClass} />
          </Field>
        </div>
      </Card>

      <Card title="Client concierge" description="Shown on access screens, the profile page and the footer.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone">
            <input value={s.concierge.phone} onChange={(e) => setS({ ...s, concierge: { ...s.concierge, phone: e.target.value } })} className={inputClass} />
          </Field>
          <Field label="Email">
            <input type="email" value={s.concierge.email} onChange={(e) => setS({ ...s, concierge: { ...s.concierge, email: e.target.value } })} className={inputClass} />
          </Field>
          <Field label="Hours" className="sm:col-span-2">
            <input value={s.concierge.hours} onChange={(e) => setS({ ...s, concierge: { ...s.concierge, hours: e.target.value } })} className={inputClass} />
          </Field>
        </div>
      </Card>

      {error && <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">{error}</p>}
      <div className="flex justify-end">
        <AButton
          variant="primary"
          disabled={pending}
          onClick={() =>
            start(async () => {
              setError(null);
              try {
                await saveSettings(s);
                setToast("Settings saved");
              } catch {
                setError("Some values are out of range. Please review and try again.");
              }
            })
          }
        >
          {pending ? "Saving…" : "Save settings"}
        </AButton>
      </div>
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}
