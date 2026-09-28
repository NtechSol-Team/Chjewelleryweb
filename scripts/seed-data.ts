import type { Spec } from "../lib/db/schema";

export const COLLECTIONS = [
  {
    slug: "signature-rings",
    name: "Signature Rings",
    tagline: "Exceptional forms. Curated diamonds.",
    description:
      "The rings that define the house — solitaires and halos set by hand in our atelier, each centre stone selected personally for fire and symmetry.",
    cover: "photo-1677045419454-e8b201856472",
  },
  {
    slug: "timeless-necklaces",
    name: "Timeless Necklaces",
    tagline: "Light, worn close.",
    description:
      "Rivières, garlands and pendants composed to rest perfectly at the collarbone — heirlooms in waiting.",
    cover: "photo-1613966561243-c6959a886009",
  },
  {
    slug: "statement-pieces",
    name: "Statement Pieces",
    tagline: "For the evenings that are remembered.",
    description:
      "Sculptural, unapologetic and rare. Coloured stones, brooches and cocktail rings conceived as wearable art.",
    cover: "photo-1767381819098-4beaccc15a63",
  },
  {
    slug: "private-selection",
    name: "Private Selection",
    tagline: "Reserved for a few.",
    description:
      "One-of-a-kind pieces presented only by appointment. Many will not be repeated; some exist in a single example.",
    cover: "photo-1739194806935-3b4c66aee282",
  },
  {
    slug: "diamond-collection",
    name: "Diamond Collection",
    tagline: "Clarity, in its purest expression.",
    description:
      "White diamonds of exceptional colour and clarity — graded, certified and matched by our gemmologists in Antwerp and Surat.",
    cover: "photo-1735480165343-96034e9528f9",
  },
] as const;

type Row = {
  code: string;
  name: string;
  category: string;
  gender?: "FEMALE" | "MALE";
  shape?: string;
  collection: (typeof COLLECTIONS)[number]["slug"];
  photo: string;
  /** focal point of the piece within the photo, used for detail crops */
  focus?: [number, number];
  /** base zoom for the hero crop — used to frame out props */
  zoom?: number;
  specs: Spec[];
  description: string;
  video?: string;
  spin?: boolean;
  isNew?: boolean;
};

const s = (pairs: Record<string, string>): Spec[] => Object.entries(pairs).map(([label, value]) => ({ label, value }));

