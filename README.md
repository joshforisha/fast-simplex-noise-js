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

### FastSimplexNoise(options : Object) : FastSimplexNoise instance
Options can include:

- **amplitude** (*float*) The base amplitude (default: 1.0)
- **frequency** (*float*) The base frequency (default: 1.0)
- **octaves** (*integer*) The number of octaves to sum for noise generation (default: 1)
- **persistence** (*float*) The persistence of amplitude per octave (default: 0.5)
- **random** (*function*) A function that generates random values between 0 and 1 (default: Math.random)

### fastSimplexNoise.get2DNoise(x : Integer, y : Integer) : Float
Get a noise value [-1, 1] at the 2D coordinate (x,y) in layered octaves, using amplitude, frequency, and persistence values.

### fastSimplexNoise.get3DNoise(x : Integer, y : Integer, z : Integer) : Float
Get a noise value [-1, 1] at the 3D coordinate (x,y,z) in layered octaves, using amplitude, frequency, and persistence values.

### fastSimplexNoise.get4DNoise(x : Integer, y : Integer, z : Integer, w : Integer) : Float
Get a noise value [-1, 1] at the 4D coordinate (x,y,z,w) in layered octaves, using amplitude, frequency, and persistence values.

### fastSimplexNoise.getRaw2DNoise(x : Integer, y : Integer) : Float
Get a noise value [-1, 1] at the 2D coordinate (x,y).

### fastSimplexNoise.getRaw3DNoise(x : Integer, y : Integer, z : Integer) : Float
Get a noise value [-1, 1] at the 3D coordinate (x,y,z).

### fastSimplexNoise.getRaw4DNoise(x : Integer, y : Integer, z : Integer, w : Integer) : Float
Get a noise value [-1, 1] at the 4D coordinate (x,y,z,w).

## TODO
- Implement getCylindricalNoise() to handle horizontally-wrapped 2D slice of 3D noise
- Implement getSphericalNoise() to handle 2D slice of 3D noise in sphere shape
