class Star {
  constructor(x, y, duration) {
    this._x = x;
    this._y = y;
    this._duration = duration;

    this._period = random_int(2, 5);
    this._phi = Math.random();
    this._r = this._random(1, 3);

    this._rho = this._r * 8;
    this._theta = Math.random() * Math.PI * 2;
  }

  update(percent) {
    this._current_r = this._easeInOut(percent) * this._r;
    this._theta = percent * Math.PI * this._period;
  }

  show(ctx) {
    ctx.save();
    ctx.translate(this._x, this._y);
    ctx.translate(this._rho, 0);
    ctx.rotate(this._theta);
    ctx.fillStyle = "#FFFFF6";
    ctx.beginPath();
    ctx.arc(0, 0, this._current_r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
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

  _easeInOut(x) {
    let t = x * this._period + this._phi;
    while (t > 1) t--;

    return Math.sin(t * Math.PI);
  }
}
