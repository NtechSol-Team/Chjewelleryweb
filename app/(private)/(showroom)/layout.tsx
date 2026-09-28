import { getSettings } from "@/lib/settings";
import { Header } from "@/components/showroom/header";
import { Footer } from "@/components/showroom/footer";
import { ShortlistToast } from "@/components/showroom/shortlist-toast";

export default async function ShowroomLayout({ children }: { children: React.ReactNode }) {
  const { concierge } = await getSettings();
  return (
    <>
      <Header />
      <main id="content">{children}</main>
      <Footer concierge={concierge} />
      <ShortlistToast />
    </>
  );
}
