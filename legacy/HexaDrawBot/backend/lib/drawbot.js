const EventEmitter = require("events");
const { ToggleServo, Stepper } = require("./gpio-devices.js");
const svgToSequence = require("./svg-to-sequence");
const Store = require("data-store");
const debug = require("debug")("drawbot");

var exec = require("child_process").exec;

const config = new Store(
  { path: "config.json" },
  require("../../config.template.json")
);
const tmp = new Store({ path: ".tmp" });
const progress = new Store({ path: ".progress" });

class DrawBot extends EventEmitter {
  constructor() {
    super();

    const { servo: penServo } = config.get("pen");
    this.pen = new ToggleServo(penServo, true, true);

    const { stepper: lftStepper } = config.get("lft");
    this.lft = new Stepper(lftStepper);

    const { stepper: rgtStepper } = config.get("rgt");
    this.rgt = new Stepper(rgtStepper);

    const { x, y } = config.get("canvas.home");
    this.current = this.interpolate(x, y, {
      steps: { lft: 0, rgt: 0 }
    }).current;

    debug("drawbot initialized");
  }

  getCanvasConfig() {
    return config.get("canvas");
  }
  setCanvasConfig({ d, home: { x, y } }) {
    let canvas = { d, home: { x, y } };
    canvas = Object.assign({}, this.getCanvasConfig(), canvas);
    config.set("canvas", canvas);
  }

  get isPenUp() {
    return this.pen.isOn;
  }

  async doPenUp(up = false) {
    if (this.isPenUp != up) {
      debug("pen %s", up ? "up" : "down");
      debug("pen");
      this.emit("penUp", up);
      await this.pen.set(up);
      debug("pen");
    }
  }
  
  async doSteps({ direction, steps: { lft, rgt, max } }) {
    for (let i = 0, ls = lft, rs = rgt; i < max; i++, ls += lft, rs += rgt) {
      const promises = [];
      if (ls >= max) {
        ls -= max;
        promises.push(this.lft.set(direction.lft));
      }
      if (rs >= max) {
        rs -= max;
        promises.push(this.rgt.set(direction.rgt));
      }
      await Promise.all(promises);
    }
  }

  interpolate(x, y, current = this.current) {
    const {
      canvas: {
        d,
        home: { x: hx, y: hy }
      },
      lft: { stepsPerMM: lftStepsPerMM },
      rgt: { stepsPerMM: rgtStepsPerMM }
    } = config.data;

    // TODO add virtual home; here?

    const length = {
      lft: Math.sqrt(Math.pow(x + hx, 2) + Math.pow(y + hy, 2)),
      rgt: Math.sqrt(Math.pow(d - (x + hx), 2) + Math.pow(y + hy, 2))
    };

    const distance = Math.abs(Math.abs(length.lft) - Math.abs(length.rgt));
    // TODO add virtual home; or here?

    const currentSteps = {
      lft: Math.round(length.lft * lftStepsPerMM) - current.steps.lft,
      rgt: Math.round(length.rgt * rgtStepsPerMM) - current.steps.rgt
    };

    const direction = {
      lft: currentSteps.lft <= 0,
      rgt: currentSteps.rgt > 0
    };

    const steps = {
      lft: Math.abs(currentSteps.lft),
      rgt: Math.abs(currentSteps.rgt),
      max: Math.max(currentSteps.lft, currentSteps.rgt)
    };

    return {
      distance,
      current: { x, y, steps: currentSteps },
      direction,
      steps,
      duration: Math.max(steps.lft * this.lft.delay, steps.rgt * this.rgt.delay)
    };
  }

  stats(sequence) {
    let _isMove = this.isPenUp;
    let _current = this.current;
    const total = {
      distance: 0,
      duration: 0
    };
    for (let [x, y, isMove] of sequence) {
      const { distance, duration, current } = this.interpolate(x, y, _current);
      _current = current;
      total.distance += distance;
      total.duration += duration;
      if (_isMove !== isMove) {
        _isMove = isMove;
        total.duration += this.pen.delay;
      }
    }
    return total;
  }
  async draw(x, y, penUp) {
    await this.doPenUp(penUp);
    debug("--- draw --------------------------");
    const { current, duration, distance, direction, steps } = this.interpolate(
      x,
      y
    );
    this.current = current;
    this.emit("draw", { x, y, isMove: penUp, duration, distance });
    debug("stepping", { x, y, isMove: penUp, duration, distance });
    await this.doSteps({ direction, steps });
    debug("stepped");
  }

  async moveTo(x, y) {
    return await this.draw(x, y, true);
  }
  async moveBy(x, y) {
    return this.moveTo(this.current.x + x, this.current.y + y);
  }
  async lineTo(x, y) {
    return await this.draw(x, y, false);
  }
  async lineBy(x, y) {
    return this.lineTo(this.current.x + x, this.current.y + y);
  }
  async home() {
    const { x, y } = config.get("canvas.home");
    debug("home");
    this.moveTo(x, y);
  }

  clearSequence() {
    if (progress.get("isRunning", false)) {
      progress.del("isRunning");
      progress.del("i");
      tmp.del("svg");
      this.home();
    }
  }
  async startSequence() {
    const sequence = tmp.get("svg.sequence");
    progress.set("isRunning", true);
    let i = progress.get("i", 0);

    while (progress.get("isRunning") && i < sequence.length) {
      progress.set("i", ++i);
      await this.draw(...sequence[i]);
    }

    this.clearSequence();
  }
  pauseSequence() {
    progress.set("isRunning", false);
  }

  svgPathToSequence(svg, path) {
    this.clearSequence();
    debug("svgPathToSequence");
    const sequence = svgToSequence(path);
    tmp.set("svg", { svg, sequence });
    debug("svgPathToSequence");
    this.prepareDraw();
  }
  prepareDraw() {
    const { svg = null, sequence = [] } = tmp.get("svg", {});
    if (svg !== null) {
      debug("stats");
      const stats = this.stats(sequence);
      debug("stats");
      const index = progress.get("i", 0);
      let actual = null;
      if (index !== 0) {
        actual = this.stats(sequence.slice(0, index));
      }
      this.emit("prepareDraw", { svg, stats, actual });
    }
  }

}

module.exports = new DrawBot();