export const PRODUCTS: Row[] = [
  // ——— Rings
  {
    code: "R-1024", name: "Signature Diamond Ring", category: "RING", shape: "ROUND", collection: "signature-rings",
    photo: "photo-1605100804763-247f67b3557e", focus: [0.5, 0.45], video: "20877", spin: true, isNew: true,
    description: "A 2.01 carat round brilliant held in a whisper-fine halo, the split shank lined with graduated pavé so that light travels the full circumference of the hand.",
    specs: s({ Metal: "18K White Gold", "Centre Stone": "2.01 ct Round Brilliant", "Colour / Clarity": "E / VVS1", "Side Stones": "0.68 ct pavé", Certificate: "GIA 2231847561" }),
  },
  {
    code: "R-1031", name: "Pear Halo Solitaire", category: "RING", shape: "PEAR", collection: "signature-rings",
    photo: "photo-1605100804567-1ffe942b5cd6", focus: [0.5, 0.5], spin: true,
    description: "An elongated pear, framed by a single row of micro-set diamonds that follows the stone's silhouette to its point.",
    specs: s({ Metal: "Platinum 950", "Centre Stone": "1.52 ct Pear", "Colour / Clarity": "F / VS1", "Side Stones": "0.41 ct", Certificate: "GIA 6214530092" }),
  },
  {
    code: "R-1047", name: "Pear Cluster Cocktail Ring", category: "RING", shape: "PEAR", collection: "statement-pieces",
    photo: "photo-1607703829739-c05b7beddf60", focus: [0.5, 0.5],
    description: "Three tiers of pear and round diamonds rising around a central pear — a ring composed like a bouquet.",
    specs: s({ Metal: "18K White Gold", "Total Weight": "4.12 ct", "Centre Stone": "1.20 ct Pear", "Colour / Clarity": "G / VS1" }),
  },
  {
    code: "R-1052", name: "Cushion Double Halo", category: "RING", shape: "CUSHION", collection: "diamond-collection",
    photo: "photo-1589674668791-4889d2bba4c6", focus: [0.52, 0.5], isNew: true,
    description: "A cushion-cut centre wrapped in two concentric halos, paired with a matching pavé band.",
    specs: s({ Metal: "Platinum 950", "Centre Stone": "2.30 ct Cushion", "Colour / Clarity": "F / VVS2", "Side Stones": "1.10 ct", Certificate: "GIA 1206335519" }),
  },
  {
    code: "R-1066", name: "Crossover Pavé Band", category: "RING", shape: "ROUND", collection: "diamond-collection",
    photo: "photo-1589674781759-c21c37956a44", focus: [0.5, 0.5],
    description: "Two bands of pavé cross at the top of the finger — a quiet architectural gesture for everyday wear.",
    specs: s({ Metal: "18K White Gold", "Total Weight": "1.35 ct", "Colour / Clarity": "G / VS" }),
  },
  {
    code: "R-1073", name: "Six-Prong Solitaire", category: "RING", shape: "ROUND", collection: "signature-rings",
    photo: "photo-1677045419454-e8b201856472", focus: [0.5, 0.5], video: "5220",
    description: "The purest expression of the solitaire: six slender claws, a knife-edge band and a stone of exceptional brilliance.",
    specs: s({ Metal: "Platinum 950", "Centre Stone": "1.81 ct Round Brilliant", "Colour / Clarity": "D / IF", Certificate: "GIA 5221094467" }),
  },
  {
    code: "R-1088", name: "Emerald-Cut Trilogy", category: "RING", shape: "EMERALD", collection: "private-selection",
    photo: "photo-1648564585735-19491888545c", focus: [0.5, 0.45],
    description: "Three step-cut diamonds presented together — the long, calm flashes of the emerald cut at their most serene.",
    specs: s({ Metal: "Platinum 950", "Total Weight": "5.02 ct", "Colour / Clarity": "E–F / VVS", Certificate: "GIA (3)" }),
  },
  {
    code: "R-1091", name: "Cushion Halo Pavé Ring", category: "RING", shape: "CUSHION", collection: "signature-rings",
    photo: "photo-1747116404311-55f8d8944e83", focus: [0.5, 0.42],
    description: "A soft cushion outline with a hidden under-halo visible only in profile, and a double pavé shank.",
    specs: s({ Metal: "18K White Gold", "Centre Stone": "1.70 ct Cushion", "Colour / Clarity": "F / VS1", "Side Stones": "0.92 ct" }),
  },
  {
    code: "R-1105", name: "Baguette Cluster Ring", category: "RING", shape: "MIXED", collection: "diamond-collection",
    photo: "photo-1586104195538-050b9f74f58e", focus: [0.4, 0.5],
    description: "Baguettes arranged into a single illusion stone, surrounded by a double frame of rounds.",
    specs: s({ Metal: "18K White Gold", "Total Weight": "1.62 ct", "Colour / Clarity": "G / VS" }),
  },
  {
    code: "R-1112", name: "Colombian Emerald Ring", category: "RING", shape: "EMERALD", collection: "private-selection",
    photo: "photo-1685970732254-d2d1f43ddc7c", focus: [0.52, 0.34], isNew: true,
    description: "A vivid Colombian emerald of rare saturation, set east–west between two tapered diamonds.",
    specs: s({ Metal: "18K Yellow Gold", "Centre Stone": "2.44 ct Colombian Emerald", Treatment: "Minor oil", Certificate: "Gübelin" }),
  },
  {
    code: "R-1120", name: "Step-Cut Solitaire", category: "RING", shape: "EMERALD", collection: "signature-rings",
    photo: "photo-1714188662061-7189b3f81a9f", focus: [0.5, 0.5],
    description: "An emerald-cut diamond held in four double claws on a fine yellow-gold band.",
    specs: s({ Metal: "18K Yellow Gold", "Centre Stone": "1.05 ct Emerald Cut", "Colour / Clarity": "F / VVS2" }),
  },
  {
    code: "R-1134", name: "Emerald-Cut Eternity Band", category: "RING", shape: "EMERALD", collection: "diamond-collection",
    photo: "photo-1770372053533-d4a439ecc6b4", focus: [0.5, 0.55], video: "34611",
    description: "A continuous line of matched emerald-cut diamonds, each hand-selected for identical proportions.",
    specs: s({ Metal: "Platinum 950", "Total Weight": "6.10 ct", Stones: "17 × Emerald Cut", "Colour / Clarity": "E–F / VS1+" }),
  },
  {
    code: "R-1147", name: "Aquamarine Cocktail Ring", category: "RING", shape: "CUSHION", collection: "statement-pieces",
    photo: "photo-1714205636453-96327c424fcf", focus: [0.5, 0.5],
    description: "A Santa Maria aquamarine framed with sapphires and diamonds in a lace-like openwork gallery.",
    specs: s({ Metal: "18K White Gold", "Centre Stone": "8.60 ct Aquamarine", Accents: "Sapphire & diamond" }),
  },
  {
    code: "R-1159", name: "Filigree Heritage Ring", category: "RING", shape: "MIXED", collection: "statement-pieces",
    photo: "photo-1787769499024-7d0f38b609b1", focus: [0.5, 0.5],
    description: "Hand-pierced gold filigree in the manner of the old Surat workshops, finished with rose-cut diamonds.",
    specs: s({ Metal: "22K Yellow Gold", Technique: "Hand filigree", Accents: "Rose-cut diamonds" }),
  },
  {
    code: "R-1163", name: "Princess Ring in Rose Gold", category: "RING", shape: "PRINCESS", collection: "private-selection",
    photo: "photo-1713950920412-97799efdf870", focus: [0.55, 0.5],
    description: "A princess-cut diamond set on the diagonal, carried by a split band in warm rose gold.",
    specs: s({ Metal: "18K Rose Gold", "Centre Stone": "0.92 ct Princess", "Colour / Clarity": "G / VS1" }),
  },
  {
    code: "R-1178", name: "Round Halo on Knife-Edge", category: "RING", shape: "ROUND", collection: "diamond-collection",
    photo: "photo-1613945407943-59cd755fd69e", focus: [0.48, 0.5],
    description: "A classic halo engagement ring with a knife-edge pavé shank that narrows to the palm.",
    specs: s({ Metal: "18K White Gold", "Centre Stone": "1.50 ct Round Brilliant", "Colour / Clarity": "F / VS2" }),
  },
  {
    code: "R-1182", name: "Pink Sapphire Halo", category: "RING", shape: "CUSHION", collection: "private-selection",
    photo: "photo-1603561596973-8166e9e089d1", focus: [0.5, 0.5],
    description: "An unheated Ceylon pink sapphire in a diamond halo on a rose-gold band.",
    specs: s({ Metal: "18K Rose Gold", "Centre Stone": "3.08 ct Pink Sapphire", Treatment: "None", Certificate: "SSEF" }),
  },
  {
    code: "MR-2008", name: "Gentleman's Signet", category: "RING", gender: "MALE", collection: "private-selection",
    photo: "photo-1705326455036-0fab8ecba04d", focus: [0.5, 0.5],
    description: "A heavy signet in solid gold with a hand-engraved seal face, made to be personalised.",
    specs: s({ Metal: "18K Yellow Gold", Weight: "21.4 g", Engraving: "Available by appointment" }),
  },
  {
    code: "MR-2014", name: "Twin Band Set", category: "RING", gender: "MALE", shape: "ROUND", collection: "signature-rings",
    photo: "photo-1653972894881-45e6d9610655", focus: [0.5, 0.55],
    description: "Two bands — one polished, one channel-set with diamonds — designed to be worn together.",
    specs: s({ Metal: "Platinum & 18K Gold", "Total Weight": "0.48 ct" }),
  },
  // ——— Earrings
  {
    code: "ER-521", name: "Halo Solitaire Studs", category: "ER", shape: "ROUND", collection: "diamond-collection",
    photo: "photo-1588444650733-d0767b753fc8", focus: [0.5, 0.5], spin: true,
    description: "A matched pair of round brilliants, each in a pavé halo that doubles their presence on the ear.",
    specs: s({ Metal: "18K White Gold", "Total Weight": "2.20 ct", "Colour / Clarity": "F / VS1", Backs: "Screw-back" }),
  },
  {
    code: "ER-534", name: "Brilliant Cluster Studs", category: "ER", shape: "ROUND", collection: "diamond-collection",
    photo: "photo-1735480165343-96034e9528f9", focus: [0.5, 0.45], isNew: true,
    description: "Cluster studs engineered to read as single stones of three carats each.",
    specs: s({ Metal: "18K White Gold", "Total Weight": "3.40 ct", "Colour / Clarity": "G / VS" }),
  },
  {
    code: "ER-547", name: "Sapphire Cascade Earrings", category: "ER", shape: "PEAR", collection: "statement-pieces",
    photo: "photo-1770722272510-ef28c6f57541", focus: [0.5, 0.5],
    description: "Royal blue pear sapphires suspended from diamond cascades that move with every turn of the head.",
    specs: s({ Metal: "18K White Gold", Sapphires: "7.84 ct (Sri Lanka)", Diamonds: "3.10 ct" }),
  },
  {
    code: "ER-552", name: "Aquamarine Drops", category: "ER", shape: "OVAL", collection: "private-selection",
    photo: "photo-1674329042475-de1a95b4ca62", focus: [0.5, 0.5],
    description: "Oval aquamarines beneath diamond-set hoops — cool, luminous and effortless.",
    specs: s({ Metal: "18K Rose Gold", Aquamarines: "6.20 ct", Diamonds: "0.58 ct" }),
  },
  {
    code: "ER-560", name: "Chandelier Earrings", category: "ER", shape: "MARQUISE", collection: "statement-pieces",
    photo: "photo-1665159882377-385d68d2bdff", focus: [0.55, 0.5],
    description: "An architectural chandelier of marquise and round diamonds, articulated in four tiers.",
    specs: s({ Metal: "18K White Gold", "Total Weight": "5.60 ct", Length: "62 mm" }),
  },
  {
    code: "ER-568", name: "South Sea Pearl Drop", category: "ER", shape: "ROUND", collection: "private-selection",
    photo: "photo-1763628212781-7d52844cf358", focus: [0.46, 0.4],
    description: "A 13 mm golden South Sea pearl beneath a sculpted gold cap.",
    specs: s({ Metal: "18K Yellow Gold", Pearls: "13.2 mm Golden South Sea", Lustre: "Excellent" }),
  },
  {
    code: "ER-575", name: "Rosette Gold Studs", category: "ER", shape: "ROUND", collection: "diamond-collection",
    photo: "photo-1626784215021-2e39ccf971cd", focus: [0.5, 0.55],
    description: "Rosettes of yellow gold beading around a white diamond centre — a heritage motif in miniature.",
    specs: s({ Metal: "22K Yellow Gold", Diamonds: "0.90 ct" }),
  },
  // ——— Necklaces
  {
    code: "NK-208", name: "Rivière Diamond Necklace", category: "NK", shape: "MIXED", collection: "timeless-necklaces",
    photo: "photo-1744369382892-eb5b6a2fdc6f", focus: [0.56, 0.33], zoom: 1.7, isNew: true, spin: true,
    description: "A graduated fringe of marquise and pear diamonds that settles like frost at the collarbone.",
    specs: s({ Metal: "18K White Gold", "Total Weight": "18.40 ct", Length: "41 cm", Certificate: "GIA (major stones)" }),
  },
  {
    code: "NK-214", name: "Emerald Rivière Suite", category: "NK", shape: "PEAR", collection: "private-selection",
    photo: "photo-1739194806935-3b4c66aee282", focus: [0.5, 0.35],
    description: "A diamond collar hung with pear emeralds, presented with matching earrings.",
    specs: s({ Metal: "18K White Gold", Emeralds: "14.20 ct (Zambia)", Diamonds: "22.10 ct", Includes: "Pair of earrings" }),
  },
  {
    code: "NK-221", name: "Nocturne Collar", category: "NK", shape: "MIXED", collection: "statement-pieces",
    photo: "photo-1721103418939-5112f0ccfac8", focus: [0.5, 0.5],
    description: "A rose-gold collar threaded with emerald drops — conceived for candlelight.",
    specs: s({ Metal: "18K Rose Gold", Diamonds: "11.60 ct", Emeralds: "4.80 ct" }),
  },
  {
    code: "NK-236", name: "Canary Garland Necklace", category: "NK", shape: "MARQUISE", collection: "timeless-necklaces",
    photo: "photo-1743264385411-57c883bdc0ea", focus: [0.5, 0.62],
    description: "White diamond flowers with a fancy yellow pear at the centre drop.",
    specs: s({ Metal: "18K White & Yellow Gold", "Centre Stone": "3.02 ct Fancy Intense Yellow", Diamonds: "12.80 ct" }),
  },
  {
    code: "NK-240", name: "Pear Drop Lariat", category: "NK", shape: "PEAR", collection: "timeless-necklaces",
    photo: "photo-1721807551235-4072be6913c0", focus: [0.52, 0.45],
    description: "A fine lariat of yellow gold ending in a single pear diamond.",
    specs: s({ Metal: "18K Yellow Gold", Diamonds: "1.40 ct", Length: "Adjustable 38–44 cm" }),
  },
  {
    code: "NK-252", name: "Layered Tennis Chains", category: "NK", shape: "ROUND", collection: "timeless-necklaces",
    photo: "photo-1749125380446-60fd7c5ba4cb", focus: [0.5, 0.5],
    description: "Three strands designed to layer — a tennis line, a bar and a crescent medallion.",
    specs: s({ Metal: "18K Yellow Gold", "Total Weight": "4.30 ct" }),
  },
  // ——— Pendant sets
  {
    code: "PS-310", name: "Pear Halo Pendant", category: "PS", shape: "PEAR", collection: "timeless-necklaces",
    photo: "photo-1724937721228-f7bf3df2a4d8", focus: [0.5, 0.5], video: "20877",
    description: "A pear diamond in a softly-scalloped halo on a fine white-gold chain.",
    specs: s({ Metal: "18K White Gold", "Centre Stone": "1.30 ct Pear", "Colour / Clarity": "F / VS1" }),
  },
  {
    code: "PS-318", name: "Cushion Halo Pendant", category: "PS", shape: "CUSHION", collection: "diamond-collection",
    photo: "photo-1598560917505-59a3ad559071", focus: [0.5, 0.5],
    description: "A cushion diamond framed in a double halo, suspended from a diamond-set bail.",
    specs: s({ Metal: "Platinum 950", "Centre Stone": "2.02 ct Cushion", "Colour / Clarity": "E / VS1" }),
  },
  {
    code: "PS-325", name: "Pearl & Diamond Pendant", category: "PS", shape: "ROUND", collection: "private-selection",
    photo: "photo-1682629846138-7db022565bd5", focus: [0.5, 0.52],
    description: "A white South Sea pearl crowned with a diamond halo.",
    specs: s({ Metal: "18K White Gold", Pearl: "12.5 mm South Sea", Diamonds: "0.74 ct" }),
  },
  {
    code: "PS-331", name: "London Blue Pendant", category: "PS", shape: "EMERALD", collection: "statement-pieces",
    photo: "photo-1599643477877-530eb83abc8e", focus: [0.5, 0.55],
    description: "An octagonal London blue topaz in an openwork diamond frame.",
    specs: s({ Metal: "18K White Gold", "Centre Stone": "11.2 ct London Blue Topaz", Diamonds: "0.66 ct" }),
  },
  // ——— Brooches
  {
    code: "BR-401", name: "Pearl Leaf Brooch", category: "BROCH", shape: "MARQUISE", collection: "statement-pieces",
    photo: "photo-1693212793367-60001caf3b5e", focus: [0.5, 0.5],
    description: "A windswept leaf in pavé diamonds, finished with a single Akoya pearl.",
    specs: s({ Metal: "18K White Gold", Diamonds: "3.20 ct", Pearl: "8 mm Akoya" }),
  },
  {
    code: "BR-408", name: "Papillon Brooch", category: "BROCH", shape: "MARQUISE", collection: "statement-pieces",
    photo: "photo-1693833923492-16fd4c1373bf", focus: [0.5, 0.5], isNew: true,
    description: "A butterfly caught mid-flight, its wings articulated to tremble as it is worn.",
    specs: s({ Metal: "18K White Gold", Diamonds: "4.10 ct", Mechanism: "En tremblant" }),
  },
  {
    code: "BR-415", name: "Pink Tourmaline Heritage Brooch", category: "BROCH", shape: "OVAL", collection: "private-selection",
    photo: "photo-1719862056472-1e4d4c10d50c", focus: [0.5, 0.4],
    description: "A Belle Époque-inspired brooch-pendant with a detachable pear drop.",
    specs: s({ Metal: "Platinum & 18K Gold", "Centre Stone": "6.40 ct Pink Tourmaline", Diamonds: "5.30 ct" }),
  },
  {
    code: "BR-422", name: "Laurel Wreath Pair", category: "BROCH", shape: "MARQUISE", collection: "statement-pieces",
    photo: "photo-1693212793204-bcea856c75fe", focus: [0.5, 0.5],
    description: "Two laurel wreaths in marquise diamonds, worn as a pair or apart.",
    specs: s({ Metal: "18K White Gold", Diamonds: "5.80 ct (pair)" }),
  },
  {
    code: "BR-430", name: "Geometric Bow Brooch", category: "BROCH", shape: "MIXED", collection: "private-selection",
    photo: "photo-1692261605647-55ec75a9e201", focus: [0.5, 0.5],
    description: "An Art Deco bow drawn in fine diamond lines — precise, weightless and graphic.",
    specs: s({ Metal: "Platinum 950", Diamonds: "2.40 ct" }),
  },
  // ——— Bracelets & Kadas
  {
    code: "LB-610", name: "Coil Diamond Bracelet", category: "LB", shape: "ROUND", collection: "statement-pieces",
    photo: "photo-1639065643006-e217c4fee12e", focus: [0.5, 0.5], video: "34611",
    description: "A flexible coil that wraps the wrist twice, set throughout with graduated brilliants.",
    specs: s({ Metal: "18K White Gold", "Total Weight": "9.60 ct", Fit: "Flexible, one size" }),
  },
  {
    code: "LB-618", name: "Classic Tennis Bracelet", category: "LB", shape: "ROUND", collection: "diamond-collection",
    photo: "photo-1619119069152-a2b331eb392a", focus: [0.5, 0.5],
    description: "Fifty-two matched round brilliants in four-claw settings with a hidden box clasp.",
    specs: s({ Metal: "18K White Gold", "Total Weight": "7.02 ct", "Colour / Clarity": "F–G / VS", Length: "17.5 cm" }),
  },
  {
    code: "LB-625", name: "Entwined Diamond Bangle", category: "LB", shape: "ROUND", collection: "diamond-collection",
    photo: "photo-1573408301185-9146fe634ad0", focus: [0.5, 0.45], spin: true,
    description: "Interlaced ovals of pavé, each anchored by a brilliant — our most-requested bangle.",
    specs: s({ Metal: "18K White Gold", "Total Weight": "6.35 ct" }),
  },
  {
    code: "LK-702", name: "Ruby Heritage Kada", category: "LK", shape: "OVAL", collection: "private-selection",
    photo: "photo-1617191880362-aac615de3c26", focus: [0.5, 0.35],
    description: "A pair of 22K kadas set with Burmese rubies in hand-beaded collets.",
    specs: s({ Metal: "22K Yellow Gold", Rubies: "18.6 ct (pair)", Weight: "96 g (pair)" }),
  },
  {
    code: "LK-709", name: "Stacked Leaf Kadas", category: "LK", collection: "statement-pieces",
    photo: "photo-1689367436414-7acc3fdc3e2a", focus: [0.5, 0.5],
    description: "Seven slim kadas engraved with a leaf motif, designed to be stacked in two golds.",
    specs: s({ Metal: "22K Yellow & White Gold", Pieces: "Set of 7" }),
  },
  // ——— Mangalsutra
  {
    code: "MS-805", name: "Solitaire Mangalsutra", category: "MS", shape: "ROUND", collection: "timeless-necklaces",
    photo: "photo-1616294208582-c2a6d73b467b", focus: [0.52, 0.62],
    description: "A contemporary mangalsutra: a single brilliant on a fine chain with traditional black-bead stations.",
    specs: s({ Metal: "18K Yellow Gold", "Centre Stone": "0.50 ct Round Brilliant", Length: "45 cm" }),
  },
];

