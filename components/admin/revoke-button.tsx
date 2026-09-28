"use client";

import { useState, useTransition } from "react";
import { Power } from "lucide-react";
import { revokeSession } from "@/lib/actions/admin";
import { AButton } from "./ui";
import { Dialog } from "./dialog";

export function RevokeButton({ sessionId, who }: { sessionId: string; who: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <>
      <AButton variant="danger" className="h-8 px-2.5 text-[12px]" onClick={() => setOpen(true)}>
        <Power className="h-3.5 w-3.5" /> End
      </AButton>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`End ${who}'s session?`}
        description="The showroom closes in their browser within a minute. They can sign in again unless the account is disabled."
        footer={
          <>
            <AButton onClick={() => setOpen(false)}>Cancel</AButton>
            <AButton variant="danger" disabled={pending} onClick={() => start(async () => { await revokeSession(sessionId); setOpen(false); })}>
              {pending ? "Ending…" : "End session"}
            </AButton>
          </>
        }
      />
    </>
  );
}
