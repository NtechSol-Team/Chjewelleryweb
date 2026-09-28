import { PieceCardSkeleton } from "@/components/catalogue/piece-card";

export default function Loading() {
  return (
    <div className="px-gutter pb-24 pt-[calc(var(--header-h)+6rem)]" aria-busy="true" aria-label="Loading pieces">
      <div className="h-3 w-40 skeleton" />
      <div className="mt-6 h-20 w-2/3 max-w-xl skeleton" />
      <div className="mt-20 grid gap-x-12 gap-y-20 xs:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <PieceCardSkeleton key={i} ratio={i % 3 === 1 ? "tall" : "portrait"} />
        ))}
      </div>
    </div>
  );
}
