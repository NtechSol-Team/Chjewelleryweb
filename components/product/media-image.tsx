"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { ImageOff } from "lucide-react";
import { cn } from "@/lib/cn";

/** next/image with a soft fade-in and an elegant "media unavailable" state. */
export function MediaImage({ className, alt, onLoad, ...props }: ImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  if (failed || !props.src) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-cream text-muted">
        <ImageOff className="h-5 w-5" strokeWidth={1} />
        <span className="eyebrow text-[0.55rem]">Media unavailable</span>
      </div>
    );
  }
  return (
    <Image
      {...props}
      alt={alt}
      draggable={false}
      onContextMenu={(e) => e.preventDefault()}
      onLoad={(e) => {
        setLoaded(true);
        onLoad?.(e);
      }}
      onError={() => setFailed(true)}
      className={cn("transition-[opacity,filter] duration-[1200ms] ease-[var(--ease-lux)]", loaded ? "opacity-100 blur-0" : "opacity-0 blur-sm", className)}
    />
  );
}
