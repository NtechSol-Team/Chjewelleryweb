"use client";

import { createContext, useCallback, useContext, useState, useTransition, type ReactNode } from "react";
import { toggleShortlist as toggleAction } from "@/lib/actions/shortlist";

export type ShowroomClient = {
  displayName: string;
  shortName: string;
  firstName: string;
  sessionRef: string;
  sessionStarted: string;
};

type Ctx = {
  client: ShowroomClient;
  watermark: { enabled: boolean; opacity: number };
  isShortlisted: (id: string) => boolean;
  toggle: (id: string, code: string) => Promise<boolean>;
  shortlistCount: number;
  pending: boolean;
  lastSaved: { code: string; saved: boolean; at: number } | null;
};

const ShowroomContext = createContext<Ctx | null>(null);

export function ShowroomProvider({
  client,
  watermark,
  initialShortlist,
  children,
}: {
  client: ShowroomClient;
  watermark: Ctx["watermark"];
  initialShortlist: string[];
  children: ReactNode;
}) {
  const [ids, setIds] = useState(() => new Set(initialShortlist));
  const [pending, start] = useTransition();
  const [lastSaved, setLastSaved] = useState<Ctx["lastSaved"]>(null);

  const toggle = useCallback(
    (id: string, code: string) =>
      new Promise<boolean>((resolve) => {
        const wasSaved = ids.has(id);
        // Optimistic: the heart responds instantly; the server confirms.
        setIds((prev) => {
          const next = new Set(prev);
          if (wasSaved) next.delete(id);
          else next.add(id);
          return next;
        });
        start(async () => {
          const res = await toggleAction(id, code);
          if (!res.ok) {
            setIds((prev) => {
              const next = new Set(prev);
              if (wasSaved) next.add(id);
              else next.delete(id);
              return next;
            });
            resolve(wasSaved);
            return;
          }
          setLastSaved({ code, saved: res.saved, at: Date.now() });
          resolve(res.saved);
        });
      }),
    [ids],
  );

  return (
    <ShowroomContext.Provider
      value={{ client, watermark, isShortlisted: (id) => ids.has(id), toggle, shortlistCount: ids.size, pending, lastSaved }}
    >
      {children}
    </ShowroomContext.Provider>
  );
}

export function useShowroom() {
  const ctx = useContext(ShowroomContext);
  if (!ctx) throw new Error("useShowroom must be used inside <ShowroomProvider>");
  return ctx;
}
