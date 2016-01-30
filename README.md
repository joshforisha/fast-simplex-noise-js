# fast-simplex-noise-js [![npm version](https://badge.fury.io/js/fast-simplex-noise.svg)](https://www.npmjs.com/package/fast-simplex-noise)

A JavaScript implementation of the improved, faster Simplex algorithm outlined in Stefan Gustavson's [Simplex noise demystified](http://webstaff.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf).

Convenience functions have been added as well, in order to avoid needing to scale and handle the raw noise data directly.

## Install

    npm install fast-simplex-noise

## Example
    const FastSimplexNoise = require('fast-simplex-noise');

    // Generate 2D noise in a 1024x768 grid, scaled to [0, 255]
    const noiseGen = new FastSimplexNoise({
      frequency: 0.01,
      max: 255,
      min: 0,
      octaves: 8
    });
    const grid = new Array(1024);
    for (let x = 0; x < 1024; x++) {
      grid[x] = new Array(768);
      for (let y = 0; y < 768; y++) {
        grid[x][y] = noiseGen.in2D(x, y);
      }
    }

## API

### Constructor

#### FastSimplexNoise([options])
Options is an optional object that can contain:

- **amplitude**: `float` - The base amplitude (default: 1.0)
- **frequency**: `float` - The base frequency (default: 1.0)
- **max**: `float` - The maximum scaled value to return (effective default: 1.0)
- **min**: `float` - The minimum scaled value to return (effective default: -1.0)
- **octaves**: `integer` - The number of octaves to sum for noise generation (default: 1)
- **persistence**: `float` - The persistence of amplitude per octave (default: 0.5)
- **random**: `function` - A function that generates random values between 0 and 1 (default: Math.random)

### Instance Methods

#### cylindrical2D(c, x, y)
Get a noise value between **min** and **max** for a point (*x*,*y*) on the surface of a cylinder with circumference *c*.

#### cylindrical3D(c, x, y, z)
Get a noise value between **min** and **max** for a point (*x*, *y*, *z*) on the surface of a cylinder with circumference *c*.

#### in2D(x, y)
Get a noise value between **min** and **max** at the 2D coordinate (*x*,*y*) in summed octaves, using amplitude, frequency, and persistence values.

#### in3D(x, y, z)
Get a noise value between **min** and **max** at the 3D coordinate (*x*,*y*,*z*) in summed octaves, using amplitude, frequency, and persistence values.

#### in4D(x, y, z, w)
Get a noise value between **min** and **max** at the 4D coordinate (*x*,*y*,*z*,*w*) in summed octaves, using amplitude, frequency, and persistence values.

#### raw2D(x, y)
Get a noise value [-1, 1] at the 2D coordinate (*x*,*y*).

#### raw3D(x, y, z)
Get a noise value [-1, 1] at the 3D coordinate (*x*,*y*,*z*).

#### raw4D(x, y, z, w)
Get a noise value [-1, 1] at the 4D coordinate (*x*,*y*,*z*,*w*).

#### spherical2D(c, x, y)
Get a noise value between **min** and **max** for a point (*x*, *y*) on the surface of a sphere with circumference *c*.

#### spherical3D(c, x, y, z)
Get a noise value between **min** and **max** for a point (*x*, *y*, *z*) on the surface of a sphere with circumference *c*.
