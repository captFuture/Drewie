/*
   __                                         
  /\ \                           __           
  \_\ \  _ __    __   __  __  __/\_\     __   
  /'_` \/\`'__\/'__`\/\ \/\ \/\ \/\ \  /'__`\ 
 /\ \L\ \ \ \//\  __/\ \ \_/ \_/ \ \ \/\  __/ 
 \ \___,_\ \_\\ \____\\ \___x___/'\ \_\ \____\
  \/__,_ /\/_/ \/____/ \/__//__/   \/_/\/____/

*/
const http = require('http');

const WebSocket = require('ws');
const express = require('express');
const serve = require('serve-static');

const PUBLIC_PATH = require('path').join(__dirname, '../public');
const CONFIG_PATH = require('path').join(__dirname, '../config.json');

const util = require('../lib/util');
const config = require('../lib/json-store')(CONFIG_PATH);
const drewie = require('../drewie')(config);

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(serve(PUBLIC_PATH));

const wrapper = {
  getDXY() {
    this.send('DXY', {
      d: drewie._D,
      x: drewie.startPos.x,
      y: drewie.startPos.y,
      s: drewie.drawingScale,
      limx: drewie.limits.x,
      limy: drewie.limits.y,
      strings: drewie.startStringLengths,
    });
  },
  pen({ up }) {
    drewie.pen(up);
  },
  r(data) {
    drewie.rotate(Number(data.m), Number(data.dir), Number(data.d), Number(data.steps));
  },
  drawpath({ path }) {
    drewie.addPath(path);
  },
  drawart({ content }) {
    var $ = cheerio.load(content, { xmlMode: true });
    var fullpath = '';
    $('path').each(function() {
      var d = $(this).attr('d');
      fullpath += d.replace(/\s+/g, ' ') + ' ';
    });

    drewie.paths = [];
    drewie.drawingPath = false;
    drewie.addPath(fullpath.trim());
    //console.log(fullpath.trim())
  },
  setStartPos(pos) {
    drewie.setStartPos(pos);
  },
  drawingScale(data) {
    drewie.setDrawingScale(data.drawingScale);
    console.log('setscale:' + data.drawingScale);
  },
  setD(data) {
    drewie.setD(Number(data.d));
  },
  setScale(data) {
    drewie.setScale(Number(data.s));
    console.log('setScale:' + data.s);
  },
  moveto(data) {
    drewie.moveTo(data.x, data.y);
  },
  pause(data) {
    drewie.pause();
  },
  reboot(data) {
    drewie.reboot();
  },
  clearCanvas(data) {
    drewie.clearcanvas();
  },
};

const wsMessageHandler = ws => {
  const ctx = {
    send: (topic, payload = null) =>
      wss.clients.forEach(
        client => client.readyState === WebSocket.OPEN && client.send(JSON.stringify({ topic, payload }))
      ),
  };

  ws.on('message', msg => {
    try {
      const { topic, payload } = JSON.parse(msg);
      wrapper[topic].call(ctx, payload);
    } catch (e) {
      console.log(e, msg);
    }
  });

  ctx.send('connected', { hello: 'world' });
  ctx.send('botConnectionStatus', { connected: true });
};

wss.on('connection', (ws, req) => {
  wsMessageHandler(ws);
});

server.listen(config.data.localPort, async () => {
  console.log(`listening on port ${config.data.localPort}...`);

  console.log('pentest');
  await util.wait(1000);
  drewie.penUp();
  drewie.penDown();
  drewie.penUp();
});
