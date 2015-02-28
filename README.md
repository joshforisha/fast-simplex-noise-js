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

### Constructor: FastSimplexNoise(options : Object)
Options can contain:

- **amplitude** (*float*) The base amplitude (default: 1.0)
- **frequency** (*float*) The base frequency (default: 1.0)
- **octaves** (*integer*) The number of octaves to sum for noise generation (default: 1)
- **persistence** (*float*) The persistence of amplitude per octave (default: 0.5)
- **random** (*function*) A function that generates random values between 0 and 1 (default: Math.random)

### get2DNoise(x : Float, y : Float) : Float
Get a noise value [-1, 1] at the 2D coordinate (*x*,*y*) in layered octaves, using amplitude, frequency, and persistence values.

### get3DNoise(x : Float, y : Float, z : Float) : Float
Get a noise value [-1, 1] at the 3D coordinate (*x*,*y*,*z*) in layered octaves, using amplitude, frequency, and persistence values.

### get4DNoise(x : Float, y : Float, z : Float, w : Float) : Float
Get a noise value [-1, 1] at the 4D coordinate (*x*,*y*,*z*,*w*) in layered octaves, using amplitude, frequency, and persistence values.

### getCylindricalNoise(c : Float, x : Float, y : Float) : Float
Get a noise value [-1, 1] for a point (*x*,*y*) on the surface of a cylinder with circumference *c*.

### getCylindricalTimeNoise(c : Float, x : Float, y : Float, t : Float) : Float
Get a noise value [-1, 1] for a point (*x*, *y*, *t*) on the surface of a cylinder with circumference *c*.

### getRaw2DNoise(x : Float, y : Float) : Float
Get a noise value [-1, 1] at the 2D coordinate (*x*,*y*).

### getRaw3DNoise(x : Float, y : Float, z : Float) : Float
Get a noise value [-1, 1] at the 3D coordinate (*x*,*y*,*z*).

### getRaw4DNoise(x : Float, y : Float, z : Float, w : Float) : Float
Get a noise value [-1, 1] at the 4D coordinate (*x*,*y*,*z*,*w*).

### getSphericalNoise(c : Float, x : Float, y : Float) : Float
Get a noise value [-1, 1] for a point (*x*, *y*) on the surface of a sphere with circumference *c*.

### getSphericalTimeNoise(c : Float, x : Float, y : Float, t : Float) : Float
Get a noise value [-1, 1] for a point (*x*, *y*, *t*) on the surface of a sphere with circumference *c*.
