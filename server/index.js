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
const srv = http.createServer(app);
const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

app.use(serve(PUBLIC_PATH));

const broadcast = message =>
  wss.clients.filter(client => client.readyState === WebSocket.OPEN).forEach(client => client.send(message));

wss.on('connection', (ws, req) => {
  /*
  const emit = (topic, payload = null) => ws.send(JSON.stringify({ topic, payload }))
  ws.on('message', message => {})

  // old
  console.log('connection!');
  socket.emit('connected', { hello: 'world' });
  socket.emit('botConnectionStatus', { connected: true });

  socket.on('pen', function(data) {
    c.pen(data.up);
  });

  socket.on('r', function(data) {
    c.rotate(Number(data.m), Number(data.dir), Number(data.d), Number(data.steps));
    //console.log(data.d, Number(data.x), Number(data.y))
    //c.moveRelative(data.x, data.y)
  });

  socket.on('drawpath', function(data) {
    c.addPath(data.path);
  });
  socket.on('drawart', function(data) {
    // Get whole svg, extract all path tags and concatenate them
    var $ = cheerio.load(data.content, { xmlMode: true });
    var fullpath = '';
    $('path').each(function() {
      var d = $(this).attr('d');
      fullpath += d.replace(/\s+/g, ' ') + ' ';
    });

    c.paths = [];
    c.drawingPath = false;
    c.addPath(fullpath.trim());
    //console.log(fullpath.trim())
  });
  socket.on('setStartPos', function(data) {
    c.setStartPos(data);
  });
  socket.on('drawingScale', function(data) {
    c.setDrawingScale(data.drawingScale);
    console.log('setscale:' + data.drawingScale);
  });
  socket.on('setD', function(data) {
    c.setD(Number(data.d));
  });
  socket.on('setScale', function(data) {
    c.setScale(Number(data.s));
    console.log('setScale:' + data.s);
  });

  socket.on('moveto', function(data) {
    c.moveTo(data.x, data.y);
  });

  socket.on('getDXY', function(data) {
    socket.emit('DXY', {
      d: c._D,
      x: c.startPos.x,
      y: c.startPos.y,
      s: c.drawingScale,
      limx: c.limits.x,
      limy: c.limits.y,
      strings: c.startStringLengths,
    });
  });

  socket.on('pause', function(data) {
    c.pause();
  });

  socket.on('reboot', function(data) {
    c.reboot();
  });

  socket.on('clearCanvas', function(data) {
    c.clearcanvas();
  });
  */
});

srv.listen(config.data.localPort, async () => {
  console.log(`listening on port ${config.data.localPort}...`);

  console.log('pentest');
  await util.wait(1000);
  drewie.penUp();
  drewie.penDown();
  drewie.penUp();
});
