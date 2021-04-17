$( document ).ready(function() {
  // Kaleidoscope
  var i, image, kaleidoscope, len, onChange, options, ref, tr, tx, ty, update, randomData;

  var nFractals = document.getElementsByClassName('fractal-logo').length;

  class Kaleidoscope {
    constructor(options1 = {}) {
      var key, ref, ref1, val;
      this.HALF_PI = Math.PI / 2;
      this.TWO_PI = Math.PI * 2;
      this.options = options1;
      this.defaults = {
        offsetRotation: 0.0,
        offsetScale: 1.0,
        offsetX: 0.0,
        offsetY: 0.0,
        radius: 260,
        slices: 12,
        zoom: 1.0
      };
      ref = this.defaults;
      for (key in ref) {
        val = ref[key];
        this[key] = val;
      }
      ref1 = this.options;
      for (key in ref1) {
        val = ref1[key];
        this[key] = val;
      }
      if (this.domElement == null) {
        this.domElement = document.createElement('canvas');
      }
      if (this.context == null) {
        this.context = this.domElement.getContext('2d');
      }
      if (this.image == null) {
        this.image = document.createElement('img');
      }
    }

    draw() {
      var cx, i, index, ref, results, scale, step;
      this.domElement.width = this.domElement.height = this.radius * 2;
      this.context.fillStyle = this.context.createPattern(image, 'repeat');
      scale = this.zoom * (this.radius / Math.min(this.image.width, this.image.height));
      step = this.TWO_PI / this.slices;
      cx = this.image.width / 2;
      results = [];
      for (index = i = 0, ref = this.slices; (0 <= ref ? i <= ref : i >= ref); index = 0 <= ref ? ++i : --i) {
        this.context.save();
        this.context.translate(this.radius, this.radius);
        this.context.rotate(index * step);
        this.context.beginPath();
        this.context.moveTo(-0.5, -0.5);
        this.context.arc(0, 0, this.radius, step * -0.51, step * 0.51);
        this.context.lineTo(0.5, 0.5);
        this.context.closePath();
        this.context.rotate(this.HALF_PI);
        this.context.scale(scale, scale);
        this.context.scale([-1, 1][index % 2], 1);
        this.context.translate(this.offsetX - cx, this.offsetY);
        this.context.rotate(this.offsetRotation);
        this.context.scale(this.offsetScale, this.offsetScale);
        this.context.fill();
        results.push(this.context.restore());
      }
      return results;
    }
  }

  // Init kaleidoscope
  image = new Image;
  image.onload = () => {
    return kaleidoscope[0].draw();
  };
  image.src = "./static/fractal.jpg";

  kaleidoscope =  [], onChange = [], options = [], tr = [], tx = [], ty = [], update = [];

  for (i = 0; i < nFractals; i++) {
    kaleidoscope[i] = new Kaleidoscope({
      image: image,
      slices: 20
    });

    //kaleidoscope.domElement.style.position = 'absolute';
    //kaleidoscope.domElement.style.marginLeft = -kaleidoscope.radius + 'px';
    //kaleidoscope.domElement.style.marginTop = -kaleidoscope.radius + 'px';
    kaleidoscope[i].domElement.style.width = '100%';
    kaleidoscope[i].domElement.style.height = 'auto';
    kaleidoscope[i].domElement.style.paddingBottom = '5px';
    kaleidoscope[i].domElement.width = kaleidoscope[i].domElement.offsetWidth;
    kaleidoscope[i].domElement.height = kaleidoscope[i].domElement.offsetHeight;

    document.getElementsByClassName('fractal-logo')[i].appendChild(kaleidoscope[i].domElement);

    // Mouse events
    tx[i] = kaleidoscope[i].offsetX;
    ty[i] = kaleidoscope[i].offsetY;
    tr[i] = kaleidoscope[i].offsetRotation;

    // Init
    options[i] = {
      interactive: true,
      ease: 0.005
    };
  }

  (update = () => {
    for (i = 0; i < nFractals; i++) {
      var delta, theta;
      if (options[i].interactive) {
        delta = tr[i] - kaleidoscope[i].offsetRotation;
        theta = Math.atan2(Math.sin(delta), Math.cos(delta));
        kaleidoscope[i].offsetX += (tx[i] - kaleidoscope[i].offsetX) * options[i].ease;
        kaleidoscope[i].offsetY += (ty[i] - kaleidoscope[i].offsetY) * options[i].ease;
        kaleidoscope[i].offsetRotation += (theta - kaleidoscope[i].offsetRotation) * options[i].ease;
        kaleidoscope[i].draw();
      }
    }
    return setTimeout(update, 1000 / 60);
  })();
  (randomData = () => {
    var dx, dy, hx, hy;
    dx = Math.random();
    dy = Math.random();
    hx = dx - 0.5;
    hy = dy - 0.5;
    for (var i = 0; i < nFractals; i++) {
      tx[i] = hx * kaleidoscope[i].radius * -2;
      ty[i] = hy * kaleidoscope[i].radius * 2;
      tr[i] = Math.atan2(hy, hx);
      kaleidoscope[i].draw();
    }
    return setTimeout(randomData, 1000 / 4);
  })();
});
