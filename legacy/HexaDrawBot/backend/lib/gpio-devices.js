const IS_PI = require("detect-rpi")();
const Gpio = IS_PI ? require("pigpio").Gpio : null;

class PromiseQueue {
  constructor() {
    this._queue = [];
  }
  async addDelayedTask(delay, task) {
    return new Promise(resolve => {
      this._queue.push(() =>
        new Promise(r => {
          task();
          setTimeout(r, delay);
        }).then(resolve)
      );
      if (this._queue.length === 1) this._runTask();
    });
  }
  async _runTask() {
    if (this._queue.length !== 0) {
      await this._queue[0]();
      this._queue.shift();
      this._runTask();
    }
  }
}

class GpioWrapper extends PromiseQueue {
  constructor({ pin, output = false, input = false }) {
    super();
    this.pin = pin;
    this.gpio =
      Gpio === null
        ? null
        : new Gpio(pin, {
            mode: output ? Gpio.OUTPUT : input ? Gpio.INPUT : undefined
          });
  }
  servoWrite(value) {
    if (this.gpio !== null) {
      this.gpio.servoWrite(value);
    }
  }
  digitalWrite(value) {
    if (this.gpio !== null) {
      this.gpio.digitalWrite(value);
    }
  }
}

class ToggleServo extends GpioWrapper {
  constructor(
    { pin, delay = 200, minValue = 544, maxValue = 2400 },
    isOn = false,
    demo = false
  ) {
    super({ pin, output: true });
    this.onValue = minValue;
    this.offValue = minValue + Math.floor((maxValue - minValue) * 0.35);
    this.delay = delay;
    this.value = -1;
    this.set(isOn);

    if (demo) {
      this.set(!isOn);
      this.set(isOn);
      this.set(!isOn);
      this.set(isOn);
      this.set(!isOn);
      this.set(isOn);
    }
  }
  get isOn() {
    return this.value === this.onValue;
  }
  get isOff() {
    return this.value === this.offValue;
  }
  async set(isOn = false) {
    return this.write(isOn ? this.onValue : this.offValue);
  }
  async write(value, delay = this.delay) {
    await this.addDelayedTask(delay, () => {
      if (this.value !== value) {
        this.value = value;
        this.servoWrite(value);
      }
    });
  }
}

class Stepper extends PromiseQueue {
  constructor({ dir, step, invert = false, delay = 1 }) {
    super();
    this.dir = new GpioWrapper({ pin: dir.pin, output: true });
    this.step = new GpioWrapper({ pin: step.pin, output: true });
    this.invert = invert;
    this.delay = delay;
  }
  async set(forward, delay = this.delay) {
    forward = this.invert ? !forward : !!forward;
    await this.addDelayedTask(delay, () => {
      this.dir.digitalWrite(forward ? 1 : 0);
      this.step.digitalWrite(1);
    }).then(() => this.step.digitalWrite(0));
  }
}

module.exports = { ToggleServo, Stepper };
