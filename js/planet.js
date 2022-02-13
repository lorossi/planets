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
    this._border = 0.25;
    // simplex noise scale
    this._cloud_noise_scl = random(0.015, 0.005);
    this._land_noise_scl = random(0.01, 0.0025);

    this._moons_number = random_int(0, 4);

    // planet radius
    this._r = (this._size / 2) * (1 - this._border);

    // moons!
    this._moons = [];
    this._generateMoons();

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
    ctx.strokeStyle = "rgb(255, 255, 255, 0.5)";
    ctx.beginPath();
    ctx.arc(this._size / 2, this._size / 2, this._r, 0, Math.PI * 2);
    ctx.stroke();

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
      const moon_channel = random(50, 200);
      const moon_color = `rgb(${moon_channel}, ${moon_channel}, ${moon_channel})`;
      this._moons.push(new Moon(this._size * (1 - this._border), moon_color));
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
    const land_threshold = random(-1, 1);
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
          this._generateCloud(x, y, particles_scl, cloud_threshold, ctx);
        }
      }
    }

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
}

class Moon {
  constructor(size, color) {
    // ratio between planet and moon size
    const scl_factor = random(6, 20);
    this._r = size / scl_factor;
    // some approximation for the orbit size
    this._orbit_size = size + 2 * this._r;
    this._fill = color;
    // when should the planet start appearing or disappearing?
    this._disappearing_edge = random(0.05, 0.1);

    this._theta = Math.random() * Math.PI * 2;
    this._start_x = Math.random();
    this._x = 0;
    this._hidden = true;
    // number of orbits in the total animation duration
    this._orbits = random_int(1, 3);

    // TODO texturize with some craters
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
      this._current_r = this._easeIn(x) * this._r;
    } else if (real_percent > 1 - this._disappearing_edge) {
      const x = (1 - real_percent) / this._disappearing_edge; // [0.95, 1] -> [0, 1]
      this._current_r = this._easeOut(x) * this._r;
    } else this._current_r = this._r;
  }

  show(ctx) {
    if (this._hidden) return;

    // rounding for better performance
    const x = Math.floor(this._x);
    const r = Math.floor(this._current_r);

    ctx.save();
    ctx.translate(x, 0);

    ctx.fillStyle = this._fill;
    ctx.strokeStyle = "rgba(220, 220, 220, 0.5)"; // TODO improve this
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  _easeIn(x) {
    return 1 - Math.cos((x * Math.PI) / 2);
  }

  _easeOut(x) {
    return Math.sin((x * Math.PI) / 2);
  }

  // moon orbit rotation
  get theta() {
    return this._theta;
  }
}

const random_int = (a, b) => {
  if (a == undefined && b == undefined) return random_int(0, 2);
  else if (b == undefined) return random_int(0, a);
  else if (a != undefined && b != undefined)
    return Math.floor(Math.random() * (b - a)) + a;
};

const random = (a, b) => {
  if (a == undefined && b == undefined) return random(0, 1);
  else if (b == undefined) return random(0, a);
  else if (a != undefined && b != undefined) return Math.random() * (b - a) + a;
};

const random_interval = (average = 0.5, interval = 0.5) => {
  return random(average - interval, average + interval);
};
