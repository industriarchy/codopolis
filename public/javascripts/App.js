// -----------------------------------------------------------------------------
// ============================== SETUP ========================================
// -----------------------------------------------------------------------------

var docCookies = require('./cookies');
var utils = require('./utility');
var actions = require('./actions');
var model = require('./model');
var render = require('./render');

var c;
var ctx;
var socket = io();
var outsideData;
var hits = {};
var mapSet = false;
var resetWait = 0;

$( function() {

  c = document.getElementById("theView");
  actions.assignListeners(c);
  ctx = c.getContext("2d");
  render.setCtx(ctx);
  model.dude.src = '/static/images/still.png';
  model.fDude.src = '/static/images/stillF.png';
  model.id = docCookies.getItem('userId');

  socket.on('appData', function(msg){
    // Emit your actions data
    var data = { unit: {id: model.id, ll: model.flipped, up: actions.act.up, right: actions.act.right,
       missles: actions.missles, alive: true, build: actions.build}, mapSet: mapSet };
    socket.emit('appData', data);

    // Reset if dead
    if(msg.units[model.id].alive == false || resetWait > 1) {
      resetWait = 0;
      resetLoc();
    }
    resetWait++;

    if(model.needsReset) {
      resetLoc();
    }

    // Set map
    if(msg.units != null) {
      if(msg.setMap) {
        model.MAP = msg.map;
        mapSet = true;
        model.columns = model.MAP.length;
        model.rows = model.MAP[0].length;
      }

      // Collect Data and render collected Data
      clearData();
      outsideData = msg;
      render.render(outsideData);
    }
  });
});

function setMapPart(x1, y1, x2, y2, mapPart) {
  for(let i=0; i<(y2-y1); i++) {
    for(let j=0; j<(x2-x1); j++) {
      model.MAP[i+x1][j+y1] = mapPart[i][j];
    }
  }
}

function resetLoc() {
  if(outsideData != null) {
    if(outsideData.units[model.id] != null) {
      model.X = outsideData.units[model.id].x;
      model.Y = outsideData.units[model.id].y;
      model.needsReset = false;
    }
  }
}

function clearData() {
  actions.missles = {};
  actions.build.type = 0;
}
