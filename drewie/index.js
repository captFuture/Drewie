var isPi = require('detect-rpi');
if (isPi()) {
  var Gpio = require('pigpio').Gpio;
} else {
}

var cBezier = require('adaptive-bezier-curve');
var qBezier = require('adaptive-quadratic-curve');
var svgpath = require('svgpath');
const { parseSVG, makeAbsolute } = require('svg-path-parser');
var arcToBezier = require('./arcToBezier');
var svgpath = require('svgpath');

var BotController = cfg => {
  var drewiecontrol = {};
  var config = cfg.data;

  /////////////////////////////////
  // MAIN SETUP VARIABLES
  drewiecontrol._BOT_ID = config.botID; // || 'two'
  drewiecontrol._DIRSWAP = config.swapDirections; // || true
  drewiecontrol.limits = config.limits;

  drewiecontrol.baseDelay = config.baseDelay; // || 2
  drewiecontrol._D = config.d; // || 1000// default distance between string starts
  drewiecontrol.drawingScale = config.drawingScale; // || defaults to 100%
  drewiecontrol.startPos = config.startPos; // || { x: 100, y: 100 }

  drewiecontrol.stepsPerMM = config.stepsPerMM; // || [5000/500, 5000/500] // steps / mm
  drewiecontrol.penPause = config.penPauseDelay; // || 200 // pause for pen up/down movement (in ms)
  drewiecontrol.servoMin = config.servo.Min;
  drewiecontrol.servoMax = config.servo.Max;
  drewiecontrol.swapServo = config.servo.swap;

  if (isPi()) {
    /////////////////////////////////
    // GPIO SETUP
    var gmOut = { mode: Gpio.OUTPUT };
    var gmIn = { mode: Gpio.INPUT };
    var dirPins = [new Gpio(config.pins.leftDir, gmOut), new Gpio(config.pins.rightDir, gmOut)];
    var stepPins = [new Gpio(config.pins.leftStep, gmOut), new Gpio(config.pins.rightStep, gmOut)];
    var enablePins = [new Gpio(config.pins.leftEnable, gmOut), new Gpio(config.pins.rightEnable, gmOut)];

    var buttonPins = [
      new Gpio(config.pins.btnOne, gmIn),
      new Gpio(config.pins.btnTwo, gmIn),
      new Gpio(config.pins.btnThree, gmIn),
    ];

    var logicPins = [new Gpio(config.pins.leftDriver, gmOut), new Gpio(config.pins.rightDriver, gmOut)];

    // set up servo GPIO pin
    var servo = new Gpio(config.pins.penServo, gmOut);

  } else {
    // Setup for debugging if not running on a raspberry
    var gmOut = { mode: 'localdebug' };
    var dirPins = [config.pins.leftDir, config.pins.rightDir];
    var enablePins = [config.pins.leftEnable, config.pins.rightEnable];
    var stepPins = [config.pins.leftStep, config.pins.rightStep];
    var servo = config.pins.penServo;
    var logicPins = [config.pins.leftDriver, config.pins.rightDriver];
  }

  /////////////////////////////////
  // CONTROLLER VARIABLES

  drewiecontrol.pos = { x: 0, y: 0 };
  drewiecontrol.penPos = 0;
  drewiecontrol.paused = false;

  // string length stuff
  drewiecontrol.startStringLengths = [0, 0];
  drewiecontrol.stringLengths = [0, 0];
  drewiecontrol.startSteps = [0, 0];
  drewiecontrol.currentSteps = [0, 0];
  drewiecontrol.stepCounts = [0, 0];
  drewiecontrol.steppeds = [0, 0];
  drewiecontrol.paths = [];
  drewiecontrol.drawingPath = false;

  /////////////////////////////////
  // LIMIT SWITCHES FOR AUTOMATIC HOMING

  if (isPi()) {
  } else {
  }

  /////////////////////////////////
  // HARDWARE METHODS

  drewiecontrol.setStates = () => {
    
    if (isPi()) {
      console.log('Activating Motor drivers');
      logicPins[0].digitalWrite(1); // power Left Motor Driver
      logicPins[1].digitalWrite(1); // power Right Motor Driver
      console.log('Driverpin 1:' + logicPins[0]);
      console.log('Driverpin 2:' + logicPins[1]);

      console.log('Enabling Motors'); // These pins are not connected in the current wiring scheme ...
      enablePins[0].digitalWrite(0); // enable Left Motor (Motor is enabled when pin is LOW)
      enablePins[1].digitalWrite(0); // enable Right Motor
      console.log('Enablepin 1:' + logicPins[0]);
      console.log('Enablepin 2:' + logicPins[1]);    
    }else{

    }
  };

  drewiecontrol.updateStringLengths = () => {
    drewiecontrol.startStringLengths = [
      Math.sqrt(drewiecontrol.startPos.x * drewiecontrol.startPos.x + drewiecontrol.startPos.y * drewiecontrol.startPos.y),
      Math.sqrt((drewiecontrol._D - drewiecontrol.startPos.x) * (drewiecontrol._D - drewiecontrol.startPos.x) + drewiecontrol.startPos.y * drewiecontrol.startPos.y),
    ];
    drewiecontrol.stringLengths = [drewiecontrol.startStringLengths[0], drewiecontrol.startStringLengths[1]];
    drewiecontrol.startSteps = [
      Math.round(drewiecontrol.stringLengths[0] * drewiecontrol.stepsPerMM[0]),
      Math.round(drewiecontrol.stringLengths[1] * drewiecontrol.stepsPerMM[1]),
    ];
    drewiecontrol.currentSteps = [drewiecontrol.startSteps[0], drewiecontrol.startSteps[1]];

    console.log('drewiecontrol.startPos', JSON.stringify(drewiecontrol.startPos));
    console.log('startStringLengths', JSON.stringify(drewiecontrol.startStringLengths));
    return drewiecontrol.startStringLengths;
  };

  drewiecontrol.setStartPos = data => {
    cfg.data.startPos.x = drewiecontrol.startPos.x = Number(data.x); // set values and store in config
    cfg.data.startPos.y = drewiecontrol.startPos.y = Number(data.y); // set values and store in config
    cfg.save(); // save to local config.json file
    drewiecontrol.updateStringLengths();
  };
  drewiecontrol.setScale = data => {
    console.log('drewiecontrol.setscale:' + data);
    cfg.data.drawingScale = drewiecontrol.drawingScale = Number(data); // set value and store in config
    cfg.save(); // save to local config.json file
    drewiecontrol.updateStringLengths();
  };

  drewiecontrol.setD = data => {
    cfg.data.d = drewiecontrol._D = Number(data); // set value and store in config
    cfg.save(); // save to local config.json file
    drewiecontrol.updateStringLengths();
  };

  drewiecontrol.setDrawingScale = data => {
    cfg.data.drawingScale = drewiecontrol.drawingScale = Number(data); // set value and store in config
    cfg.save(); // save to local config.json file
  };

  drewiecontrol.pen = dir => {
    drewiecontrol.penPos = dir;
    // 0=down, 1=up
    if (drewiecontrol.swapServo) {
      var servoUpPos = drewiecontrol.servoMax;
      var servoDnPos = drewiecontrol.servoMin;
    } else {
      var servoUpPos = drewiecontrol.servoMin;
      var servoDnPos = drewiecontrol.servoMax;
    }

    if (dir == 1) {
      // lift pen up
      console.log('Pen: up ' + servoUpPos);
      if (isPi()) {
        servo.servoWrite(servoUpPos);
      }
    } else if (dir == 0) {
      // put pen down
      console.log('Pen: down ' + servoDnPos);
      if (isPi()) {
        servo.servoWrite(servoDnPos);
      }
    } else {
      // lift pen up
      console.log('Pen: up ' + servoUpPos);
      if (isPi()) {
        servo.servoWrite(servoUpPos);
      }
    }
    if (drewiecontrol.localio) {
      drewiecontrol.localio.emit('penState', Number(dir));
      //console.log('SendPen: '+Number(dir))
    }
  };

  drewiecontrol.penUp = () => drewiecontrol.pen(1);
  drewiecontrol.penDown = () => drewiecontrol.pen(0);

  drewiecontrol.penThen = (dir, callback) => {
    if (dir != drewiecontrol.penPos) {
      drewiecontrol.pen(dir);
      if (callback != undefined) {
        setTimeout(callback, drewiecontrol.penPause);
      }
    } else {
      callback();
    }
  };

  //////////////////// TODO: change this to a wave function with pigpio

  drewiecontrol.makeStep = (m, d) => {
    // console.log('step',d)
    if (drewiecontrol._DIRSWAP) d = !d;
    if (isPi()) {
      dirPins[m].digitalWrite(d);
    }
    if (isPi()) {
      stepPins[m].digitalWrite(1);
    }
    if (isPi()) {
      setTimeout(function() {
        if (isPi()) {
          stepPins[m].digitalWrite(0);
        }
      }, 1);
    }
  };

  // drewiecontrol.rotateBoth takes the calculated steps and moves both motors
  // when both are finished the callback tells the function doRotation to go on (s1 and s2 are then taken)

  drewiecontrol.rotateBoth = (s1, s2, d1, d2, callback) => {
    console.log('--------------------  drewiecontrol.rotateBoth: ', s1, s2, d1, d2);
    var steps = Math.round(Math.max(s1, s2)); // use biggest number of steps
    var minsteps = Math.round(Math.min(s1, s2));

    if (isPi()) {
    } else {
      drewiecontrol.baseDelay = 0;
    }

    // the motor with the bigger step number always rotates and the one with the smaller rotates every (steps/minsteps)th time

    var a1 = 0; // counter for steps on motor 1
    var a2 = 0; // counter for steps on motor 2
    var stepped = 0;

    // TODO: integrate stepping based on A4988 library
    /*var doStep = function () {
            if (stepped < steps) {
                stepped++

            }else{
                if (callback != undefined) callback() 
            }
        }
        doStep() //executed once when drewiecontrol.rotateBoth is called
        */
    var doStep = function() {
      //if (!drewiecontrol.paused) {
      setTimeout(function() {
        console.log('stepped: ' + stepped + ' | steps: ' + steps);
        if (stepped < steps) {
          // this synchronizes movement between both motors
          stepped++;
          console.log('a1: ' + a1 + ' | a2: ' + a2);

          a1 += s1; // add steps to do to the counter
          if (a1 >= steps) {
            // rotates only if counter is bigger or equal biggest number of steps
            a1 -= steps; // subtract biggest number of steps from counter
            //drewiecontrol.makeStep(0,d1)   //do a step on motor
          }

          a2 += s2; // add steps to do to the counter
          if (a2 >= steps) {
            // rotates only if counter is bigger or equal biggest number of steps
            a2 -= steps; // subtract biggest number of steps from counter
            //drewiecontrol.makeStep(1,d2) //do a step on motor
          }

          doStep();
        } else {
          console.log('-------------------- drewiecontrol.rotateBoth done!');
          if (callback != undefined) callback();
        }
      }, drewiecontrol.baseDelay);
      //} else {
      // paused!
      //console.log('paused!')
      //drewiecontrol.paused = false
      //}
    };
    doStep();
  };

  // drewiecontrol.rotate is only used for manual positioning via gui
  drewiecontrol.rotate = (motorIndex, dirIndex, delay, steps, callback) => {
    console.log('drewiecontrol.rotate', motorIndex, dirIndex, delay, steps);
    drewiecontrol.stepCounts[motorIndex] = Math.round(steps);
    drewiecontrol.steppeds[motorIndex] = 0;
    // var dir = (dirIndex==1) ? 0 : 1// reverses direction

    // doStep, then wait for delay d
    var doStep = function(d, m) {
      drewiecontrol.makeStep(m, dirIndex); // changed to dirIndex from dir
      drewiecontrol.steppeds[m]++;
      if (drewiecontrol.steppeds[m] < drewiecontrol.stepCounts[m]) {
        setTimeout(function() {
          // console.log(m, drewiecontrol.steppeds[m], "/", drewiecontrol.stepCounts[m], d*drewiecontrol.steppeds[m], "/", drewiecontrol.stepCounts[m]*d)
          doStep(d, m);
        }, d);
      } else {
        // done
        if (callback != undefined) callback();
      }
    };
    doStep(delay, motorIndex); //executed once when drewiecontrol.rotate is called
  };

  //////////////////// END TODO: change this to a wave function with pigpio

  /////////////////////////////////
  // DRAWING METHODS

  drewiecontrol.moveRelative = (x, y, callback, penDir = 1) => {
    console.log('---------- drewiecontrol.moveRelative', x, y, ' ----------');
    var tox = Number(drewiecontrol.pos.x) + Number(x);
    var toy = Number(drewiecontrol.pos.y) + Number(y);
    drewiecontrol.moveTo(Number(tox), Number(toy), callback, 1);
  };

  drewiecontrol.moveTo = (x, y, callback, penDir = 1) => {
    var x = Math.round(x);
    var y = Math.round(y);

    //console.log('---------- drewiecontrol.moveTo', x, y, ' ----------')
    if (x == 0 && y == 0) {
      console.log('-------> homing <-------');
    }
    // convert x,y to l1,l2 (ideal, precise string lengths)
    // L1 = Math.sqrt( Math.pow(y,2) + Math.pow(x+d/2, 2));
    // L2 = Math.sqrt( Math.pow(y,2) + Math.pow(x-d/2, 2));

    // Inverse kinematics
    // L1 = Math.sqrt(X² + Y²)
    // L2 = Math.sqrt((d - X)² + Y²)

    var X = Math.round(x + drewiecontrol.startPos.x);
    var Y = Math.round(y + drewiecontrol.startPos.y);

    var X2 = X * X;
    var Y2 = Y * Y;

    var DsubX = drewiecontrol._D - X;
    var DsubX2 = DsubX * DsubX;

    L1 = Math.sqrt(X2 + Y2);
    L2 = Math.sqrt(DsubX2 + Y2);

    // console.log('L:',L1,L2)

    // convert string lengths to motor steps (float to int)

    var s1 = Math.round(L1 * drewiecontrol.stepsPerMM[0]);
    var s2 = Math.round(L2 * drewiecontrol.stepsPerMM[1]);

    // console.log('s:',s1,s2)
    // console.log('drewiecontrol.currentSteps:',drewiecontrol.currentSteps[0],drewiecontrol.currentSteps[1])

    // get difference between target steps and current steps (+/- int)
    var sd1 = s1 - drewiecontrol.currentSteps[0];
    var sd2 = s2 - drewiecontrol.currentSteps[1];
    // console.log('sd:',sd1,sd2)

    // get directions from steps difference
    var sdir1 = sd1 > 0 ? 0 : 1;
    var sdir2 = sd2 > 0 ? 1 : 0;
    // console.log('sdir:',sdir1,sdir2)

    // get steps with absolute value of steps difference
    var ssteps1 = Math.abs(sd1);
    var ssteps2 = Math.abs(sd2);
    // console.log('ssteps:',ssteps1,ssteps2)

    // convert step differences to degree movement
    //var deg1 = (ssteps1 * 0.225).toFixed(2);
    //var deg2 = (ssteps2 * 0.225).toFixed(2);
    //var degdir1 = (sd1 > 0) ? "-" : "+"
    //var degdir2 = (sd2 > 0) ? "+" : "-"

    //console.log("Degrees Rotate | l: "+degdir1+""+deg1+" | r: "+degdir2+""+deg2);

    function doRotation() {
      // do the rotation!
      drewiecontrol.rotateBoth(ssteps1, ssteps2, sdir1, sdir2, callback);

      // store new current steps
      drewiecontrol.currentSteps[0] = s1;
      drewiecontrol.currentSteps[1] = s2;

      // store new drewiecontrol.pos
      drewiecontrol.pos.x = x;
      drewiecontrol.pos.y = y;
    }
    doRotation();
  };

  drewiecontrol.lineTo = (x, y, callback) => {
    drewiecontrol.moveTo(Number(x), Number(y), callback, 0); // 0 makes drewiecontrol.moveTo happen with pen down instead of up
  };

  drewiecontrol.addPath = pathString => {
    console.log('drewiecontrol.addPath');
    drewiecontrol.paths.push(pathString);
    console.log('pathcount: ', drewiecontrol.paths.length);
    if (drewiecontrol.paths.length == 1 && drewiecontrol.drawingPath == false) {
      drewiecontrol.drawNextPath();
    }
  };

  drewiecontrol.pause = () => {
    //drewiecontrol.paused = !(drewiecontrol.paused != false)
    console.log('stopped: ', drewiecontrol.paused);

    var cmdCount = cmdIndex;
  };

  drewiecontrol.clearcanvas = () => {
    // Todo stopping, moving to home position and clearing input
    drewiecontrol.penThen(1, function() {
      // 0=down, 1=up
      console.log('Homing and Clearing...');
    });
  };

  drewiecontrol.reboot = () => {
    if (isPi()) {
      // Todo reboot Pi
      console.log('Reboot pressed -> rebooting RPI ');
    } else {
      console.log('Reboot pressed -> NOT rebooting PC');
    }
  };

  drewiecontrol.drawNextPath = () => {
    if (drewiecontrol.paths.length > 0) {
      drewiecontrol.drawPath(drewiecontrol.paths.shift());
    } else {
      console.log('Done drawing all the paths. :)');
    }
  };

  drewiecontrol.drawPath = pathString => {
    drewiecontrol.drawingPath = true;

    console.log('generating path...');
    var drawingScale = config.drawingScale / 100;
    console.log('drawingScale: ' + drawingScale);
    if (drawingScale != 1) {
      //var transformed = svgpath(pathString).scale(drawingScale).round().toString();
      var transformed = svgpath(pathString)
        .scale(drawingScale)
        .toString();
    } else {
      var transformed = pathString;
    }

    var commands = parseSVG(transformed);
    //var commands = parseSVG(pathString);
    makeAbsolute(commands);
    var cmdCount = commands.length;
    //console.log(cmdCount)
    console.log(commands);

    console.log('drawing path...');
    var cmdIndex = 0;
    var prevCmd;

    // TODO check if number is not negative or out of drawing bounds for safety reasons
    function checkValue(value) {
      return value;
    }

    function doCommand() {
      if (cmdIndex < cmdCount) {
        var cmd = commands[cmdIndex];
        var cmdCode = cmd.code;

        //console.log("Command-index: " + cmdIndex);
        //console.log("Command-count: " + cmdCount);
        drawingScale = config.drawingScale / 100;
        //console.log("Drawing-scale: " + drawingScale);
        //var myx = checkValue(cmd.x);
        //var myy = checkValue(cmd.y);

        cmdIndex++;
        var percentage = Math.round((cmdIndex / cmdCount) * 100);
        //console.log("command"+cmd)
        //console.log(percentage + '%')
        if (drewiecontrol.client)
          drewiecontrol.client.emit('progressUpdate', {
            botID: drewiecontrol._BOT_ID,
            percentage: percentage,
          });
        if (drewiecontrol.localio)
          drewiecontrol.localio.emit('progressUpdate', {
            percentage: percentage,
          });

        if (drewiecontrol.localio)
          drewiecontrol.localio.emit('progressDraw', {
            cmd: cmdCode,
            x: checkValue(Number(cmd.x)),
            y: checkValue(Number(cmd.y)),
            x0: checkValue(Number(cmd.x0)),
            y0: checkValue(Number(cmd.y0)),
            x1: checkValue(Number(cmd.x1)),
            y1: checkValue(Number(cmd.y1)),
            x2: checkValue(Number(cmd.x2)),
            y2: checkValue(Number(cmd.y2)),
            pen: Number(drewiecontrol.penPos),
          });

        switch (cmdCode) {
          case 'M':
            // absolute move
            tox = checkValue(Number(cmd.x));
            toy = checkValue(Number(cmd.y));
            drewiecontrol.penThen(1, function() {
              // 0=down, 1=up
              drewiecontrol.moveTo(Number(tox), Number(toy), doCommand);
            });
            break;
          case 'L':
            // absolute line
            tox = checkValue(Number(cmd.x));
            toy = checkValue(Number(cmd.y));
            drewiecontrol.penThen(0, function() {
              // 0=down, 1=up
              drewiecontrol.lineTo(Number(tox), Number(toy), doCommand);
            });
            break;
          case 'H':
            // absolute horizontal line
            tox = checkValue(Number(cmd.x));
            drewiecontrol.penThen(0, function() {
              // 0=down, 1=up
              drewiecontrol.lineTo(Number(tox), Number(toy), doCommand);
            });
            break;
          case 'V':
            // absolute vertical line
            toy = checkValue(Number(cmd.y));
            drewiecontrol.penThen(0, function() {
              // 0=down, 1=up
              drewiecontrol.lineTo(Number(tox), Number(toy), doCommand);
            });
            break;
          case 'C':
            // absolute cubic bezier curve
            drewiecontrol.penThen(0, function() {
              // 0=down, 1=up
              drewiecontrol.drawCubicBezier(
                // [{x:tox,y:toy}, {x:cmd.x1,y:cmd.y1}, {x:cmd.x2,y:cmd.y2}, {x:cmd.x,y:cmd.y}],
                // 0.01,
                [
                  [tox, toy],
                  [checkValue(cmd.x1), checkValue(cmd.y1)],
                  [checkValue(cmd.x2), checkValue(cmd.y2)],
                  [checkValue(cmd.x), checkValue(cmd.y)],
                ],
                1,
                doCommand
              );
            });
            break;
          case 'S':
            // absolute smooth cubic bezier curve

            // check to see if previous command was a C or S
            // if not, the inferred control point is assumed to be equal to the start curve's start point
            var inf;
            if (prevCmd.command.indexOf('curveto') < 0) {
              inf = {
                x: tox,
                y: toy,
              };
            } else {
              // get absolute x2 and y2 values from previous command if previous command was relative
              if (prevCmd.relative) {
                prevCmd.x2 = drewiecontrol.pos.x - prevCmd.x + prevCmd.x2;
                prevCmd.y2 = drewiecontrol.pos.y - prevCmd.y + prevCmd.y2;
              }
              // calculate inferred control point from previous commands
              // reflection of x2,y2 of previous commands
              inf = {
                x: tox + (tox - prevCmd.x2), // make prevCmd.x2 and y2 values absolute, not relative for calculation
                y: toy + (toy - prevCmd.y2),
              };
            }

            // draw it!
            var pts = [
              [tox, toy],
              [inf.x, inf.y],
              [cmd.x2, cmd.y2],
              [cmd.x, cmd.y],
            ];
            console.log('calculated points:', pts);
            drewiecontrol.penThen(0, function() {
              // 0=down, 1=up
              drewiecontrol.drawCubicBezier(pts, 1, doCommand);
            });
            break;
          case 'Q':
            // absolute quadratic bezier curve
            drewiecontrol.penThen(0, function() {
              // 0=down, 1=up
              drewiecontrol.drawQuadraticBezier(
                [
                  [tox, toy],
                  [checkValue(cmd.x1), checkValue(cmd.y1)],
                  [checkValue(cmd.x), checkValue(cmd.y)],
                ],
                1,
                doCommand
              );
            });
            break;
          case 'T':
            // absolute smooth quadratic bezier curve

            // check to see if previous command was a C or S
            // if not, the inferred control point is assumed to be equal to the start curve's start point
            var inf;
            if (prevCmd.command.indexOf('curveto') < 0) {
              inf = {
                x: tox,
                y: toy,
              };
            } else {
              // get absolute x1 and y1 values from previous command if previous command was relative
              if (prevCmd.relative) {
                prevCmd.x1 = drewiecontrol.pos.x - prevCmd.x + prevCmd.x1;
                prevCmd.y1 = drewiecontrol.pos.y - prevCmd.y + prevCmd.y1;
              }
              // calculate inferred control point from previous commands
              // reflection of x1,y1 of previous commands
              inf = {
                x: tox + (tox - prevCmd.x1),
                y: toy + (toy - prevCmd.y1),
              };
            }

            // draw it!
            drewiecontrol.penThen(0, function() {
              // 0=down, 1=up
              drewiecontrol.drawQuadraticBezier(
                [
                  [tox, toy],
                  [inf.x, inf.y],
                  [cmd.x, cmd.y],
                ],
                1,
                doCommand
              );
            });
            break;
          case 'A':
            // absolute arc

            // convert arc to cubic bezier curves
            var curves = arcToBezier({
              px: tox,
              py: toy,
              cx: cmd.x,
              cy: cmd.y,
              rx: cmd.rx,
              ry: cmd.ry,
              xAxisRotation: cmd.xAxisRotation,
              largeArcFlag: cmd.largeArc,
              sweepFlag: cmd.sweep,
            });
            console.log(curves);

            // draw the arc
            drewiecontrol.penThen(0, function() {
              // 0=down, 1=up
              drewiecontrol.drawArc(curves, doCommand);
            });
            break;
          case 'Z':
            tox = checkValue(Number(cmd.x));
            toy = checkValue(Number(cmd.y));
            drewiecontrol.penThen(0, function() {
              // 0=down, 1=up
              drewiecontrol.lineTo(tox, toy, doCommand);
            });
            break;
        }

        prevCmd = cmd;
      } else {
        drewiecontrol.penThen(1, function() {
          // 0=down, 1=up
          cmdCount = 0;
          cmdIndex = 0;
          console.log('path done!');
          drewiecontrol.drawingPath = false;
          drewiecontrol.drawNextPath();
        });
      }
    }
    doCommand();
  };

  drewiecontrol.drawArc = (curves, callback) => {
    var n = 0;
    var cCount = curves.length;
    function doCommand() {
      if (n < cCount) {
        var crv = curves[n];
        // draw the cubic bezier curve created from arc input
        drewiecontrol.drawCubicBezier(
          [
            [drewiecontrol.pos.x, drewiecontrol.pos.y],
            [crv.x1, crv.y1],
            [crv.x2, crv.y2],
            [crv.x, crv.y],
          ],
          1,
          doCommand
        );
        n++;
      } else {
        if (callback != undefined) callback();
      }
    }
    doCommand();
  };

  drewiecontrol.drawCubicBezier = (points, scale = 1, callback) => {
    var n = 0; // curret bezier step in iteration
    var pts = cBezier(points[0], points[1], points[2], points[3], scale);
    var ptCount = pts.length;
    function doCommand() {
      if (n < ptCount) {
        var pt = pts[n];
        drewiecontrol.lineTo(Number(pt[0]), Number(pt[1]), doCommand);
        n++;
      } else {
        // console.log('bezier done!')
        if (callback != undefined) callback();
      }
    }
    doCommand();
  };
  drewiecontrol.drawQuadraticBezier = (points, scale = 1, callback) => {
    var n = 0; // curret bezier step in iteration
    var pts = qBezier(points[0], points[1], points[2], scale);
    var ptCount = pts.length;
    function doCommand() {
      if (n < ptCount) {
        var pt = pts[n];
        drewiecontrol.lineTo(Number(pt[0]), Number(pt[1]), doCommand);
        n++;
      } else {
        // console.log('bezier done!')
        if (callback != undefined) callback();
      }
    }
    doCommand();
  };

  return drewiecontrol;
};
module.exports = config => BotController(config);
console.log(`
  __
 /\\ \\                           __
 \\_\\ \\  _ __    __   __  __  __/\\_\\     __
 /'_\` \\/\\\`'__\\/'__\`\\/\\ \\/\\ \\/\\ \\/\\ \\  /'__\`\\
/\\ \\L\\ \\ \\ \\//\\  __/\\ \\ \\_/ \\_/ \\ \\ \\/\\  __/
\\ \\___,_\\ \\_\\\\ \\____\\\\ \\___x___/'\\ \\_\\ \\____\\
 \\/__,_ /\\/_/ \\/____/ \\/__//__/   \\/_/\\/____/
`);
