class Planet {
  constructor(x, y, size) {
    // top left corner position of the galaxy
    this._x = x;
    this._y = y;
    // size of the galaxy
    this._size = size;

    // border of the rectangle containing the galaxy
    this._border = 0.25;

    // TODO pick better colours

    // fancy array shuffling by 1loc.com
    this._planet_colours = [
      "#e96d5e",
      "#ff9760",
      "#ffe69d",
      "#6a7e6a",
      "#393f5f",
      "#a0ffe3",
      "#65dc98",
      "#8d8980",
      "#575267",
      "#222035",
    ]
      .map((a) => ({ sort: Math.random(), value: a }))
      .sort((a, b) => a.sort - b.sort)
      .map((a) => a.value);

    // TODO texturize the planets

    this._fill = this._planet_colours.pop();

    this._moons_number = random_int(2, 6);

    // planet radius
    this._r = (this._size / 2) * (1 - this._border);

    // moons!
    this._moons = [];
    this._generateMoons();
  }

  update(percent) {
    this._moons.forEach((m) => m.update(percent));
  }

  show(ctx) {
    ctx.save();
    ctx.translate(this._x, this._y);

    ctx.save();

    ctx.translate(this._size / 2, this._size / 2);

    // draw the main planet
    ctx.fillStyle = this._fill;
    ctx.beginPath();
    ctx.arc(0, 0, this._r, 0, Math.PI * 2);
    ctx.fill();

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
      this._moons.push(
        new Moon(this._size * (1 - this._border), this._planet_colours.pop())
      );
    }
  }
}

class Moon {
  constructor(size, color) {
    // ratio between planet and moon size
    const scl_factor = random(8, 40);
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
