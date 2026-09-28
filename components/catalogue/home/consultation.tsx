import Image from "next/image";
import { Parallax, RevealText, FadeUp } from "@/components/animations/reveal";
import { ButtonLink } from "@/components/ui/button";

export function Consultation({ image, saved, advisor }: { image: string; saved: number; advisor: string | null }) {
  return (
    <section className="relative flex min-h-[80svh] items-center overflow-hidden bg-ink text-ivory">
      <Parallax speed={14} className="absolute -inset-y-[8%] inset-x-0">
        <Image src={image} alt="" fill sizes="100vw" className="object-cover object-[70%_50%]" />
      </Parallax>
      <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/50 to-transparent" />
      <div className="relative px-gutter py-24">
        <p className="eyebrow text-soft-gold">Personal Consultation</p>
        <RevealText text={"Discover. Shortlist.\nDiscuss in private."} className="display mt-6 max-w-2xl text-[2.6rem] leading-[1.05] sm:text-[3.6rem] lg:text-[4.4rem]" />
        <FadeUp className="mt-8 max-w-md text-[0.95rem] leading-relaxed text-ivory/75">
          <p>
            {saved > 0
              ? `You have ${saved} ${saved === 1 ? "piece" : "pieces"} on your shortlist. ${advisor ?? "Your advisor"} can arrange a private viewing at the salon, a video consultation, or bring the pieces to you.`
              : `Save the pieces that speak to you. ${advisor ?? "Your advisor"} will arrange a private viewing at the salon, a video consultation, or bring them to you.`}
          </p>
        </FadeUp>
        <FadeUp delay={0.2} className="mt-12">
          <ButtonLink href="/shortlist" variant="light">
            {saved > 0 ? "Discuss Selected Pieces" : "View Shortlist"}
          </ButtonLink>
        </FadeUp>
      </div>
    </section>
  );
}
