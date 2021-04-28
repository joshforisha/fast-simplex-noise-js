/*
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 */

const G3 = 1.0 / 6.0;

const Grad = [
  [1, 1, 0],
  [-1, 1, 0],
  [1, -1, 0],
  [-1, -1, 0],
  [1, 0, 1],
  [-1, 0, 1],
  [1, 0, -1],
  [-1, 0, -1],
  [0, 1, 1],
  [0, -1, -1],
  [0, 1, -1],
  [0, -1, -1],
];

export function makeNoise3D(random = Math.random) {
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

  return (x: number, y: number, z: number): number => {
    // Skew the input space to determine which simplex cell we're in
    const s = (x + y + z) / 3.0; // Very nice and simple skew factor for 3D
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);
    const t = (i + j + k) * G3;
    const X0 = i - t; // Unskew the cell origin back to (x,y,z) space
    const Y0 = j - t;
    const Z0 = k - t;
    const x0 = x - X0; // The x,y,z distances from the cell origin
    const y0 = y - Y0;
    const z0 = z - Z0;

    // Deterine which simplex we are in
    let i1: number, j1: number, k1: number // Offsets for second corner of simplex in (i,j,k) coords
    ;
    let i2: number, j2: number, k2: number // Offsets for third corner of simplex in (i,j,k) coords
    ;
    if (x0 >= y0) {
      if (y0 >= z0) {
        i1 = i2 = j2 = 1;
        j1 = k1 = k2 = 0;
      } else if (x0 >= z0) {
        i1 = i2 = k2 = 1;
        j1 = k1 = j2 = 0;
      } else {
        k1 = i2 = k2 = 1;
        i1 = j1 = j2 = 0;
      }
    } else {
      if (y0 < z0) {
        k1 = j2 = k2 = 1;
        i1 = j1 = i2 = 0;
      } else if (x0 < z0) {
        j1 = j2 = k2 = 1;
        i1 = k1 = i2 = 0;
      } else {
        j1 = i2 = j2 = 1;
        i1 = k1 = k2 = 0;
      }
    }

    const x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2.0 * G3; // Offsets for third corner in (x,y,z) coords
    const y2 = y0 - j2 + 2.0 * G3;
    const z2 = z0 - k2 + 2.0 * G3;
    const x3 = x0 - 1.0 + 3.0 * G3; // Offsets for last corner in (x,y,z) coords
    const y3 = y0 - 1.0 + 3.0 * G3;
    const z3 = z0 - 1.0 + 3.0 * G3;

    // Work out the hashed gradient indices of the four simplex corners
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    const g0 = Grad[permMod12[ii + perm[jj + perm[kk]]]];
    const g1 = Grad[permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]]];
    const g2 = Grad[permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]]];
    const g3 = Grad[permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]]];

    // Calculate the contribution from the four corners
    const t0 = 0.5 - x0 * x0 - y0 * y0 - z0 * z0;
    const n0 = t0 < 0
      ? 0.0
      : Math.pow(t0, 4) * (g0[0] * x0 + g0[1] * y0 + g0[2] * z0);
    const t1 = 0.5 - x1 * x1 - y1 * y1 - z1 * z1;
    const n1 = t1 < 0
      ? 0.0
      : Math.pow(t1, 4) * (g1[0] * x1 + g1[1] * y1 + g1[2] * z1);
    const t2 = 0.5 - x2 * x2 - y2 * y2 - z2 * z2;
    const n2 = t2 < 0
      ? 0.0
      : Math.pow(t2, 4) * (g2[0] * x2 + g2[1] * y2 + g2[2] * z2);
    const t3 = 0.5 - x3 * x3 - y3 * y3 - z3 * z3;
    const n3 = t3 < 0
      ? 0.0
      : Math.pow(t3, 4) * (g3[0] * x3 + g3[1] * y3 + g3[2] * z3);

    // Add contributions from each corner to get the final noise value.
    // The result is scaled to stay just inside [-1,1]
    return 94.68493150681972 * (n0 + n1 + n2 + n3);
  };
}
