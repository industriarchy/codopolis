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
var mapSet = false;
let previousTick = Date.now();
let actualTicks = 0;
const tickLengthMs = 1000 / 30;
let gameWon = {won: false};

$( function() {
  c = document.getElementById("theView");
  ctx = c.getContext("2d");
  render.setCtx(ctx);
  model.dude.src = '/static/images/still.png';
  model.fDude.src = '/static/images/stillF.png';
  model.creeps.dog = new Image();
  model.creeps.dog.src = '/static/images/dog.png';
  model.id = docCookies.getItem('userId');
  document.getElementById('user').innerHTML = model.id;
  initiateSocket();

  actions.assignListeners(c).then( () => {
    listenSocket();
    socket.on('message', (msg) => {
      console.log('mesage', msg);
    })
    gameLoop();
  });
});

const gameLoop = () => {
  let now = Date.now();
  if (previousTick + tickLengthMs <= now) {
    let delta = (now - previousTick);
    previousTick = now;
    update(delta);
    actualTicks = 0;
  }
  setTimeout(gameLoop, 0);
};

const update = (delta) => {
  if (gameWon.won) {
    render.gameWon(gameWon);
  }
  else {
    // Collect Data and render collected Data
    actions.performActions(delta);
    render.render(outsideData);
    // Detect Drain Flags
    actions.detectFlag();
  }
}

function initiateSocket() {
  var data = { unit: {id: model.id, ll: model.flipped, newX: model.X, newY: model.Y,
    missles: actions.missles, alive: true, build: actions.build, drainFlag: actions.drainFlag},
    mapSet: mapSet };
  socket.emit('appData', data);
}

function listenSocket() {
  socket.on('appData', function(msg){
    // determine if timeout
    if(msg.idle > 30) {
      console.log("idle", msg.idle);
      render.renderIdle();
    }
    else {

      // determine if game is won
      if (msg.win && msg.win.won) {
        gameWon = msg.win;
        // render.gameWon(msg.win);
      }
      else {
        gameWon.won = false;
        // Process AI
        model.ai = msg.ai;
        // debugger;
        actions.proccessAI();
        // Emit your actions data
        var data = { unit: {id: model.id, ll: model.flipped, newX: model.X, newY: model.Y,
           missles: actions.missles, alive: true, build: actions.build, drainFlag: actions.drainFlag},
           ai: aiToSend(), mapSet: mapSet };
        socket.emit('appData', data);

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

          // update the units and missles in the model
          model.units = msg.units;
          model.missles = msg.missles;

          if(msg.units[model.id] && msg.units[model.id].resetLoc) {
            model.needsReset = true;
          }
        }

        // Update Flags
        updateFlags(msg.flags);
      }
    }
  });
}

function updateFlags(flags) {
  model.flags = flags;
  flags.map( (flag, i) => {
    model.MAP[flag.x][flag.y].h = flag.health;
    model.MAP[flag.x][flag.y].o = flag.owner;
  });
}

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
      console.log("reset location");
      model.needsReset = false;
    }
  }
}

function clearData() {
  actions.missles = {};
  actions.build.type = 0;
  actions.drainFlag = {};
}

const aiToSend = () => {
  return model.pets.map( pet => {
    return {id: pet._id, ll: pet.ll, newX: pet.x, newY: pet.y, attack: pet.attack, alive: true};
  });
};
