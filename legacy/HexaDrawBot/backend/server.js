const express = require("express");
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);

const kiosk = require("./lib/kiosk");
const drawbot = require("./lib/drawbot");

var exec = require("child_process").exec;

app.use(express.static("frontend/dist"));

function shutdownPi(callback) {
  exec('shutdown now', function (error, stdout, stderr) { callback(stdout); });
}

function rebootPi(callback) {
  exec('shutdown -r now', function (error, stdout, stderr) { callback(stdout); });
}

io.on("connection", function(socket) {
  // new connection
  socket.emit("penUp", drawbot.isPenUp);
  //socket.emit("resumeSession", drawbot.resumeSession());

  // control
  socket.on("moveBy", ({ x, y }) => drawbot.moveBy(x, y));
  socket.on("home", () => drawbot.home());
  socket.on("togglePen", () => drawbot.doPenUp(!drawbot.isPenUp));
  socket.on("togglePen", () => console.log(drawbot.isPenUp));

  // cancel
  socket.on("rebootpi", () => rebootPi(function (output) { console.log(output); }));
  socket.on("shutdownpi", () => rebootPi(function (output) { console.log(output); }));
  socket.on("shutdown", () => shutdown(function (output) {console.log(output);}));
  socket.on("newhome",() => console.log("newhome"));

  // canvas config
  socket.on("getCanvasConfig", () =>
    socket.emit("onConfig", drawbot.getCanvasConfig())
  );
  socket.on("setCanvasConfig", config => drawbot.setCanvasConfig(config));

  socket.on("drawSvg", (svg, path) => {
    const sequence = drawbot.svgPathToSequence(svg, path);
    socket.emit("resumeSession", { drawings: sequence });
    //drawSvgPath(path, drawbot.createSequence());
    //drawbot.startSequence();
  });
});

["penUp", "drawTo"].forEach(event => {
  drawbot.addListener(event, (...payload) => io.emit(event, ...payload));
});

server.listen(process.env.npm_package_config_port, () => {
  const { port } = server.address();
  console.log(`server listen on port ${port}`);
  if ("KIOSK" in process.env) kiosk(port);
});

const shutdown = () => {
  console.log("server stopped");
  server.close();
  process.exit(0);
};

process.on("SIGHUP", shutdown);
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("SIGCONT", shutdown);
