class Planet {
  constructor(x, y, size) {
    // top left corner position of the planet
    this._x = x;
    this._y = y;
    // size of the planet
    this._size = size;

    // planet radius - small adjustment for canvas texture
    this._r = (this._size / 2) * 0.95;
    // init noise
    this._simplex = new SimplexNoise();
    // simplex noise scale
    this._cloud_noise_scl = random(0.015, 0.005);
    this._land_noise_scl = random(0.01, 0.0025);

    // moons!
    this._moons_number = random_int(1, 5);
    this._moons = [];
    this._generateMoons();
    // texturize
    this._pattern = null;
    this._generatePattern();
  }

  update(percent) {
    this._moons.forEach((m) => m.update(percent));
  }

  show(ctx) {
    ctx.save();
    ctx.translate(this._x, this._y);

    ctx.save();
    // draw the planet texture
    ctx.fillStyle = this._pattern;
    ctx.fillRect(0, 0, this._size, this._size);
    ctx.restore();

    // draw the moons
    this._moons.forEach((m) => {
      ctx.save();
      // moon drawing position is relative to the center of the planet
      ctx.translate(this._size / 2, this._size / 2);
      // make angled orbits
      ctx.rotate(m.theta);
      m.show(ctx);
      ctx.restore();
    });

    ctx.restore();
  }

  // return position of the center of the planet
  get center_pos() {
    return { x: this._x + this._size / 2, y: this._y + this._size / 2 };
  }

  // return radius of the planet
  // it's not the real radius but the "apparent" one
  get r() {
    return this._size / 2;
  }

  // generate some moons for this planet
  _generateMoons() {
    for (let i = 0; i < this._moons_number; i++) {
      // moon rgb channels color
      const moon_rgb = random(80, 200);
      this._moons.push(new Moon(this._size, moon_rgb));
    }
  }

  // generate pattern via canvas creation
  _generatePattern() {
    // create elements
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    // set canvas size
    canvas.width = this._size;
    canvas.height = this._size;
    // pick colour for sea
    const sea_hue = random(190, 255);
    const sea_sat = random(80, 100);
    const sea_val = random(40, 50);
    // draw a circle
    ctx.fillStyle = `hsl(${sea_hue}, ${sea_sat}%, ${sea_val}%)`;
    ctx.beginPath();
    ctx.arc(this._size / 2, this._size / 2, this._r, 0, Math.PI * 2);
    ctx.fill();

    // particles (cloud and land)
    const particles_scl = 1;
    const cloud_threshold = random(0.25, 1);
    const land_threshold = random(-0.75, 1);
    const land_hue = random_int(180);

    for (let x = 0; x < this._size; x += particles_scl) {
      for (let y = 0; y < this._size; y += particles_scl) {
        if (this._inside(x, y)) {
          this._generateLand(
            x,
            y,
            particles_scl,
            land_threshold,
            land_hue,
            ctx
          );
          this._generateClouds(x, y, particles_scl, cloud_threshold, ctx);
        }
      }
    }

    // add a circle outside the planet to cover small pixel alignment issues
    ctx.strokeWidth = 4;
    ctx.strokeStyle = "rgb(255, 255, 255, 0.5)";
    ctx.beginPath();
    ctx.arc(this._size / 2, this._size / 2, this._r, 0, Math.PI * 2);
    ctx.stroke();

    // export pattern
    this._pattern = ctx.createPattern(canvas, "no-repeat");
  }

  // check if a point is inside the planet
  _inside(x, y) {
    const xx = x - this._size / 2;
    const yy = y - this._size / 2;
    return xx * xx + yy * yy < this._r * this._r;
  }

  _generateLand(x, y, scl, threshold, land_hue, ctx) {
    // land noise parameters
    const land_octaves = 4;
    const land_persistence = 0.5;
    const land_lacunarity = 2;

    const land = this._generateNoise(
      x * this._land_noise_scl,
      y * this._land_noise_scl,
      land_octaves,
      land_persistence,
      land_lacunarity
    );

    if (land < threshold) return;

    ctx.fillStyle = `hsl(${land_hue}, 100%, 45%)`;
    ctx.fillRect(x, y, scl, scl);
  }

  _generateClouds(x, y, scl, threshold, ctx) {
    // clouds noise parameters
    const cloud_octaves = 4;
    const cloud_persistence = 0.6;
    const cloud_lacunarity = 2.5;

    const cloud = this._generateNoise(
      x * this._cloud_noise_scl,
      y * this._cloud_noise_scl,
      cloud_octaves,
      cloud_persistence,
      cloud_lacunarity
    );

    if (cloud < threshold) return;

    const cloud_fill = cloud * 25 + 230;
    ctx.fillStyle = `rgba(${cloud_fill}, ${cloud_fill}, ${cloud_fill}, 0.9)`;
    ctx.fillRect(x, y, scl, scl);
  }

