# fast-simplex-noise-js

A JavaScript implementation of the improved, faster Simplex algorithm outlined in Stefan Gustavson's [Simplex noise demystified](http://webstaff.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf).

Convenience functions have been added as well, in order to avoid needing to scale and handle the raw noise data directly.

## Example
    // Generate 2D noise in a 1024x768 grid
    var noiseGen = new FastSimplexNoise({ frequency: 0.01, octaves: 8 });
    var grid = new Array(1024);
    for (var x = 0; x < 1024; x++) {
      grid[x] = new Array(768);
      for (var y = 0; y < 768; y++) {
        grid[x][y] = noiseGen.get2DNoise(x, y);
      }
    }

## API

### Constructor

#### FastSimplexNoise([options])
Options is an optional object that can contain:

- **amplitude** (*float*) The base amplitude (default: 1.0)
- **frequency** (*float*) The base frequency (default: 1.0)
- **octaves** (*integer*) The number of octaves to sum for noise generation (default: 1)
- **persistence** (*float*) The persistence of amplitude per octave (default: 0.5)
- **random** (*function*) A function that generates random values between 0 and 1 (default: Math.random)

### Instance Methods

#### .get2DNoise(x, y)
Get a noise value [-1, 1] at the 2D coordinate (*x*,*y*) in summed octaves, using amplitude, frequency, and persistence values.

#### .get3DNoise(x, y, z)
Get a noise value [-1, 1] at the 3D coordinate (*x*,*y*,*z*) in summed octaves, using amplitude, frequency, and persistence values.

#### .get4DNoise(x, y, z, w)
Get a noise value [-1, 1] at the 4D coordinate (*x*,*y*,*z*,*w*) in summed octaves, using amplitude, frequency, and persistence values.

#### .getCylindrical2DNoise(c, x, y)
Get a noise value [-1, 1] for a point (*x*,*y*) on the surface of a cylinder with circumference *c*.

#### .getCylindrical3DNoise(c, x, y, z)
Get a noise value [-1, 1] for a point (*x*, *y*, *z*) on the surface of a cylinder with circumference *c*.

#### .getRaw2DNoise(x, y)
Get a noise value [-1, 1] at the 2D coordinate (*x*,*y*).

#### .getRaw3DNoise(x, y, z)
Get a noise value [-1, 1] at the 3D coordinate (*x*,*y*,*z*).

#### .getRaw4DNoise(x, y, z, w)
Get a noise value [-1, 1] at the 4D coordinate (*x*,*y*,*z*,*w*).

#### .getSpherical2DNoise(c, x, y)
Get a noise value [-1, 1] for a point (*x*, *y*) on the surface of a sphere with circumference *c*.

#### .getSpherical3DNoise(c, x, y, z)
Get a noise value [-1, 1] for a point (*x*, *y*, *z*) on the surface of a sphere with circumference *c*.
