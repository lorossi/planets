class Sketch extends Engine {
  preload() {
    this._duration = 600; // animation duration
  }

  setup() {
    this._stars_num = random_int(200, 300); // number of stars
    this._planets = [];
    const planet_scl = this.width / this._columns;

    // simple circle packing to fill the canvas
    const TRIES = 1e4;
    const MIN_SCL = this.width / 20;
    const MAX_SCL = this.width / 3;
    const NUM = random_int(4, 12);
    const BORDER = 0.75;

    for (let i = 0; i < NUM; i++) {
      for (let j = 0; j < TRIES; j++) {
        const scl = random(MIN_SCL, MAX_SCL);
        const x = random(this.width - scl);
        const y = random(this.height - scl);

        const free = this._planets.every(
          (e) =>
            dist(x + scl / 2, y + scl / 2, e.center_pos.x, e.center_pos.y) >=
            (scl / 2) * (1 + BORDER) + e.r
        );

        if (!free) continue;

        this._planets.push(new Planet(x, y, scl));
        break;
      }
    }

    this._stars = [];

    for (let i = 0; i < this._stars_num; i++) {
      const x = Math.random() * this.width;
      const y = Math.random() * this.height;

      this._stars.push(new Star(x, y, this._duration));
    }

    this._start = this.frameCount;
  }

  draw() {
    const percent = (this.frameCount % this._duration) / this._duration;

    this.background("#000f2b");

    this._stars.forEach((s) => s.update(percent));
    this._stars.forEach((s) => s.show(this.ctx));

    this._planets.forEach((p) => p.update(percent));
    this._planets.forEach((p) => p.show(this.ctx));
  }

  click() {
    this.setup();
  }
}
