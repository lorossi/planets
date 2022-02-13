class Planet {
  constructor(x, y, size) {
    // top left corner position of the galaxy
    this._x = x;
    this._y = y;
    // size of the galaxy
    this._size = size;
    // init noise
    this._simplex = new SimplexNoise();

    // border of the rectangle containing the galaxy
    this._border = 0.4;
    // simplex noise scale
    this._cloud_noise_scl = this._random(0.015, 0.005);
    this._land_noise_scl = this._random(0.01, 0.0025);

    this._moons_number = this._random_int(1, 5);

    // planet radius
    this._r = (this._size / 2) * (1 - this._border);

    // moons!
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

    ctx.fillStyle = this._pattern;
    ctx.fillRect(0, 0, this._size, this._size);
    ctx.restore();

    // draw the moons
    this._moons.forEach((m) => {
      ctx.save();
      ctx.translate(this._size / 2, this._size / 2);
      ctx.rotate(m.theta);
      m.show(ctx);
      ctx.restore();
    });

    ctx.restore();
  }

  // generate some moons for this planet
  _generateMoons() {
    for (let i = 0; i < this._moons_number; i++) {
      const moon_channel = this._random(70, 200);
      this._moons.push(new Moon(this._size * (1 - this._border), moon_channel));
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
    const sea_hue = this._random(190, 255);
    const sea_sat = this._random(80, 100);
    const sea_val = this._random(40, 50);
    // draw a circle
    ctx.fillStyle = `hsl(${sea_hue}, ${sea_sat}%, ${sea_val}%)`;
    ctx.beginPath();
    ctx.arc(this._size / 2, this._size / 2, this._r, 0, Math.PI * 2);
    ctx.fill();

    // particles (cloud and land)
    const particles_scl = 1;
    const cloud_threshold = this._random(0.25, 1);
    const land_threshold = this._random(-0.75, 1);
    const land_hue = this._random_int(180);

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
          this._generateCloud(x, y, particles_scl, cloud_threshold, ctx);
        }
      }
    }

    ctx.strokeWidth = 4;
    ctx.strokeStyle = "rgb(255, 255, 255, 0.5)"; // TODO improve this
    ctx.beginPath();
    ctx.arc(this._size / 2, this._size / 2, this._r, 0, Math.PI * 2);
    ctx.stroke();

    // export pattern
    this._pattern = ctx.createPattern(canvas, "no-repeat");
  }

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

  _generateCloud(x, y, scl, threshold, ctx) {
    // clouds noise parameters
    const cloud_octaves = 3;
    const cloud_persistence = 0.75;
    const cloud_lacunarity = 2.2;

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

  _random_int(a, b) {
    if (a == undefined && b == undefined) {
      a = 0;
      b = 2;
    } else if (b == undefined) {
      b = a;
      a = 0;
    }

    return Math.floor(Math.random() * (b - a)) + a;
  }

  _random(a, b) {
    if (a == undefined && b == undefined) {
      a = 0;
      b = 2;
    } else if (b == undefined) {
      b = a;
      a = 0;
    }

    return Math.random() * (b - a) + a;
  }
}

class Moon {
  constructor(size, color) {
    this._size = size;
    this._color = color;

    // ratio between planet and moon size
    const scl_factor = this._random(6, 20);
    this._r = size / scl_factor;
    // some approximation for the orbit size
    this._orbit_size = size + 2 * this._r;
    // when should the planet start appearing or disappearing?
    this._disappearing_edge = this._random(0.05, 0.1);

    this._theta = Math.random() * Math.PI * 2;

    this._start_x = Math.random();
    this._x = 0;
    this._hidden = true;
    // number of orbits in the total animation duration
    this._orbits = this._random_int(1, 3);

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

    if (this._current_size < 1) {
      ctx.translate(d_pos, d_pos);
      ctx.scale(this._current_size, this._current_size);
      ctx.translate(-d_pos, -d_pos);
    }

    ctx.fillStyle = this._pattern;
    ctx.fillRect(0, 0, this._size, this._size);

    ctx.restore();
  }

  _easeIn(x) {
    return 1 - Math.cos((x * Math.PI) / 2);
  }

  _easeOut(x) {
    return Math.sin((x * Math.PI) / 2);
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
    ctx.strokeWidth = 4;
    ctx.strokeStyle = "rgba(220, 220, 220, 0.5)"; // TODO improve this

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
    const num = this._random_int(0, 6);
    const TRIES = 100;
    const MIN_R = this._r / 6;
    const MAX_R = this._r / 3;
    let craters = [];

    // simple circle packing algorithm
    for (let i = 0; i < num; i++) {
      for (let j = 0; j < TRIES; j++) {
        const r = this._random(MIN_R, MAX_R);
        const rho = this._random(this._r - r * 2);
        const theta = this._random(Math.PI * 2);

        const x = rho * Math.cos(theta);
        const y = rho * Math.sin(theta);

        const free = craters.every(
          (c) => this._dist(x, y, c.x, c.y) >= r + c.r * 1.5
        );

        if (!free) continue;

        craters.push({ x, y, r });
        break;
      }
    }

    const fill = this._random(0.85, 0.9) * this._color;

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

  // moon orbit rotation
  get theta() {
    return this._theta;
  }

  _random_int(a, b) {
    if (a == undefined && b == undefined) {
      a = 0;
      b = 2;
    } else if (b == undefined) {
      b = a;
      a = 0;
    }

    return Math.floor(Math.random() * (b - a)) + a;
  }

  _random(a, b) {
    if (a == undefined && b == undefined) {
      a = 0;
      b = 2;
    } else if (b == undefined) {
      b = a;
      a = 0;
    }

    return Math.random() * (b - a) + a;
  }

  _random_interval(average, interval) {
    return this._random(average - interval, average + interval);
  }

  _dist(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  }
}
