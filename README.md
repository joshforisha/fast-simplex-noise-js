# Fast Simplex Noise

A TypeScript implementation of the improved, faster Simplex algorithm outlined in Stefan Gustavson's [Simplex noise demystified](http://webstaff.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf).

* Deno module: [https://deno.land/x/fast_simplex_noise](https://deno.land/x/fast_simplex_noise)
* NPM package: [fast-simplex-noise](https://www.npmjs.com/package/fast-simplex-noise)

See [fractal-noise-js](https://github.com/joshforisha/fractal-noise-js) (Deno: [fractal_noise](https://deno.land/x/fractal_noise), NPM: [fractal-noise](https://www.npmjs.com/package/fractal-noise)) for higher order noise shapes.

## API

Each *make* function takes a `random` function (`() => number)`) as its argument, defaulting to `Math.random`.

### `makeNoise2D (random = Math.random): (x: number, y: number) => number`

Returns a two-dimensional noise generation function.

### `makeNoise3D (random = Math.random): (x: number, y: number, z: number) => number`

Returns a three-dimensional noise generation function.

### `makeNoise4D (random = Math.random): (x: number, y: number, z: number, w: number) => number`

Returns a four-dimensional noise generation function.
