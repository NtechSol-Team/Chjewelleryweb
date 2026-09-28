/**
 * Client-defined catalogue taxonomy. Codes come from the CH Jewels brief
 * (RING, ER, PS, BROCH, MS, LB, LK, NK, MALE, FEMALE, SHAPE); the display
 * labels are configurable here without touching any stored data.
 */

export const CATEGORIES = [
  { code: "RING", label: "Rings", singular: "Ring" },
  { code: "ER", label: "Earrings", singular: "Earrings" },
  { code: "NK", label: "Necklaces", singular: "Necklace" },
  { code: "PS", label: "Pendant Sets", singular: "Pendant" },
  { code: "BROCH", label: "Brooches", singular: "Brooch" },
  { code: "LB", label: "Bracelets", singular: "Bracelet" },
  { code: "LK", label: "Kadas", singular: "Kada" },
  { code: "MS", label: "Mangalsutra", singular: "Mangalsutra" },
] as const;

export const GENDERS = [
  { code: "FEMALE", label: "Women" },
  { code: "MALE", label: "Men" },
] as const;

export const SHAPES = [
  { code: "ROUND", label: "Round Brilliant" },
  { code: "PEAR", label: "Pear" },
  { code: "OVAL", label: "Oval" },
  { code: "CUSHION", label: "Cushion" },
  { code: "EMERALD", label: "Emerald Cut" },
  { code: "PRINCESS", label: "Princess" },
  { code: "MARQUISE", label: "Marquise" },
  { code: "MIXED", label: "Mixed Cuts" },
] as const;

export type CategoryCode = (typeof CATEGORIES)[number]["code"];

const categoryMap = new Map<string, (typeof CATEGORIES)[number]>(CATEGORIES.map((c) => [c.code, c]));
const shapeMap = new Map<string, string>(SHAPES.map((s) => [s.code, s.label]));
const genderMap = new Map<string, string>(GENDERS.map((g) => [g.code, g.label]));

export const categoryLabel = (code: string) => categoryMap.get(code)?.label ?? code;
export const categorySingular = (code: string) => categoryMap.get(code)?.singular ?? code;
export const shapeLabel = (code?: string | null) => (code ? shapeMap.get(code) ?? code : "—");
export const genderLabel = (code: string) => genderMap.get(code) ?? code;
