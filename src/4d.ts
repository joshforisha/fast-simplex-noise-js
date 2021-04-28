/*
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 */

const G4 = (5.0 - Math.sqrt(5.0)) / 20.0;

const Grad = [
  [0, 1, 1, 1],
  [0, 1, 1, -1],
  [0, 1, -1, 1],
  [0, 1, -1, -1],
  [0, -1, 1, 1],
  [0, -1, 1, -1],
  [0, -1, -1, 1],
  [0, -1, -1, -1],
  [1, 0, 1, 1],
  [1, 0, 1, -1],
  [1, 0, -1, 1],
  [1, 0, -1, -1],
  [-1, 0, 1, 1],
  [-1, 0, 1, -1],
  [-1, 0, -1, 1],
  [-1, 0, -1, -1],
  [1, 1, 0, 1],
  [1, 1, 0, -1],
  [1, -1, 0, 1],
  [1, -1, 0, -1],
  [-1, 1, 0, 1],
  [-1, 1, 0, -1],
  [-1, -1, 0, 1],
  [-1, -1, 0, -1],
  [1, 1, 1, 0],
  [1, 1, -1, 0],
  [1, -1, 1, 0],
  [1, -1, -1, 0],
  [-1, 1, 1, 0],
  [-1, 1, -1, 0],
  [-1, -1, 1, 0],
  [-1, -1, -1, 0],
];

export function makeNoise4D(random = Math.random) {
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

  return (x: number, y: number, z: number, w: number): number => {
    // Skew the (x,y,z,w) space to determine which cell of 24 simplices we're in
    const s = (x + y + z + w) * (Math.sqrt(5.0) - 1.0) / 4.0; // Factor for 4D skewing
    const i = Math.floor(x + s);
    const j = Math.floor(y + s);
    const k = Math.floor(z + s);
    const l = Math.floor(w + s);
    const t = (i + j + k + l) * G4; // Factor for 4D unskewing
    const X0 = i - t; // Unskew the cell origin back to (x,y,z,w) space
    const Y0 = j - t;
    const Z0 = k - t;
    const W0 = l - t;
    const x0 = x - X0; // The x,y,z,w distances from the cell origin
    const y0 = y - Y0;
    const z0 = z - Z0;
    const w0 = w - W0;

    // To find out which of the 24 possible simplices we're in, we need to determine the
    // magnitude ordering of x0, y0, z0 and w0. Six pair-wise comparisons are performed between
    // each possible pair of the four coordinates, and the results are used to rank the numbers.
    let rankx = 0;
    let ranky = 0;
    let rankz = 0;
    let rankw = 0;
    if (x0 > y0) rankx++;
    else ranky++;
    if (x0 > z0) rankx++;
    else rankz++;
    if (x0 > w0) rankx++;
    else rankw++;
    if (y0 > z0) ranky++;
    else rankz++;
    if (y0 > w0) ranky++;
    else rankw++;
    if (z0 > w0) rankz++;
    else rankw++;

    // simplex[c] is a 4-vector with the numbers 0, 1, 2 and 3 in some order.
    // Many values of c will never occur, since e.g. x>y>z>w makes x<z, y<w and x<w
    // impossible. Only the 24 indices which have non-zero entries make any sense.
    // We use a thresholding to set the coordinates in turn from the largest magnitude.
    // Rank 3 denotes the largest coordinate.
    const i1 = rankx >= 3 ? 1 : 0;
    const j1 = ranky >= 3 ? 1 : 0;
    const k1 = rankz >= 3 ? 1 : 0;
    const l1 = rankw >= 3 ? 1 : 0;
    // Rank 2 denotes the second largest coordinate.
    const i2 = rankx >= 2 ? 1 : 0;
    const j2 = ranky >= 2 ? 1 : 0;
    const k2 = rankz >= 2 ? 1 : 0;
    const l2 = rankw >= 2 ? 1 : 0;
    // Rank 1 denotes the second smallest coordinate.
    const i3 = rankx >= 1 ? 1 : 0;
    const j3 = ranky >= 1 ? 1 : 0;
    const k3 = rankz >= 1 ? 1 : 0;
    const l3 = rankw >= 1 ? 1 : 0;

    // The fifth corner has all coordinate offsets = 1, so no need to compute that.
    const x1 = x0 - i1 + G4; // Offsets for second corner in (x,y,z,w) coords
    const y1 = y0 - j1 + G4;
    const z1 = z0 - k1 + G4;
    const w1 = w0 - l1 + G4;
    const x2 = x0 - i2 + 2.0 * G4; // Offsets for third corner in (x,y,z,w) coords
    const y2 = y0 - j2 + 2.0 * G4;
    const z2 = z0 - k2 + 2.0 * G4;
    const w2 = w0 - l2 + 2.0 * G4;
    const x3 = x0 - i3 + 3.0 * G4; // Offsets for fourth corner in (x,y,z,w) coords
    const y3 = y0 - j3 + 3.0 * G4;
    const z3 = z0 - k3 + 3.0 * G4;
    const w3 = w0 - l3 + 3.0 * G4;
    const x4 = x0 - 1.0 + 4.0 * G4; // Offsets for last corner in (x,y,z,w) coords
    const y4 = y0 - 1.0 + 4.0 * G4;
    const z4 = z0 - 1.0 + 4.0 * G4;
    const w4 = w0 - 1.0 + 4.0 * G4;

    // Work out the hashed gradient indices of the five simplex corners
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    const ll = l & 255;
    const g0 = Grad[
      perm[ii + perm[jj + perm[kk + perm[ll]]]] %
      32
    ];
    const g1 = Grad[
      perm[
        ii + i1 + perm[jj + j1 + perm[kk + k1 + perm[ll + l1]]]
      ] % 32
    ];
    const g2 = Grad[
      perm[
        ii + i2 + perm[jj + j2 + perm[kk + k2 + perm[ll + l2]]]
      ] % 32
    ];
    const g3 = Grad[
      perm[
        ii + i3 + perm[jj + j3 + perm[kk + k3 + perm[ll + l3]]]
      ] % 32
    ];
    const g4 = Grad[
      perm[
        ii + 1 + perm[jj + 1 + perm[kk + 1 + perm[ll + 1]]]
      ] % 32
    ];

    // Calculate the contribution from the five corners
    const t0 = 0.5 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0;
    const n0 = t0 < 0
      ? 0.0
      : Math.pow(t0, 4) * (g0[0] * x0 + g0[1] * y0 + g0[2] * z0 + g0[3] * w0);
    const t1 = 0.5 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1;
    const n1 = t1 < 0
      ? 0.0
      : Math.pow(t1, 4) * (g1[0] * x1 + g1[1] * y1 + g1[2] * z1 + g1[3] * w1);
    const t2 = 0.5 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2;
    const n2 = t2 < 0
      ? 0.0
      : Math.pow(t2, 4) * (g2[0] * x2 + g2[1] * y2 + g2[2] * z2 + g2[3] * w2);
    const t3 = 0.5 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3;
    const n3 = t3 < 0
      ? 0.0
      : Math.pow(t3, 4) * (g3[0] * x3 + g3[1] * y3 + g3[2] * z3 + g3[3] * w3);
    const t4 = 0.5 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4;
    const n4 = t4 < 0
      ? 0.0
      : Math.pow(t4, 4) * (g4[0] * x4 + g4[1] * y4 + g4[2] * z4 + g4[3] * w4);

    // Sum up and scale the result to cover the range [-1,1]
    return 72.37855765153665 * (n0 + n1 + n2 + n3 + n4);
  };
}
