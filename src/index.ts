/*
 * A speed-improved simplex noise algorithm for 2D, 3D and 4D in JavaScript.
 *
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 */

export interface Options {
  amplitude?: number
  frequency?: number
  max?: number
  min?: number
  octaves?: number
  persistence?: number
  random?: () => number
}

export default class FastSimplexNoise {
  readonly amplitude: number
  readonly frequency: number
  readonly octaves: number
  readonly perm: Uint8Array
  readonly permMod12: Uint8Array
  readonly persistence: number
  readonly random: () => number
  readonly scale: (value: number) => number

  static G2 = (3.0 - Math.sqrt(3.0)) / 6.0
  static G3 = 1.0 / 6.0
  static G4 = (5.0 - Math.sqrt(5.0)) / 20.0

  static GRAD3D = [
    [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
    [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
    [0, 1, 1], [0, -1, -1], [0, 1, -1], [0, -1, -1]
  ]

  static GRAD4D = [
    [0, 1, 1, 1], [0, 1, 1, -1], [0, 1, -1, 1], [0, 1, -1, -1],
    [0, -1, 1, 1], [0, -1, 1, -1], [0, -1, -1, 1], [0, -1, -1, -1],
    [1, 0, 1, 1], [1, 0, 1, -1], [1, 0, -1, 1], [1, 0, -1, -1],
    [-1, 0, 1, 1], [-1, 0, 1, -1], [-1, 0, -1, 1], [-1, 0, -1, -1],
    [1, 1, 0, 1], [1, 1, 0, -1], [1, -1, 0, 1], [1, -1, 0, -1],
    [-1, 1, 0, 1], [-1, 1, 0, -1], [-1, -1, 0, 1], [-1, -1, 0, -1],
    [1, 1, 1, 0], [1, 1, -1, 0], [1, -1, 1, 0], [1, -1, -1, 0],
    [-1, 1, 1, 0], [-1, 1, -1, 0], [-1, -1, 1, 0], [-1, -1, -1, 0]
  ]

  constructor (options: Options = {}) {
    if (options.hasOwnProperty('amplitude')) {
      if (typeof options.amplitude !== 'number') throw new Error('options.amplitude must be a number')
      this.amplitude = options.amplitude
    } else this.amplitude = 1.0

    if (options.hasOwnProperty('frequency')) {
      if (typeof options.frequency !== 'number') throw new Error('options.frequency must be a number')
      this.frequency = options.frequency
    } else this.frequency = 1.0

    if (options.hasOwnProperty('octaves')) {
      if (typeof options.octaves !== 'number' ||
        !isFinite(options.octaves) ||
        Math.floor(options.octaves) !== options.octaves
      ) {
        throw new Error('options.octaves must be an integer')
      }
      this.octaves = options.octaves
    } else this.octaves = 1

    if (options.hasOwnProperty('persistence')) {
      if (typeof options.persistence !== 'number') throw new Error('options.persistence must be a number')
      this.persistence = options.persistence
    } else this.persistence = 0.5

    if (options.hasOwnProperty('random')) {
      if (typeof options.random !== 'function') throw new Error('options.random must be a function')
      this.random = options.random
    } else this.random = Math.random

    let min: number
    if (options.hasOwnProperty('min')) {
      if (typeof options.min !== 'number') throw new Error('options.min must be a number')
      min = options.min
    } else min = -1

    let max: number
    if (options.hasOwnProperty('max')) {
      if (typeof options.max !== 'number') throw new Error('options.max must be a number')
      max = options.max
    } else max = 1

    if (min >= max) throw new Error(`options.min (${min}) must be less than options.max (${max})`)

    this.scale = min === -1 && max === 1
      ? value => value
      : value => min + ((value + 1) / 2) * (max - min)

    const p = new Uint8Array(256)
    for (let i = 0; i < 256; i++) p[i] = i

    let n: number
    let q: number
    for (let i = 255; i > 0; i--) {
      n = Math.floor((i + 1) * this.random())
      q = p[i]
      p[i] = p[n]
      p[n] = q
    }

    this.perm = new Uint8Array(512)
    this.permMod12 = new Uint8Array(512)
    for (let i = 0; i < 512; i++) {
      this.perm[i] = p[i & 255]
      this.permMod12[i] = this.perm[i] % 12
    }
  }

  cylindrical (circumference: number, coords: number[]): number {
    switch (coords.length) {
      case 2: return this.cylindrical2D(circumference, coords[0], coords[1])
      case 3: return this.cylindrical3D(circumference, coords[0], coords[1], coords[2])
      default: return null
    }
  }

  cylindrical2D (circumference: number, x: number, y: number): number {
    const nx = x / circumference
    const r = circumference / (2 * Math.PI)
    const rdx = nx * 2 * Math.PI
    const a = r * Math.sin(rdx)
    const b = r * Math.cos(rdx)

    return this.scaled3D(a, b, y)
  }

  cylindrical3D (circumference: number, x: number, y: number, z: number) {
    const nx = x / circumference
    const r = circumference / (2 * Math.PI)
    const rdx = nx * 2 * Math.PI
    const a = r * Math.sin(rdx)
    const b = r * Math.cos(rdx)

    return this.scaled4D(a, b, y, z)
  }

  dot (gs: number[], coords: number[]): number {
    return gs
      .slice(0, Math.min(gs.length, coords.length))
      .reduce((total, g, i) => total + (g * coords[i]), 0)
  }

  raw (coords: number[]): number {
    switch (coords.length) {
      case 2: return this.raw2D(coords[0], coords[1])
      case 3: return this.raw3D(coords[0], coords[1], coords[2])
      case 4: return this.raw4D(coords[0], coords[1], coords[2], coords[3])
      default: return null
    }
  }

  raw2D (x: number, y: number): number {
    // Skew the input space to determine which simplex cell we're in
    const s = (x + y) * 0.5 * (Math.sqrt(3.0) - 1.0) // Hairy factor for 2D
    const i = Math.floor(x + s)
    const j = Math.floor(y + s)
    const t = (i + j) * FastSimplexNoise.G2
    const X0 = i - t // Unskew the cell origin back to (x,y) space
    const Y0 = j - t
    const x0 = x - X0 // The x,y distances from the cell origin
    const y0 = y - Y0

    // Determine which simplex we are in.
    const i1 = x0 > y0 ? 1 : 0
    const j1 = x0 > y0 ? 0 : 1

    // Offsets for corners
    const x1 = x0 - i1 + FastSimplexNoise.G2
    const y1 = y0 - j1 + FastSimplexNoise.G2
    const x2 = x0 - 1.0 + 2.0 * FastSimplexNoise.G2
    const y2 = y0 - 1.0 + 2.0 * FastSimplexNoise.G2

    // Work out the hashed gradient indices of the three simplex corners
    const ii = i & 255
    const jj = j & 255
    const gi0 = this.permMod12[ii + this.perm[jj]]
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]]
    const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]]

    // Calculate the contribution from the three corners
    const t0 = 0.5 - x0 * x0 - y0 * y0
    const n0 = t0 < 0 ? 0.0 : Math.pow(t0, 4) * this.dot(FastSimplexNoise.GRAD3D[gi0], [x0, y0])
    const t1 = 0.5 - x1 * x1 - y1 * y1
    const n1 = t1 < 0 ? 0.0 : Math.pow(t1, 4) * this.dot(FastSimplexNoise.GRAD3D[gi1], [x1, y1])
    const t2 = 0.5 - x2 * x2 - y2 * y2
    const n2 = t2 < 0 ? 0.0 : Math.pow(t2, 4) * this.dot(FastSimplexNoise.GRAD3D[gi2], [x2, y2])

    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1, 1]
    return 70.14805770653952 * (n0 + n1 + n2)
  }

  raw3D (x: number, y: number, z: number): number {
    // Skew the input space to determine which simplex cell we're in
    const s = (x + y + z) / 3.0 // Very nice and simple skew factor for 3D
    const i = Math.floor(x + s)
    const j = Math.floor(y + s)
    const k = Math.floor(z + s)
    const t = (i + j + k) * FastSimplexNoise.G3
    const X0 = i - t // Unskew the cell origin back to (x,y,z) space
    const Y0 = j - t
    const Z0 = k - t
    const x0 = x - X0 // The x,y,z distances from the cell origin
    const y0 = y - Y0
    const z0 = z - Z0

    // Deterine which simplex we are in
    let i1: number, j1: number, k1: number // Offsets for second corner of simplex in (i,j,k) coords
    let i2: number, j2: number, k2: number // Offsets for third corner of simplex in (i,j,k) coords
    if (x0 >= y0) {
      if (y0 >= z0) {
        i1 = i2 = j2 = 1
        j1 = k1 = k2 = 0
      } else if (x0 >= z0) {
        i1 = i2 = k2 = 1
        j1 = k1 = j2 = 0
      } else {
        k1 = i2 = k2 = 1
        i1 = j1 = j2 = 0
      }
    } else {
      if (y0 < z0) {
        k1 = j2 = k2 = 1
        i1 = j1 = i2 = 0
      } else if (x0 < z0) {
        j1 = j2 = k2 = 1
        i1 = k1 = i2 = 0
      } else {
        j1 = i2 = j2 = 1
        i1 = k1 = k2 = 0
      }
    }

    const x1 = x0 - i1 + FastSimplexNoise.G3 // Offsets for second corner in (x,y,z) coords
    const y1 = y0 - j1 + FastSimplexNoise.G3
    const z1 = z0 - k1 + FastSimplexNoise.G3
    const x2 = x0 - i2 + 2.0 * FastSimplexNoise.G3 // Offsets for third corner in (x,y,z) coords
    const y2 = y0 - j2 + 2.0 * FastSimplexNoise.G3
    const z2 = z0 - k2 + 2.0 * FastSimplexNoise.G3
    const x3 = x0 - 1.0 + 3.0 * FastSimplexNoise.G3 // Offsets for last corner in (x,y,z) coords
    const y3 = y0 - 1.0 + 3.0 * FastSimplexNoise.G3
    const z3 = z0 - 1.0 + 3.0 * FastSimplexNoise.G3

    // Work out the hashed gradient indices of the four simplex corners
    const ii = i & 255
    const jj = j & 255
    const kk = k & 255
    const gi0 = this.permMod12[ii + this.perm[jj + this.perm[kk]]]
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1]]]
    const gi2 = this.permMod12[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2]]]
    const gi3 = this.permMod12[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1]]]

    // Calculate the contribution from the four corners
    const t0 = 0.5 - x0 * x0 - y0 * y0 - z0 * z0
    const n0 = t0 < 0 ? 0.0 : Math.pow(t0, 4) * this.dot(FastSimplexNoise.GRAD3D[gi0], [x0, y0, z0])
    const t1 = 0.5 - x1 * x1 - y1 * y1 - z1 * z1
    const n1 = t1 < 0 ? 0.0 : Math.pow(t1, 4) * this.dot(FastSimplexNoise.GRAD3D[gi1], [x1, y1, z1])
    const t2 = 0.5 - x2 * x2 - y2 * y2 - z2 * z2
    const n2 = t2 < 0 ? 0.0 : Math.pow(t2, 4) * this.dot(FastSimplexNoise.GRAD3D[gi2], [x2, y2, z2])
    const t3 = 0.5 - x3 * x3 - y3 * y3 - z3 * z3
    const n3 = t3 < 0 ? 0.0 : Math.pow(t3, 4) * this.dot(FastSimplexNoise.GRAD3D[gi3], [x3, y3, z3])

    // Add contributions from each corner to get the final noise value.
    // The result is scaled to stay just inside [-1,1]
    return 94.68493150681972 * (n0 + n1 + n2 + n3)
  }

  raw4D (x: number, y: number, z: number, w: number): number {
    // Skew the (x,y,z,w) space to determine which cell of 24 simplices we're in
    const s = (x + y + z + w) * (Math.sqrt(5.0) - 1.0) / 4.0 // Factor for 4D skewing
    const i = Math.floor(x + s)
    const j = Math.floor(y + s)
    const k = Math.floor(z + s)
    const l = Math.floor(w + s)
    const t = (i + j + k + l) * FastSimplexNoise.G4 // Factor for 4D unskewing
    const X0 = i - t // Unskew the cell origin back to (x,y,z,w) space
    const Y0 = j - t
    const Z0 = k - t
    const W0 = l - t
    const x0 = x - X0  // The x,y,z,w distances from the cell origin
    const y0 = y - Y0
    const z0 = z - Z0
    const w0 = w - W0

    // To find out which of the 24 possible simplices we're in, we need to determine the magnitude ordering of x0, y0,
    // z0 and w0. Six pair-wise comparisons are performed between each possible pair of the four coordinates, and the
    // results are used to rank the numbers.
    let rankx = 0
    let ranky = 0
    let rankz = 0
    let rankw = 0
    if (x0 > y0) rankx++
    else ranky++
    if (x0 > z0) rankx++
    else rankz++
    if (x0 > w0) rankx++
    else rankw++
    if (y0 > z0) ranky++
    else rankz++
    if (y0 > w0) ranky++
    else rankw++
    if (z0 > w0) rankz++
    else rankw++

    // simplex[c] is a 4-vector with the numbers 0, 1, 2 and 3 in some order.
    // Many values of c will never occur, since e.g. x>y>z>w makes x<z, y<w and x<w
    // impossible. Only the 24 indices which have non-zero entries make any sense.
    // We use a thresholding to set the coordinates in turn from the largest magnitude.
    // Rank 3 denotes the largest coordinate.
    const i1 = rankx >= 3 ? 1 : 0
    const j1 = ranky >= 3 ? 1 : 0
    const k1 = rankz >= 3 ? 1 : 0
    const l1 = rankw >= 3 ? 1 : 0
    // Rank 2 denotes the second largest coordinate.
    const i2 = rankx >= 2 ? 1 : 0
    const j2 = ranky >= 2 ? 1 : 0
    const k2 = rankz >= 2 ? 1 : 0
    const l2 = rankw >= 2 ? 1 : 0
    // Rank 1 denotes the second smallest coordinate.
    const i3 = rankx >= 1 ? 1 : 0
    const j3 = ranky >= 1 ? 1 : 0
    const k3 = rankz >= 1 ? 1 : 0
    const l3 = rankw >= 1 ? 1 : 0

    // The fifth corner has all coordinate offsets = 1, so no need to compute that.
    const x1 = x0 - i1 + FastSimplexNoise.G4 // Offsets for second corner in (x,y,z,w) coords
    const y1 = y0 - j1 + FastSimplexNoise.G4
    const z1 = z0 - k1 + FastSimplexNoise.G4
    const w1 = w0 - l1 + FastSimplexNoise.G4
    const x2 = x0 - i2 + 2.0 * FastSimplexNoise.G4 // Offsets for third corner in (x,y,z,w) coords
    const y2 = y0 - j2 + 2.0 * FastSimplexNoise.G4
    const z2 = z0 - k2 + 2.0 * FastSimplexNoise.G4
    const w2 = w0 - l2 + 2.0 * FastSimplexNoise.G4
    const x3 = x0 - i3 + 3.0 * FastSimplexNoise.G4 // Offsets for fourth corner in (x,y,z,w) coords
    const y3 = y0 - j3 + 3.0 * FastSimplexNoise.G4
    const z3 = z0 - k3 + 3.0 * FastSimplexNoise.G4
    const w3 = w0 - l3 + 3.0 * FastSimplexNoise.G4
    const x4 = x0 - 1.0 + 4.0 * FastSimplexNoise.G4 // Offsets for last corner in (x,y,z,w) coords
    const y4 = y0 - 1.0 + 4.0 * FastSimplexNoise.G4
    const z4 = z0 - 1.0 + 4.0 * FastSimplexNoise.G4
    const w4 = w0 - 1.0 + 4.0 * FastSimplexNoise.G4

    // Work out the hashed gradient indices of the five simplex corners
    const ii = i & 255
    const jj = j & 255
    const kk = k & 255
    const ll = l & 255
    const gi0 = this.perm[ii + this.perm[jj + this.perm[kk + this.perm[ll]]]] % 32
    const gi1 = this.perm[ii + i1 + this.perm[jj + j1 + this.perm[kk + k1 + this.perm[ll + l1]]]] % 32
    const gi2 = this.perm[ii + i2 + this.perm[jj + j2 + this.perm[kk + k2 + this.perm[ll + l2]]]] % 32
    const gi3 = this.perm[ii + i3 + this.perm[jj + j3 + this.perm[kk + k3 + this.perm[ll + l3]]]] % 32
    const gi4 = this.perm[ii + 1 + this.perm[jj + 1 + this.perm[kk + 1 + this.perm[ll + 1]]]] % 32

    // Calculate the contribution from the five corners
    const t0 = 0.5 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0
    const n0 = t0 < 0 ? 0.0 : Math.pow(t0, 4) * this.dot(FastSimplexNoise.GRAD4D[gi0], [x0, y0, z0, w0])
    const t1 = 0.5 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1
    const n1 = t1 < 0 ? 0.0 : Math.pow(t1, 4) * this.dot(FastSimplexNoise.GRAD4D[gi1], [x1, y1, z1, w1])
    const t2 = 0.5 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2
    const n2 = t2 < 0 ? 0.0 : Math.pow(t2, 4) * this.dot(FastSimplexNoise.GRAD4D[gi2], [x2, y2, z2, w2])
    const t3 = 0.5 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3
    const n3 = t3 < 0 ? 0.0 : Math.pow(t3, 4) * this.dot(FastSimplexNoise.GRAD4D[gi3], [x3, y3, z3, w3])
    const t4 = 0.5 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4
    const n4 = t4 < 0 ? 0.0 : Math.pow(t4, 4) * this.dot(FastSimplexNoise.GRAD4D[gi4], [x4, y4, z4, w4])

    // Sum up and scale the result to cover the range [-1,1]
    return 72.37855765153665 * (n0 + n1 + n2 + n3 + n4)
  }

  scaled (coords: number[]): number {
    switch (coords.length) {
      case 2: return this.scaled2D(coords[0], coords[1])
      case 3: return this.scaled3D(coords[0], coords[1], coords[2])
      case 4: return this.scaled4D(coords[0], coords[1], coords[2], coords[3])
      default: return null
    }
  }

  scaled2D (x: number, y: number): number {
    let amplitude = this.amplitude
    let frequency = this.frequency
    let maxAmplitude = 0
    let noise = 0

    for (let i = 0; i < this.octaves; i++) {
      noise += this.raw2D(x * frequency, y * frequency) * amplitude
      maxAmplitude += amplitude
      amplitude *= this.persistence
      frequency *= 2
    }

    return this.scale(noise / maxAmplitude)
  }

  scaled3D (x: number, y: number, z: number): number {
    let amplitude = this.amplitude
    let frequency = this.frequency
    let maxAmplitude = 0
    let noise = 0

    for (let i = 0; i < this.octaves; i++) {
      noise += this.raw3D(x * frequency, y * frequency, z * frequency) * amplitude
      maxAmplitude += amplitude
      amplitude *= this.persistence
      frequency *= 2
    }

    return this.scale(noise / maxAmplitude)
  }

  scaled4D (x: number, y: number, z: number, w: number): number {
    let amplitude = this.amplitude
    let frequency = this.frequency
    let maxAmplitude = 0
    let noise = 0

    for (let i = 0; i < this.octaves; i++) {
      noise += this.raw4D(x * frequency, y * frequency, z * frequency, w * frequency) * amplitude
      maxAmplitude += amplitude
      amplitude *= this.persistence
      frequency *= 2
    }

    return this.scale(noise / maxAmplitude)
  }

  spherical (circumference: number, coords: number[]): number {
    switch (coords.length) {
      case 3: return this.spherical3D(circumference, coords[0], coords[1], coords[2])
      case 2: return this.spherical2D(circumference, coords[0], coords[1])
      default: return null
    }
  }

  spherical2D (circumference: number, x: number, y: number): number {
    const nx = x / circumference
    const ny = y / circumference
    const rdx = nx * 2 * Math.PI
    const rdy = ny * Math.PI
    const sinY = Math.sin(rdy + Math.PI)
    const sinRds = 2 * Math.PI
    const a = sinRds * Math.sin(rdx) * sinY
    const b = sinRds * Math.cos(rdx) * sinY
    const d = sinRds * Math.cos(rdy)

    return this.scaled3D(a, b, d)
  }

  spherical3D (circumference: number, x: number, y: number, z: number): number {
    const nx = x / circumference
    const ny = y / circumference
    const rdx = nx * 2 * Math.PI
    const rdy = ny * Math.PI
    const sinY = Math.sin(rdy + Math.PI)
    const sinRds = 2 * Math.PI
    const a = sinRds * Math.sin(rdx) * sinY
    const b = sinRds * Math.cos(rdx) * sinY
    const d = sinRds * Math.cos(rdy)

    return this.scaled4D(a, b, d, z)
  }
}
