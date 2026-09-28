import { StateScreen } from "@/components/showroom/state-screen";
import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <StateScreen
      icon="diamond"
      label="Page Unavailable"
      title="This page is not part of your showroom."
      body={<p>The address may have changed, or the page may be reserved for another client.</p>}
      actions={<ButtonLink href="/catalogue">Return to Collection</ButtonLink>}
    />
  );
}
