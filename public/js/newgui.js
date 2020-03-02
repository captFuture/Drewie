// drag and drop
function ParseXML(val) {
    if (window.DOMParser) {
      parser = new DOMParser();
      xmlDoc = parser.parseFromString(val, 'text/xml');
    }
    return xmlDoc;
  }
  
  let dropTarget = document.querySelector('#droptarget');
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
  