export const VIDEO_SOURCES: Record<string, { src: string; poster: string }> = Object.fromEntries(
  ["20877", "34611", "5220"].map((id) => [
    id,
    {
      src: `https://assets.mixkit.co/videos/${id}/${id}-720.mp4`,
      poster: `https://assets.mixkit.co/videos/${id}/${id}-thumb-720-0.jpg`,
    },
  ]),
);

export const CLIENTS = [
  {
    key: "A", salutation: "Mr.", firstName: "Arjun", lastName: "Mehta", company: "Mehta Family Office", city: "Mumbai",
    email: "arjun@mehtafo.in", phone: "+91 98200 41120", username: "arjun.mehta", password: "Private#2026",
    collections: ["signature-rings", "private-selection", "diamond-collection"], products: [] as string[],
    advisor: "Kavya Iyer", status: "active" as const, accessEndsInDays: 90,
  },
  {
    key: "B", salutation: "Mrs.", firstName: "Elena", lastName: "Rossi", company: "Rossi & Partners", city: "Milan",
    email: "elena@rossipartners.it", phone: "+39 02 8712 4410", username: "elena.rossi", password: "Private#2026",
    collections: ["timeless-necklaces"], products: [], advisor: "Kavya Iyer", status: "active" as const, accessEndsInDays: 45,
  },
  {
    key: "C", salutation: "Mr.", firstName: "Khalid", lastName: "Al Mansoori", company: "Al Mansoori Holdings", city: "Dubai",
    email: "k.almansoori@amh.ae", phone: "+971 4 330 1188", username: "khalid.am", password: "Private#2026",
    collections: [], products: ["R-1112", "NK-214", "BR-415", "LK-702", "ER-547", "R-1147", "MR-2008", "LB-610"],
    advisor: "Rahul Desai", status: "active" as const, accessEndsInDays: 21,
  },
  {
    key: "D", salutation: "Ms.", firstName: "Sophia", lastName: "Laurent", company: "Maison Laurent", city: "Geneva",
    email: "sophia@maisonlaurent.ch", phone: "+41 22 700 1903", username: "sophia.laurent", password: "Private#2026",
    collections: ["statement-pieces"], products: [], advisor: "Rahul Desai", status: "disabled" as const, accessEndsInDays: 60,
  },
  {
    key: "E", salutation: "Mr.", firstName: "Rohan", lastName: "Kapoor", company: "Kapoor Estates", city: "New Delhi",
    email: "rohan@kapoorestates.in", phone: "+91 98110 22871", username: "rohan.kapoor", password: "Private#2026",
    collections: ["diamond-collection"], products: [], advisor: "Kavya Iyer", status: "active" as const, accessEndsInDays: -12,
  },
  {
    key: "F", salutation: "Mrs.", firstName: "Aanya", lastName: "Shah", company: null, city: "London",
    email: "aanya.shah@me.com", phone: "+44 20 7946 0321", username: "aanya.shah", password: "Private#2026",
    collections: [], products: [], advisor: "Kavya Iyer", status: "active" as const, accessEndsInDays: 120,
  },
];
