"use client";

import "./globals.css";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col items-center justify-center bg-ivory px-6 text-center">
        <p className="eyebrow text-gold-deep">Connection Interrupted</p>
        <h1 className="display mt-5 text-[2.6rem]">The showroom could not be reached.</h1>
        <p className="mt-5 max-w-md text-muted">Please check your connection and try again. Your session remains private.</p>
        <button onClick={reset} className="mt-10 h-14 bg-charcoal px-10 eyebrow text-[0.68rem] text-ivory">
          Try Again
        </button>
      </body>
    </html>
  );
}
