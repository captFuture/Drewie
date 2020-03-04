// initial variables
var stepMultiplier;

// button and page handling
var settingsPage = document.querySelector('#view_settings');
var movePage = document.querySelector('#view_move');
var progressPage = document.querySelector('#view_progress');
var settingsAside = document.querySelector('#aside_settings');
var moveAside = document.querySelector('#aside_move');


var folderButton = document.querySelector('#button_folder');
var settingsButton = document.querySelector('#button_settings');
var moveButton = document.querySelector('#button_move');
var progressButton = document.querySelector('#button_progress');
var cancelButton = document.querySelector('#button_cancel');
var mainNavigation = document.querySelectorAll("#mainNavigation > button");

var multiplierOneButton = document.querySelector('#button_multiplier_one');
var multiplierTenButton = document.querySelector('#button_multiplier_ten');
var multiplierOnehundredButton = document.querySelector('#button_multiplier_onehundred');
var penButton = document.querySelector('#button_pen');

var homeButton = document.querySelector('#button_arrow_home');
var leftButton = document.querySelector('#button_arrowe_left');
var rightButton = document.querySelector('#button_arrow_right');
var upButton = document.querySelector('#button_arrow_up');
var downButton = document.querySelector('#button_arrow_down');


homeButton.addEventListener('click', function(e) {
  var data = { x: 0, y: 0 };
  socket.emit('moveto', data);
});

penButton.addEventListener('click', function(e) {
    togglePen();
});

settingsButton.addEventListener('click', function(e) {
    toggleActiveState(settingsButton);
    toggleSettings();
});
moveButton.addEventListener('click', function(e) {
  toggleActiveState(moveButton);
  toggleMove();
});
progressButton.addEventListener('click', function(e) {
  toggleActiveState(progressButton);
  toggleProgress();
});

multiplierTenButton.addEventListener('click', function(e) {
  toggleMultiplier(10);
});
multiplierOneButton.addEventListener('click', function(e) {
  toggleMultiplier(1);
});
multiplierOnehundredButton.addEventListener('click', function(e) {
  toggleMultiplier(100);
});

function toggleSettings() {
  settingsPage.classList.add('on');
  movePage.classList.remove('on');
  progressPage.classList.remove('on');

  settingsAside.classList.add('on');
  moveAside.classList.remove('on');
}

function toggleMove() {
    settingsPage.classList.remove('on');
    movePage.classList.add('on');
    progressPage.classList.remove('on');

    settingsAside.classList.remove('on');
    moveAside.classList.add('on');
}
  
function toggleProgress() {
    settingsPage.classList.remove('on');
    movePage.classList.remove('on');
    progressPage.classList.add('on');

    settingsAside.classList.remove('on');
    moveAside.classList.remove('on');
}

function toggleActiveState(button){
  mainNavigation.forEach(function(item) {
    item.classList.remove('active');
  });
  button.classList.add('active');
}

function toggleMultiplier(amount = 1){
    //console.log(amount)
    stepMultiplier = amount;
    switch (amount){
      case 1:
        multiplierOneButton.classList.add("act");
        multiplierTenButton.classList.remove("act");
        multiplierOnehundredButton.classList.remove("act");
        stepMultiplier = amount;
        break;

      case 10:
        multiplierOneButton.classList.remove("act");
        multiplierTenButton.classList.add("act");
        multiplierOnehundredButton.classList.remove("act");
        break;

      case 100:
        multiplierOneButton.classList.remove("act");
        multiplierTenButton.classList.remove("act");
        multiplierOnehundredButton.classList.add("act");
        break;

      default:
        multiplierOneButton.classList.add("act");
        multiplierTenButton.classList.remove("act");
        multiplierOnehundredButton.classList.remove("act");
        break;
    }
}

function togglePen(){
  console.log("pen");
  penz = !penz; // swap pen position
  var data = {
    up: penz,
  };
  socket.emit('pen', data);

}

function init(){
  toggleMultiplier(10);
  toggleActiveState(moveButton);
}

window.onload = function() {
  init();
};

//socket functions
const ws = new WebSocket(`ws://${location.host}`);

let callbacks = {};
const socket = {
  on: (eventName, callback) => (callbacks[eventName] = callback),
  emit: (topic, payload = null) => ws.send(JSON.stringify({ topic, payload })),
};

ws.onmessage = ({ data }) => {
  try {
    
    const { topic, payload } = JSON.parse(data);
    callbacks[topic](payload);
  } catch (e) {
    console.error(e);
    console.log(data);
  }
};

ws.onopen = () => {
  socket.emit('getDXY');
};

var connectionIndicator = document.querySelector('#button_stop');
var penz = 0;

let pads = document.querySelectorAll('.item');
for (var i = 0; i < pads.length; i++) {
  //console.log(pads[i])
  let pad = pads[i];
  pad.addEventListener('click', handleTouch);
}

function handleTouch(e) {
  e.preventDefault();
  var data = this.dataset;
  data.steps = stepMultiplier;
  data.d = 2;
  console.log(data);
  socket.emit('r', data);
  console.log(data);
}


socket.on('penState', function(data) {
  //console.log("MyPen:"+data);
  switch (data) {
    case 0:
      // pen is down
      penButton.classList.remove('up');
      penButton.classList.add('down');
      break;

    case 1:
      // pen is up
      penButton.classList.remove('down');
      penButton.classList.add('up');
      break;
  }
});

socket.on('DXY', function(data) {
  console.log('DXY', data)
  dfield.value = data.d;
  xfield.value = data.x;
  yfield.value = data.y;
  drawingScale.value = data.s;
});

socket.on('botConnect', function(data) {
  botConnectHandler();
});
socket.on('botDisconnect', function(data) {
  botDisconnectHandler();
});
socket.on('botConnectionStatus', function(connected) {
  if (connected) {
    botConnectHandler();
  } else {
    botDisconnectHandler();
  }
});

function botConnectHandler() {
  //rebootButton.classList.remove('fa-spin')
  connectionIndicator.classList.remove('disconnected');
  connectionIndicator.classList.remove('rebooting');
  connectionIndicator.classList.add('connected');
}
function botDisconnectHandler() {
  connectionIndicator.classList.remove('rebooting');
  connectionIndicator.classList.remove('connected');
  connectionIndicator.classList.add('disconnected');
}

// drag and drop
function ParseXML(val) {
  if (window.DOMParser) {
    parser = new DOMParser();
    xmlDoc = parser.parseFromString(val, 'text/xml');
  }
  return xmlDoc;
}

let dropTarget = document.querySelector('#view_move');

dropTarget.ondragover = function() {
  this.classList.add('dragover');
  return false;
};

dropTarget.ondragend = function() {
  this.classList.remove('dragover');
  return false;
};

dropTarget.ondrop = function(e) {
  this.classList.remove('dragover');
  e.preventDefault();

  console.log('dropped!');
  var file = e.dataTransfer.files[0];
  console.log(file);

  var origcanvas = document.getElementById('originCanvas');
  var origctx = origcanvas.getContext('2d');

  var reader = new FileReader();
  reader.onload = function(evt) {
    var svgPath = evt.target.result;
    console.log(svgPath);
    origctx.drawSvg(svgPath, 0, 0, 480, 600);

    var data = {
      content: svgPath,
    };
    socket.emit('drawart', data);
  };
  reader.readAsText(file);
  return false;
};