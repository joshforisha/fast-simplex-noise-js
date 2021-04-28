/*
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 */

const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;

const Grad = [
  [1, 1],
  [-1, 1],
  [1, -1],
  [-1, -1],
  [1, 0],
  [-1, 0],
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [0, 1],
  [0, -1],
];

export function makeNoise2D(random = Math.random) {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i++) p[i] = i;

  let n: number;
  let q: number;
  for (let i = 255; i > 0; i--) {
    n = Math.floor((i + 1) * random());
    q = p[i];
    p[i] = p[n];
    p[n] = q;
  }

  const perm = new Uint8Array(512);
  const permMod12 = new Uint8Array(512);
  for (let i = 0; i < 512; i++) {
    perm[i] = p[i & 255];
    permMod12[i] = perm[i] % 12;
  }

  return (x: number, y: number): number => {
    // Skew the input space to determine which simplex cell we're in
    const s = (x + y) * 0.5 * (Math.sqrt(3.0) - 1.0); // Hairy factor for 2D
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const t = (i + j) * G2;
    const X0 = i - t; // Unskew the cell origin back to (x,y) space
    const Y0 = j - t;
    const x0 = x - X0; // The x,y distances from the cell origin
    const y0 = y - Y0;

    // Determine which simplex we are in.
    const i1 = x0 > y0 ? 1 : 0;
    const j1 = x0 > y0 ? 0 : 1;

    // Offsets for corners
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1.0 + 2.0 * G2;
    const y2 = y0 - 1.0 + 2.0 * G2;

    // Work out the hashed gradient indices of the three simplex corners
    const ii = i & 255;
    const jj = j & 255;
    const g0 = Grad[permMod12[ii + perm[jj]]];
    const g1 = Grad[permMod12[ii + i1 + perm[jj + j1]]];
    const g2 = Grad[permMod12[ii + 1 + perm[jj + 1]]];

    // Calculate the contribution from the three corners
    const t0 = 0.5 - x0 * x0 - y0 * y0;
    const n0 = t0 < 0 ? 0.0 : Math.pow(t0, 4) * (g0[0] * x0 + g0[1] * y0);

    const t1 = 0.5 - x1 * x1 - y1 * y1;
    const n1 = t1 < 0 ? 0.0 : Math.pow(t1, 4) * (g1[0] * x1 + g1[1] * y1);

    const t2 = 0.5 - x2 * x2 - y2 * y2;
    const n2 = t2 < 0 ? 0.0 : Math.pow(t2, 4) * (g2[0] * x2 + g2[1] * y2);

    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1, 1]
    return 70.14805770653952 * (n0 + n1 + n2);
  };
}
