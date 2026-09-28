import Link from "next/link";
import { Wordmark } from "@/components/ui/brand";
import { clientLogout } from "@/lib/actions/client-auth";

export function Footer({ concierge }: { concierge: { phone: string; email: string; hours: string } }) {
  return (
    <footer className="border-t border-line bg-ivory px-gutter pb-10 pt-20">
      <div className="flex flex-col items-center text-center">
        <Wordmark variant="stacked" caption="Private & Confidential" className="text-[0.85rem]" />
        <p className="mt-8 max-w-sm font-display text-xl italic text-muted">Private digital showroom for selected clients.</p>
      </div>
      <div className="mx-auto mt-16 grid max-w-4xl gap-8 border-t border-line pt-8 text-center sm:grid-cols-3 sm:text-left">
        <div>
          <p className="eyebrow text-[0.58rem] text-muted">Concierge</p>
          <a href={`tel:${concierge.phone.replace(/\s/g, "")}`} className="mt-2 block text-[0.85rem] hover:text-gold-deep">
            {concierge.phone}
          </a>
          <a href={`mailto:${concierge.email}`} className="block text-[0.85rem] hover:text-gold-deep">
            {concierge.email}
          </a>
        </div>
        <div className="sm:text-center">
          <p className="eyebrow text-[0.58rem] text-muted">Appointments</p>
          <p className="mt-2 text-[0.85rem]">{concierge.hours}</p>
        </div>
        <div className="sm:text-right">
          <p className="eyebrow text-[0.58rem] text-muted">Your Access</p>
          <div className="mt-2 flex justify-center gap-6 text-[0.85rem] sm:justify-end">
            <Link href="/profile" className="hover:text-gold-deep">
              Profile
            </Link>
            <form action={clientLogout}>
              <button className="hover:text-gold-deep">Sign out</button>
            </form>
          </div>
        </div>
      </div>
      <p className="mt-12 text-center eyebrow text-[0.54rem] text-muted/80">
        © {new Date().getFullYear()} CH Jewels · Images are watermarked and viewing is recorded for your security
      </p>
    </footer>
  );
}
