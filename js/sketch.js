class Sketch extends Engine {
  preload() {
    this._duration = 600; // animation duration
  }

  setup() {
    this._columns = random_int(2, 6); // number of columns of planets
    this._stars_num = random_int(200, 300); // number of stars
    this._planets = [];
    const planet_scl = this.width / this._columns;

    for (let x = 0; x < this._columns; x++) {
      for (let y = 0; y < this._columns; y++) {
        this._planets.push(
          new Planet(x * planet_scl, y * planet_scl, planet_scl)
        );
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
