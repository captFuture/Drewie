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
    this.className = 'dragover';
    return false;
  };
  dropTarget.ondragend = function() {
    this.className = '';
    return false;
  };
  dropTarget.ondrop = function(e) {
    this.className = '';
    e.preventDefault();
  
    console.log('dropped!');
    var file = e.dataTransfer.files[0];
    //console.log(file);
  
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


// button and page handling

var settingsPage = document.querySelector('#view_settings');
var movePage = document.querySelector('#view_move');
var progressPage = document.querySelector('#view_progress');

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

penButton.addEventListener('click', function(e) {
    togglePen();
});

settingsButton.addEventListener('click', function(e) {
    toggleActiveState(settingsButton);
    toggleSettings(e);
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
}

function toggleMove() {
    settingsPage.classList.remove('on');
    movePage.classList.add('on');
    progressPage.classList.remove('on');
}
  
function toggleProgress() {
    settingsPage.classList.remove('on');
    movePage.classList.remove('on');
    progressPage.classList.add('on');
}

function toggleActiveState(button){
  //console.log(button);
  mainNavigation.forEach(function(item) {
    //console.log(item);
    item.classList.remove('active');
  });
  button.classList.add('active');
}

function toggleMultiplier(amount = 1){
    console.log(amount)
    switch (amount){
      case 1:
        multiplierOneButton.classList.add("act");
        multiplierTenButton.classList.remove("act");
        multiplierOnehundredButton.classList.remove("act");
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
  console.log("pen")
}

function init(){
  //console.log(mainNavigation);
  toggleMultiplier(10);
  toggleActiveState(moveButton);
}

window.onload = function() {
  init();
};