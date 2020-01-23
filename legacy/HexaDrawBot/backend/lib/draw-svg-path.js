const bezierCurve = require("adaptive-bezier-curve");
const quadraticCurve = require("adaptive-quadratic-curve");
const arcToBezier = require("svg-arc-to-cubic-bezier");
const { parseSVG, makeAbsolute } = require("svg-path-parser");

const relC1 = cmd => {
  const { prev, currentX, currentY } = cmd;
  if (!prev || !prev.command.includes("curveto")) {
    return Object.assign(cmd, { x1: currentX, y1: currentY });
  } else if (prev.relative) {
    return Object.assign(cmd, {
      x1: currentX - prev.x + prev.x2,
      y1: currentY - prev.y + prev.y2
    });
  } else {
    return Object.assign(cmd, {
      x1: currentX + (currentX - prev.x2),
      y1: currentY + (currentY - prev.y2)
    });
  }
};

const commands = {
  // MoveTo
  M: (seq, { x, y }) => seq.moveTo(x, y),

  // LineTo
  L: (seq, { x, y }) => seq.lineTo(x, y),
  H: (seq, { x, currentY: y }) => seq.lineTo(x, y),
  V: (seq, { y, currentX: x }) => seq.lineTo(x, y),

  // Cubic Bézier Curve
  C: (seq, { x, y, x1, y1, x2, y2, currentX, currentY }) => {
    const points = bezierCurve(
      [currentX, currentY],
      [x1, y1],
      [x2, y2],
      [x, y]
    );
    for (let point of points) seq.lineTo(...point);
  },
  S: (seq, cmd) => commands.C(seq, relC1(cmd)),

  // Quadratic Bézier Curve:
  Q: (seq, { x, y, x1, y1, currentX, currentY }) => {
    const points = quadraticCurve([currentX, currentY], [x1, y1], [x, y]);
    for (let point of points) seq.lineTo(...point);
  },
  T: (seq, cmd) => commands.Q(seq, relC1(cmd)),

  // Elliptical Arc Curve
  A: (seq, cmd) =>
    arcToBezier({
      px: cmd.currentX,
      py: cmd.currentY,
      cx: cmd.x,
      cy: cmd.y,
      rx: cmd.rx,
      ry: cmd.ry,
      xAxisRotation: cmd.xAxisRotation,
      largeArcFlag: cmd.largeArc,
      sweepFlag: cmd.sweep
    })
      .map(({ x, y, x1, y1, x2, y2 }) =>
        Object.assign({}, cmd, { x, y, x1, y1, x2, y2 })
      )
      .forEach(cmd => commands.C(seq, cmd)),

  // ClosePath
  Z: (seq, { x, y }) => seq.lineTo(x, y)
};

const drawSvg = (path, { x, y, ...bot }) => {
  path = makeAbsolute(parseSVG(path));

  let currentX = x,
    currentY = y,
    prev = null;

  const sequence = {
    lineTo: (x, y) => {
      currentX = x;
      currentY = y;
      bot.lineTo(x, y);
    },
    moveTo: (x, y) => {
      currentX = x;
      currentY = y;
      bot.moveTo(x, y);
    }
  };

  for (let { code, ...cmd } of path) {
    if (!(code in commands)) console.error(`Unknown SVG Command '${code}'`);
    commands[code](sequence, { currentX, currentY, prev, ...cmd });
    prev = cmd;
  }

  return sequence;
};

module.exports = drawSvg;
