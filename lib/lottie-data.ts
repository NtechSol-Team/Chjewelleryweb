/**
 * Hand-authored Lottie line animations in the house style: a single hairline
 * stroke that draws itself. Generated in code so they stay tiny and on-palette.
 */

type Pt = [number, number];
type Stroke = { points: Pt[]; closed?: boolean; start: number; end: number; tangents?: { i: Pt[]; o: Pt[] } };
type Circle = { d: number; start: number; end: number };

const ease = { i: { x: [0.22], y: [1] }, o: { x: [0.6], y: [0] } };

function trim(start: number, end: number, loop?: number) {
  if (loop) {
    // Draw on, then draw off, repeating.
    return {
      ty: "tm",
      s: { a: 1, k: [{ t: start + (end - start) * 0.9, s: [0], ...ease }, { t: loop, s: [100] }] },
      e: { a: 1, k: [{ t: start, s: [0], ...ease }, { t: end, s: [100] }] },
      o: { a: 0, k: 0 },
      m: 1,
    };
  }
  return { ty: "tm", s: { a: 0, k: 0 }, e: { a: 1, k: [{ t: start, s: [0], ...ease }, { t: end, s: [100] }] }, o: { a: 0, k: 0 }, m: 1 };
}

const transform = { ty: "tr", p: { a: 0, k: [0, 0] }, a: { a: 0, k: [0, 0] }, s: { a: 0, k: [100, 100] }, r: { a: 0, k: 0 }, o: { a: 0, k: 100 } };

function hex(color: string) {
  const n = parseInt(color.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
}

function build(opts: { strokes?: Stroke[]; circles?: Circle[]; color: string; width: number; frames: number; loop?: boolean }) {
  const size = 120;
  const stroke = { ty: "st", c: { a: 0, k: hex(opts.color) }, o: { a: 0, k: 100 }, w: { a: 0, k: opts.width }, lc: 2, lj: 2 };
  const loopAt = opts.loop ? opts.frames : undefined;
  const groups = [
    ...(opts.circles ?? []).map((c) => ({
      ty: "gr",
      it: [{ ty: "el", p: { a: 0, k: [0, 0] }, s: { a: 0, k: [c.d, c.d] } }, stroke, trim(c.start, c.end, loopAt), transform],
    })),
    ...(opts.strokes ?? []).map((s) => ({
      ty: "gr",
      it: [
        {
          ty: "sh",
          ks: {
            a: 0,
            k: {
              c: !!s.closed,
              v: s.points,
              i: s.tangents?.i ?? s.points.map(() => [0, 0]),
              o: s.tangents?.o ?? s.points.map(() => [0, 0]),
            },
          },
        },
        stroke,
        trim(s.start, s.end, loopAt),
        transform,
      ],
    })),
  ];
  return {
    v: "5.7.4",
    fr: 60,
    ip: 0,
    op: opts.frames,
    w: size,
    h: size,
    nm: "ch-line",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "line",
        sr: 1,
        ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [60, 60, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } },
        ao: 0,
        shapes: groups,
        ip: 0,
        op: opts.frames,
        st: 0,
        bm: 0,
      },
    ],
  };
}

const diamondStrokes = (offset = 0, span = 1): Stroke[] => [
  { points: [[-18, -22], [18, -22], [40, -6], [0, 38], [-40, -6]], closed: true, start: offset, end: offset + 60 * span },
  { points: [[-40, -6], [40, -6]], start: offset + 30 * span, end: offset + 70 * span },
  { points: [[-18, -22], [-10, -6], [0, -22], [10, -6], [18, -22]], start: offset + 40 * span, end: offset + 80 * span },
  { points: [[-10, -6], [0, 38], [10, -6]], start: offset + 50 * span, end: offset + 90 * span },
];

export const lottieSuccess = (color = "#c6a15b") =>
  build({
    color,
    width: 1.4,
    frames: 90,
    circles: [{ d: 76, start: 0, end: 45 }],
    strokes: [{ points: [[-14, 1], [-4, 11], [16, -10]], start: 30, end: 62 }],
  });

export const lottieDiamond = (color = "#c6a15b", loop = false) =>
  build({ color, width: 1.1, frames: loop ? 150 : 110, strokes: diamondStrokes(), loop });

export const lottieLock = (color = "#c6a15b") =>
  build({
    color,
    width: 1.3,
    frames: 100,
    strokes: [
      { points: [[-17, -2], [17, -2], [17, 26], [-17, 26]], closed: true, start: 0, end: 50 },
      {
        points: [[-11, -2], [-11, -14], [11, -14], [11, -2]],
        tangents: { i: [[0, 0], [0, 0], [0, -12], [0, 0]], o: [[0, 0], [0, -12], [0, 0], [0, 0]] },
        start: 30,
        end: 70,
      },
      { points: [[0, 8], [0, 15]], start: 60, end: 85 },
    ],
  });
