class Sketch extends Engine {
  preload() {
    this._duration = 600; // animation duration
    this._columns = 4; // number of rows of galaxies
  }

  setup() {
    this._galaxies = [];
    const galaxy_scl = this.width / this._columns;

    for (let x = 0; x < this._columns; x++) {
      for (let y = 0; y < this._columns; y++) {
        this._galaxies.push(
          new Galaxy(x * galaxy_scl, y * galaxy_scl, galaxy_scl)
        );
      }
    }

    this._start = this.frameCount;
  }

  draw() {
    const percent = (this.frameCount % this._duration) / this._duration;

    this.background("#000f2b");
    this._galaxies.forEach((g) => g.update(percent));
    this._galaxies.forEach((g) => g.show(this.ctx));
  }
}