  _generateNoise(x, y, octaves = 5, persistence = 0.5, lacunarity = 2) {
    let amplitude = 1;
    let frequency = 1;
    let n = 0;
    for (let i = 0; i < octaves; i++) {
      n += amplitude * this._simplex.noise2D(x * frequency, y * frequency);
      amplitude *= persistence;
      frequency *= lacunarity;
    }
    return n;
  }
}

class Moon {
  constructor(size, color) {
    this._size = size;
    this._color = color;

    // ratio between planet and moon size
    const scl_factor = random(8, 20);
    this._r = size / scl_factor;
    // some approximation for the orbit size
    this._orbit_size = size + 2 * this._r;
    // when should the planet start appearing or disappearing?
    this._disappearing_edge = random(0.05, 0.1);

    this._theta = Math.random() * Math.PI * 2;

    this._start_x = Math.random();
    this._x = 0;
    this._hidden = true;
    // number of orbits in the total animation duration
    this._orbits = random_int(1, 3);

    // texturize
    this._pattern = null;
    this._generatePattern();
  }

  update(percent) {
    // calculate actual orbit position
    const orbit_pos = ((this._start_x + percent) * this._orbits) % 1;

    // check if the moon is behind the planet
    this._hidden = orbit_pos > 0.5;
    if (this._hidden) return;

    // actual percent
    const real_percent = (orbit_pos * 2) % 1;
    // x position along the orbit (will then be rotated)
    this._x = real_percent * this._orbit_size - this._orbit_size / 2;

    // calculation to shrink/enlarge the moon when close to the planet's border
    if (real_percent < this._disappearing_edge) {
      const x = real_percent / this._disappearing_edge; // [0, 0.05] -> [0, 1]
      this._current_size = this._easeIn(x);
    } else if (real_percent > 1 - this._disappearing_edge) {
      const x = (1 - real_percent) / this._disappearing_edge; // [0.95, 1] -> [0, 1]
      this._current_size = this._easeOut(x);
    } else this._current_size = 1;
  }

  show(ctx) {
    if (this._hidden) return;

    // rounding for better performance
    const x = Math.floor(this._x);
    const d_pos = Math.floor(this._size / 2);

    ctx.save();
    ctx.translate(-d_pos + x, -d_pos);

    // if the moon is near the edge of the orbit, its size must be shrunk
    if (this._current_size < 1) {
      ctx.translate(d_pos, d_pos);
      ctx.scale(this._current_size, this._current_size);
      ctx.translate(-d_pos, -d_pos);
    }

    ctx.fillStyle = this._pattern;
    ctx.fillRect(0, 0, this._size, this._size);

    ctx.restore();
  }

  _generatePattern() {
    // create elements
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    // set canvas size
    canvas.width = this._size;
    canvas.height = this._size;

    // draw a circle
    ctx.fillStyle = `rgb(${this._color}, ${this._color}, ${this._color})`;
    ctx.strokeWidth = 5;
    ctx.strokeStyle = "rgba(220, 220, 220, 0.75)"; // TODO improve this

    ctx.beginPath();
    ctx.arc(this._size / 2, this._size / 2, this._r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // add some craters
    this._generateCraters(ctx);

    // export pattern
    this._pattern = ctx.createPattern(canvas, "no-repeat");
  }

  // add craters to pattern
  _generateCraters(ctx) {
    const num = random_int(3, 8);
    const TRIES = 100;
    const MIN_R = this._r / 6;
    const MAX_R = this._r / 3;
    let craters = [];

    // simple circle packing algorithm
    for (let i = 0; i < num; i++) {
      for (let j = 0; j < TRIES; j++) {
        const r = random(MIN_R, MAX_R);
        const rho = random(this._r - r * 2);
        const theta = random(Math.PI * 2);

        const x = rho * Math.cos(theta);
        const y = rho * Math.sin(theta);

        const free = craters.every(
          (c) => dist(x, y, c.x, c.y) >= r + c.r * 1.5
        );

        if (!free) continue;

        craters.push({ x, y, r });
        break;
      }
    }

    const fill = this._color - random_int(5, 15);

    ctx.save();
    ctx.translate(this._size / 2, this._size / 2);
    ctx.fillStyle = `rgb(${fill}, ${fill}, ${fill})`;
    craters.forEach((c) => {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.beginPath();
      ctx.arc(0, 0, c.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();
  }

  _easeIn(x) {
    // simple cos easing
    return 1 - Math.cos((x * Math.PI) / 2);
  }

  _easeOut(x) {
    // simple sin easing
    return Math.sin((x * Math.PI) / 2);
  }

  // moon orbit rotation
  get theta() {
    return this._theta;
  }
}
