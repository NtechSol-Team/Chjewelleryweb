"use client";

import Image from "next/image";
import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Film, GripVertical, Link2, Rotate3d, Trash2, UploadCloud } from "lucide-react";
import type { ProductMedia } from "@/lib/db/schema";
import { addVideoUrl, deleteMedia, reorderMedia } from "@/lib/actions/admin";
import { AButton, Badge, inputClass } from "./ui";
import { Dialog, Toast } from "./dialog";
import { cn } from "@/lib/cn";

type Kind = "image" | "video" | "spin";

const ZONES: { kind: Kind; title: string; hint: string; accept: string; multiple: boolean }[] = [
  { kind: "image", title: "Images", hint: "JPG, PNG, WebP · 4–5 recommended · up to 15 MB each", accept: "image/jpeg,image/png,image/webp,image/avif", multiple: true },
  { kind: "video", title: "Film", hint: "MP4 or WebM · up to 120 MB", accept: "video/mp4,video/webm,video/quicktime", multiple: false },
  { kind: "spin", title: "360° frames", hint: "Select all frames at once, named in order (e.g. 01–36)", accept: "image/jpeg,image/png,image/webp", multiple: true },
];

export function MediaManager({ productId, media }: { productId: string; media: ProductMedia[] }) {
  const router = useRouter();
  const [items, setItems] = useState(media);
  const [dragId, setDragId] = useState<string | null>(null);
  const [uploading, setUploading] = useState<Kind | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [videoDialog, setVideoDialog] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [pending, start] = useTransition();
  const [lastMedia, setLastMedia] = useState(media);
  if (media !== lastMedia) {
    setLastMedia(media);
    setItems(media);
  }

  const images = items.filter((m) => m.kind === "image").length;

  const upload = async (kind: Kind, files: FileList | File[]) => {
    const list = [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    if (!list.length) return;
    setError(null);
    setUploading(kind);
    const fd = new FormData();
    fd.set("productId", productId);
    fd.set("kind", kind);
    list.forEach((f) => fd.append("files", f));
    const res = await fetch("/api/admin/media", { method: "POST", body: fd });
    setUploading(null);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? "Upload failed");
      return;
    }
    setToast(kind === "spin" ? `360° view added (${list.length} frames)` : `${list.length} file${list.length > 1 ? "s" : ""} uploaded`);
    router.refresh();
  };

  const onDropReorder = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const next = [...items];
    const from = next.findIndex((m) => m.id === dragId);
    const to = next.findIndex((m) => m.id === targetId);
    next.splice(to, 0, next.splice(from, 1)[0]);
    setItems(next);
    setDragId(null);
    start(async () => {
      await reorderMedia(productId, next.map((m) => m.id));
      setToast("Order saved");
    });
  };

  return (
    <div className="space-y-5">
      <div className="grid gap-3 lg:grid-cols-3">
        {ZONES.map((z) => (
          <DropZone key={z.kind} zone={z} busy={uploading === z.kind} onFiles={(f) => upload(z.kind, f)} extra={z.kind === "video" ? <button type="button" onClick={() => setVideoDialog(true)} className="mt-2 inline-flex items-center gap-1 text-[12px] text-a-muted underline-offset-2 hover:text-a-text hover:underline"><Link2 className="h-3 w-3" /> or add by URL</button> : null} />
        ))}
      </div>
      {error && <p role="alert" className="rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">{error}</p>}

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[12.5px] font-medium">
            Media order <span className="font-normal text-a-muted">— drag to reorder; the first image is the cover</span>
          </p>
          {images < 4 ? <Badge tone="warn">{images} of 4–5 images</Badge> : <Badge tone="ok">{images} images</Badge>}
        </div>
        {items.length === 0 ? (
          <p className="rounded-md border border-dashed border-a-line py-10 text-center text-[13px] text-a-muted">No media yet — upload images above.</p>
        ) : (
          <ul className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5", pending && "opacity-70")}>
            {items.map((m, i) => (
              <li
                key={m.id}
                draggable
                onDragStart={() => setDragId(m.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => onDropReorder(m.id)}
                className={cn("group relative overflow-hidden rounded-md border bg-white", dragId === m.id ? "border-champagne opacity-60" : "border-a-line")}
              >
                <div className="relative aspect-[4/5] bg-cream">
                  {m.kind === "video" ? (
                    m.posterUrl ? <Image src={m.posterUrl} alt="" fill sizes="220px" className="object-cover" unoptimized /> : <video src={m.url} className="h-full w-full object-cover" muted />
                  ) : (
                    <Image src={m.url} alt={m.alt ?? ""} fill sizes="220px" className="object-cover" />
                  )}
                  <span className="absolute left-2 top-2 flex items-center gap-1">
                    {i === items.findIndex((x) => x.kind === "image") && m.kind === "image" && <Badge tone="gold" dot={false}>Cover</Badge>}
                    {m.kind === "video" && <Badge dot={false}><Film className="h-3 w-3" /> Film</Badge>}
                    {m.kind === "spin" && <Badge dot={false}><Rotate3d className="h-3 w-3" /> 360° · {m.frames?.length ?? 0}</Badge>}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      start(async () => {
                        await deleteMedia(m.id);
                        setItems((xs) => xs.filter((x) => x.id !== m.id));
                        setToast("Media removed");
                      })
                    }
                    aria-label="Remove media"
                    className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded bg-white/90 text-a-muted opacity-0 shadow-sm transition-opacity hover:text-danger focus:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1.5 text-[11.5px] text-a-muted">
                  <GripVertical className="h-3.5 w-3.5 cursor-grab" aria-hidden />
                  <span className="tabular">{String(i + 1).padStart(2, "0")}</span>
                  <span className="truncate">{m.alt?.split("— ")[1] ?? m.kind}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Dialog
        open={videoDialog}
        onClose={() => setVideoDialog(false)}
        title="Add film by URL"
        description="For films hosted on your media CDN."
        footer={
          <>
            <AButton onClick={() => setVideoDialog(false)}>Cancel</AButton>
            <AButton
              variant="primary"
              disabled={!videoUrl || pending}
              onClick={() =>
                start(async () => {
                  try {
                    await addVideoUrl(productId, videoUrl);
                    setVideoDialog(false);
                    setVideoUrl("");
                    setToast("Film added");
                    router.refresh();
                  } catch {
                    setError("That URL could not be added.");
                  }
                })
              }
            >
              Add film
            </AButton>
          </>
        }
      >
        <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://…/film.mp4" className={inputClass} aria-label="Film URL" />
      </Dialog>
      <Toast message={toast} onDone={() => setToast(null)} />
    </div>
  );
}

function DropZone({ zone, busy, onFiles, extra }: { zone: (typeof ZONES)[number]; busy: boolean; onFiles: (f: FileList) => void; extra?: React.ReactNode }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
      }}
      className={cn("rounded-md border border-dashed p-4 text-center transition-colors", over ? "border-champagne bg-[#fbf6ea]" : "border-a-line bg-a-subtle/40")}
    >
      <UploadCloud className="mx-auto h-5 w-5 text-a-muted" strokeWidth={1.5} />
      <p className="mt-2 text-[13px] font-medium">{zone.title}</p>
      <p className="mt-0.5 text-[11.5px] text-a-muted">{zone.hint}</p>
      <button type="button" onClick={() => input.current?.click()} disabled={busy} className="mt-3 text-[12.5px] font-medium underline underline-offset-2 disabled:opacity-50">
        {busy ? "Uploading…" : "Drop files or browse"}
      </button>
      {extra}
      <input ref={input} type="file" accept={zone.accept} multiple={zone.multiple} className="sr-only" onChange={(e) => e.target.files && onFiles(e.target.files)} aria-label={`Upload ${zone.title}`} />
    </div>
  );
}
