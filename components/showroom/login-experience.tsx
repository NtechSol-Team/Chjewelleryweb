"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import { clientLogin, type LoginState } from "@/lib/actions/client-auth";
import { gsap, useGSAP, prefersReducedMotion } from "@/lib/gsap";
import { Wordmark } from "@/components/ui/brand";
import { LineLottie } from "@/components/animations/line-lottie";

const MESSAGES: Record<NonNullable<LoginState["error"]>, string> = {
  invalid: "These credentials were not recognised. Please check and try again.",
  missing: "Please enter your username and password.",
  disabled: "This private access has been paused. Your advisor will be glad to assist.",
  "access-expired": "Your catalogue access is no longer active. Please contact CH Jewels to renew.",
  "access-pending": "Your private access has been prepared and will open shortly.",
  throttled: "For your security, access is briefly paused after several attempts. Please try again in a few minutes.",
};

export function LoginExperience({ image, signedOut }: { image: string; signedOut: boolean }) {
  const [state, action, pending] = useActionState(clientLogin, {});
  const [showPw, setShowPw] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        gsap.set("[data-enter]", { opacity: 1, y: 0 });
        return;
      }
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
      tl.fromTo("[data-login-image]", { clipPath: "inset(0 0 0 100%)" }, { clipPath: "inset(0 0 0 0%)", duration: 1.8, ease: "expo.inOut" })
        .fromTo("[data-login-photo]", { scale: 1.22 }, { scale: 1.04, duration: 3.2 }, 0.1)
        .fromTo("[data-logo]", { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 1.6 }, 0.5)
        .fromTo("[data-enter]", { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 1.3, stagger: 0.09 }, 0.8);
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative grid min-h-dvh bg-ivory lg:grid-cols-[1.15fr_1fr]">
      {/* Editorial image */}
      <div data-login-image className="relative h-[42vh] overflow-hidden bg-ink md:h-[48vh] lg:sticky lg:top-0 lg:h-dvh">
        <div data-login-photo className="absolute inset-0 will-change-transform">
          <Image src={image} alt="" fill priority sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover object-[50%_30%]" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-ink/30" />
        <div className="absolute inset-x-0 bottom-0 hidden items-end justify-between p-10 text-ivory/80 lg:flex">
          <div>
            <p className="eyebrow text-[0.62rem] text-soft-gold">Private Collection</p>
            <p className="mt-3 max-w-xs font-display text-2xl italic leading-snug text-ivory/90">
              Jewellery presented, not listed.
            </p>
          </div>
          <p className="eyebrow text-[0.6rem]">MMXXVI</p>
        </div>
        {/* Mobile fade into the form */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ivory to-transparent lg:hidden" />
      </div>

      {/* Access panel */}
      <div className="relative flex flex-col px-6 pb-10 pt-2 sm:px-12 lg:min-h-dvh lg:px-16 lg:py-12 xl:px-24">
        <div data-logo className="-mt-10 flex justify-center opacity-0 lg:mt-6">
          <Wordmark variant="stacked" className="text-[0.9rem] lg:text-base" />
        </div>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12 lg:py-0">
          <p data-enter className="eyebrow text-center text-gold-deep opacity-0">
            Private Access
          </p>
          <h1 data-enter className="display mt-5 text-center text-[2.1rem] leading-[1.1] opacity-0 sm:text-[2.5rem]">
            Your personal CH Jewels
            <br />
            collection awaits.
          </h1>

          <AnimatePresence>
            {signedOut && !state.error && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 flex items-center justify-center gap-2 text-center text-[0.8rem] text-muted"
              >
                <ShieldCheck className="h-4 w-4 text-champagne" strokeWidth={1.25} /> You have been signed out securely.
              </motion.p>
            )}
          </AnimatePresence>

          <form action={action} className="mt-12 space-y-8" noValidate>
            <Field label="Username" delay>
              <input
                name="username"
                autoComplete="username"
                defaultValue={state.username}
                required
                aria-invalid={!!state.error}
                aria-describedby={state.error ? "login-error" : undefined}
                className="peer w-full bg-transparent pb-3 pt-1 text-[1.02rem] tracking-wide text-charcoal outline-none placeholder:text-muted/50"
                placeholder="Your private username"
              />
            </Field>
            <Field label="Password">
              <input
                name="password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                required
                aria-invalid={!!state.error}
                aria-describedby={state.error ? "login-error" : undefined}
                className="peer w-full bg-transparent pb-3 pr-10 pt-1 text-[1.02rem] tracking-wide text-charcoal outline-none placeholder:text-muted/50"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute bottom-3 right-0 text-muted transition-colors hover:text-charcoal"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? <EyeOff className="h-4 w-4" strokeWidth={1.25} /> : <Eye className="h-4 w-4" strokeWidth={1.25} />}
              </button>
            </Field>

            <AnimatePresence mode="wait">
              {state.error && (
                <motion.p
                  key={state.error}
                  id="login-error"
                  role="alert"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-l border-champagne pl-4 text-[0.82rem] leading-relaxed text-charcoal/80"
                >
                  {MESSAGES[state.error]}
                </motion.p>
              )}
            </AnimatePresence>

            <div data-enter className="opacity-0">
              <button
                type="submit"
                disabled={pending}
                className="group relative flex h-15 w-full items-center justify-center gap-3 overflow-hidden bg-charcoal py-5 text-ivory transition-colors duration-500 hover:bg-ink disabled:cursor-wait"
              >
                <span className="eyebrow text-[0.68rem]">{pending ? "Verifying Access" : "Enter Private Showroom"}</span>
                <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-champagne transition-transform duration-700 ease-[var(--ease-lux)] group-hover:scale-x-100" />
                {pending && (
                  <span className="absolute inset-x-0 bottom-0 h-px origin-left bg-soft-gold" style={{ animation: "loader-line 1.6s var(--ease-silk) infinite" }} />
                )}
              </button>
            </div>
          </form>

          <div data-enter className="mt-10 flex flex-col items-center gap-3 opacity-0">
            {pending ? (
              <LineLottie kind="lock" size={40} label="Verifying secure access" />
            ) : (
              <Lock className="h-4 w-4 text-champagne" strokeWidth={1.2} aria-hidden />
            )}
            <p className="eyebrow text-[0.6rem] text-charcoal">Private &amp; Confidential</p>
            <p className="max-w-[18rem] text-center text-[0.75rem] leading-relaxed text-muted">
              Access is by personal invitation. For assistance, please contact your CH Jewels advisor.
            </p>
          </div>
        </div>

        <p className="mt-auto text-center eyebrow text-[0.56rem] text-muted/80">Encrypted session · Single-device access</p>
      </div>
    </div>
  );
}

function Field({ label, children, delay }: { label: string; children: React.ReactNode; delay?: boolean }) {
  return (
    <label data-enter className="relative block opacity-0" data-delay={delay}>
      <span className="eyebrow text-[0.6rem] text-muted">{label}</span>
      <span className="relative mt-3 block">
        {children}
        <span className="absolute inset-x-0 bottom-0 h-px bg-line" />
        <span className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-champagne transition-transform duration-700 ease-[var(--ease-lux)] peer-focus:scale-x-100" />
      </span>
    </label>
  );
}
