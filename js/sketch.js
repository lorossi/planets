class Sketch extends Engine {
  preload() {
    this._duration = 600; // animation duration
    this._columns = 4; // number of columns of planets
  }

  setup() {
    this._planets = [];
    const planet_scl = this.width / this._columns;

    for (let x = 0; x < this._columns; x++) {
      for (let y = 0; y < this._columns; y++) {
        this._planets.push(
          new Planet(x * planet_scl, y * planet_scl, planet_scl)
        );
      }
    }

    this._start = this.frameCount;
  }

  draw() {
    const percent = (this.frameCount % this._duration) / this._duration;

    // TODO make a better background. Some stars maybe?
    this.background("#000f2b");
    this._planets.forEach((p) => p.update(percent));
    this._planets.forEach((p) => p.show(this.ctx));
  }
}
