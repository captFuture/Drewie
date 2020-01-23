const bezierCurve = require("adaptive-bezier-curve");
const quadraticCurve = require("adaptive-quadratic-curve");
const arcToBezier = require("svg-arc-to-cubic-bezier");
const { parseSVG, makeAbsolute } = require("svg-path-parser");

class Sequence {
  constructor(x, y) {
    this._data = [[x, y, true]];
  }
  get xy() {
    const [x, y] = this._data[this._data.length - 1];
    return [x, y];
  }
  get x() {
    return this._data[this._data.length - 1][0];
  }
  get y() {
    return this._data[this._data.length - 1][1];
  }
  _add(x, y, isMove) {
    const last = this._data[this._data.length - 1];
    if (x !== last[0] || y !== last[1] || isMove !== last[2])
      this._data.push([x, y, isMove]);
  }
  lineTo(x, y) {
    this._add(x, y, false);
  }
  moveTo(x, y) {
    this._add(x, y, true);
  }
  curveTo(points) {
    points.forEach(([x, y]) => this._add(x, y, false));
  }
  export() {
    const data = this._data;
    return data;
  }
}

const svgToSequence = svgPath => {
  const commands = makeAbsolute(parseSVG(svgPath));
  const seq = new Sequence(commands[0].x, commands[0].y);

  console.log([...new Set([...commands.map(({ code }) => code)])]);

  for (let i = 0, ln = commands.length; i < ln; i++) {
    const { code, x, y, ...cmd } = commands[i];

    const c1 = (rel = false) => {
      const prev = commands[i - 1];
      if (!rel || !prev || !prev.command.includes("curveto")) {
        return [cmd.x1, cmd.y1];
      } else if (prev.relative) {
        const [x, y] = seq.xy;
        return [x - prev.x + prev.x2, y - prev.y + prev.y2];
      } else {
        const [x, y] = seq.xy;
        return [x + (x - prev.x2), y - (y - prev.y2)];
      }
    };
    const c2 = () => [cmd.x2, cmd.y2];

    switch (code) {
      // MoveTo
      case "M":
        seq.moveTo(x, y);
        break;

      // LineTo
      case "L":
        seq.lineTo(x, y);
        break;

      case "H":
        seq.lineTo(x, seq.y);
        break;

      case "V":
        seq.lineTo(seq.x, y);
        break;

      // Cubic Bézier Curve
      case "C":
        seq.curveTo(bezierCurve(seq.xy, c1(), c2(), [x, y]));
        break;
      case "S":
        seq.curveTo(bezierCurve(seq.xy, c1(true), c2(), [x, y]));
        break;

      // Quadratic Bézier Curve:
      case "Q":
        seq.curveTo(quadraticCurve(seq.xy, c1(), [x, y]));
        break;
      case "T":
        seq.curveTo(quadraticCurve(seq.xy, c1(true), [x, y]));
        break;

      // Elliptical Arc Curve
      case "A": {
        const [px, py] = seq.xy;
        const {
          x: cx,
          y: cy,
          rx,
          ry,
          xAxisRotation,
          largeArc: largeArcFlag,
          sweep: sweepFlag
        } = commands[i];
        arcToBezier({
          px,
          py,
          cx,
          cy,
          rx,
          ry,
          xAxisRotation,
          largeArcFlag,
          sweepFlag
        }).forEach(({ x, y, x1, y1, x2, y2 }) =>
          seq.curveTo(bezierCurve(seq.xy, [x1, y1], [x2, y2], [x, y]))
        );
        break;
      }

      // ClosePath
      case "Z":
        seq.lineTo(x, y);
        break;
    }
  }

  return seq.export();
};

module.exports = svgToSequence;
