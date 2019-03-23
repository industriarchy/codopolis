(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{"./actions":2,"./cookies":3,"./model":4,"./render":5,"./utility":6}],2:[function(require,module,exports){
// -----------------------------------------------------------------------------
// ============================== ACTIONS ======================================
// -----------------------------------------------------------------------------

var utils = require('./utility');
var model = require('./model');
var docCookies = require('./cookies');
const functions = require('../../shared/functions.js');
const CONSTANTS = require('../../shared/constants.js');

var mouse;
var sX, sY, eX, eY;
var socket = io();

function goUp() {
  actions.act.up = model.s;
};

function goDown() {
  actions.act.up = -model.s;
};

function goLeft() {
  actions.act.right = -model.s;
};

function goRight() {
  actions.act.right = model.s;
};

function initiateDrag(e) {
  sX = e.changedTouches[0].pageX;
  sY = e.changedTouches[0].pageY;
  if(sX > 500 && sX < 600 && sY > 450 && sY < 550) {
    pointing = true;
    eX = sX;
    eY = sY;
    sX = 550;
    sY = 500;
  }
};

function endDrag(e) {
  pointing = false;
  actions.act.up = 0;
  actions.act.right = 0;
};

function dragging(e) {
  if(pointing) {
    eX = e.changedTouches[0].pageX;
    eY = e.changedTouches[0].pageY;
    let vec = utils.unit(sX, sY, eX, eY);
    actions.act.up = -(vec.y * model.s);
    actions.act.right = vec.x * model.s;
  }
};

function shoot(x2, y2) {
  diff = utils.unit(550, 400, x2, y2);
  let i=0;
  let aMissle = {
   curX: model.X+50,
   curY: model.Y+50,
   dX: diff.x * CONSTANTS.MISSLESPEED,
   dY: diff.y * CONSTANTS.MISSLESPEED,
   dist: 0,
   type: "A",
   shooting: true
  };
 if(actions.missles[0] == undefined) {
   actions.missles[0] = aMissle;
  }
};

function aiShoot(ai, x2, y2) {
  diff = utils.unit(ai.x, ai.y, x2, y2);
  let i=0;
  let aMissle = {
   curX: ai.x+50,
   curY: ai.y+50,
   dX: diff.x * CONSTANTS.MISSLESPEED,
   dY: diff.y * CONSTANTS.MISSLESPEED,
   dist: 0,
   type: "A",
   shooting: true
  };
 if(ai.missles == undefined) {
   ai.missles = {};
   ai.missles[0] = aMissle;
  }
};

function placeFence(x, y) {
  x = x-500 + model.X;
  y = y-350 + model.Y;
  let offSX = 100 - model.X%100 + model.X - 500;
  let offSY = 100 - model.Y%100 + model.Y - 350;
  let building = false;
  if(insideBlock(x, y, 600+offSX, 700+offSX, 350+offSY, 450+offSY)) {
    building = true;
  }
  if(insideBlock(x, y, 600+offSX, 700+offSX, 250+offSY, 350+offSY)) {
    building = true;
  }
  if(insideBlock(x, y, 300+offSX, 400+offSX, 350+offSY, 450+offSY)) {
    building = true;
  }
  if(insideBlock(x, y, 300+offSX, 400+offSX, 250+offSY, 350+offSY)) {
    building = true;
  }
  if(insideBlock(x, y, 400+offSX, 500+offSX, 150+offSY, 250+offSY)) {
    building = true;
  }
  if(insideBlock(x, y, 500+offSX, 600+offSX, 150+offSY, 250+offSY)) {
    building = true;
  }
  if(insideBlock(x, y, 400+offSX, 500+offSX, 450+offSY, 550+offSY)) {
    building = true;
  }
  if(insideBlock(x, y, 500+offSX, 600+offSX, 450+offSY, 550+offSY)) {
    building = true;
  }
  if(building) {
    let fence = {
      player: 1,
      health: 50,
      type: 1
    }
    actions.build = {type: fence, x: parseInt(x/100), y: parseInt(y/100)};
  }
}

function insideBlock(x, y, x1, x2, y1, y2) {
  // console.log(x, y, x1, x2, y1, y2);
  if(x > x1 && x < x2 &&
    y > y1 && y < y2) {
    return true; }
  else { return false; }
}

function detectFlag() {
  model.flags.forEach( (flag, i) => {
    if(utils.dist(model.X+50, model.Y+80, flag.x*100+50, flag.y*100+50) < 60) {
      if(model.flags[i].health < 1)
        model.flags[i].owner = docCookies.getItem('userId');
      if(model.flags[i].owner == docCookies.getItem('userId')) {
        model.flags[i].health++;
      }
      else {
        model.flags[i].health--;
      }
      actions.drainFlag = { flag: model.flags[i], id: i};
    }
  });
}

function performActions(delta) {
  let percentage = delta / model.p;
  let beforeX = model.X;
  let dX = actions.act.right * percentage;
  let dY = actions.act.up * percentage;
  if(actions.act.right != 0) {
    if(functions.canGo(model.X + dX, model.Y, 20, 80, model.MAP)) {
      model.X += dX;
    }
  }
  if(actions.act.up != 0) {
    if(functions.canGo(beforeX, model.Y - dY, 20, 80, model.MAP)) {
      model.Y -= dY
    }
  }
  if(actions.act.right < 0) {
    model.flipped = true;
  }
  if(actions.act.right > 0) {
    model.flipped = false;
  }
  // Move  missles
  processMissles(percentage);
};


function processMissles(percentage) {
  model.missles = functions.processMissles(model.missles, model.MAP, percentage);
}

// Logout function
function logout() {
  $.ajax({
      type: 'POST',
      url: '/users/logout',
      dataType: 'JSON'
  }).done(function( response ) {
      location.reload();
  });
}

const assignCode = (e) => {
  let code = document.getElementById('code').value;
  let id = document.getElementById('petSelect').value;
  let pet = model.pets.find((elem) => { return elem._id == id })
  if (pet) pet.code = code;
};

const processAI = () => {
  if (model.pets.length < 1) {
    findPets();
  }
  else {
    model.pets.forEach( (pet) => {
      updatePet(pet);
      if (pet.code) {
        eval(pet.code);
      }
    })
  }
};

const findPets = () => {
  if (model.ai) {
    let ids = Object.keys(model.ai);
    ids.forEach( (id) => {
      if (model.ai[id].owner == model.id) {
        model.pets.push(model.ai[id]);
        addSelectOption(id);
      }
    });
  }
};

const updatePet = (pet) => {
  if(model.ai[pet._id]) {
    pet.x = model.ai[pet._id].x;
    pet.y = model.ai[pet._id].y;
    pet.health = model.ai[pet._id].health;
    pet.alive = model.ai[pet._id].alive;
  }
}

const addSelectOption = (option) => {
  document.getElementById('petSelect').innerHTML += '<option>' + option + '</option>';
};

const assignListeners = (c) => {
  return new Promise( function(resolve, reject) {
    document.getElementById('logout').addEventListener('click', logout);
    document.getElementById('assignCode').addEventListener('click', assignCode);
    c.addEventListener('click', (event) => {
      var clickX = event.offsetX;
      var clickY = event.offsetY;
      if(actions.placingF) {
        placeFence(clickX, clickY);
      }
      else {
        shoot(clickX, clickY);
      }
    });
    c.addEventListener('touchstart', (event) => {
      initiateDrag(event);
    });
    c.addEventListener('touchend', (event) => {
      endDrag(event);
    });
    c.addEventListener('touchmove', (event) => {
      dragging(event);
    });
    c.addEventListener('mousemove', (event) => {
      actions.mouse = event;
    });
    document.addEventListener('keydown', (event) => {
      const keyName = event.key;
      if(keyName == "w") {
        goUp();
      }
      if(keyName == "s") {
        goDown();
      }
      if(keyName == "d") {
        goRight();
      }
      if(keyName == "a") {
        goLeft();
      }
      if(keyName == "f") {
        actions.placingF = !actions.placingF;
      }
    });

    var a = document.addEventListener('keyup', (event) => {
      if(event.key == "w" || event.key == "s")
        actions.act.up = 0;
      if(event.key == "a" || event.key == "d")
        actions.act.right = 0;
    });
    resolve(a);
  });
};

// Export functions
var actions = {
  assignListeners: assignListeners,
  performActions: performActions,
  act: {                           // actions
    up: 0,
    right: 0,
    shoot: false
  },
  placingF: false,                 // actions
  missles: {},                    // actions
  mouse: {},                          // actions
  sX, sY, eX, eY,                   // actions
  build: {type: 0, x: 0, y: 0},    // actions
  drainFlag: {
    draing: false,
    x: 0, y: 0
  },
  detectFlag: detectFlag,
  drainFlag: {},
  aiActions: {},
  proccessAI: processAI
}

module.exports = actions;

},{"../../shared/constants.js":7,"../../shared/functions.js":8,"./cookies":3,"./model":4,"./utility":6}],3:[function(require,module,exports){
var docCookies = {
  getItem: function (name) {
    nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;  },
  parseMap: function(map) {
    var j = 0;
    var k = 0;
    for(var i=0; i < map.length; i++) {
      if(map[i] == '%') {
        // Detects a [
        if(map[i+1] == '5' && map[i+2] == 'B') {
          j++;
        }
        // Detects a comma
        if(map[i+1] == '2' && map[i+2] == 'C') {
          k++;
        }
      }
    }
    var columns = j-1;
    var rows = (k+1)/columns;
    j=0;
    k=0;
    var MAP = Array(columns).fill().map(() => Array(rows).fill(0));
    var depth = 0;
    for(var i=0; i < map.length; i++) {
      if(map[i] == '%') {
        // Detects a [
        if(map[i+1] == '5' && map[i+2] == 'B') {
          depth++;
        }
        // Detects a ]
        if(map[i+1] == '5' && map[i+2] == 'D') {
          if(i > 1 && depth > 1) {
            MAP[k][j] = map[i-1];
            k++;
            j=0;
          }
          depth--;
        }
        // Detects a comma
        if(map[i+1] == '2' && map[i+2] == 'C') {
          if(i > 1 && depth > 1) {
            MAP[k][j] = map[i-1];
            j++;
          }
        }
      }
    }
    return MAP;

  },
  setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    if (!sKey || /^(?:expires|max-age|path|domain|secure)$/i.test(sKey)) { return false; }
    var sExpires = "";
    if (vEnd) {
      switch (vEnd.constructor) {
        case Number:
        sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
        break;
        case String:
        sExpires = "; expires=" + vEnd;
        break;
        case Date:
        sExpires = "; expires=" + vEnd.toUTCString();
        break;
      }
    }
    document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
    return true;
  },
  removeItem: function (sKey, sPath, sDomain) {
    if (!sKey || !this.hasItem(sKey)) { return false; }
    document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + ( sDomain ? "; domain=" + sDomain : "") + ( sPath ? "; path=" + sPath : "");
    return true;
  },
  hasItem: function (sKey) {
    return (new RegExp("(?:^|;s*)" + encodeURIComponent(sKey).replace(/[-.+*]/g, "$&") + "s*=")).test(document.cookie);
  },
  keys: /* optional method: you can safely remove it! */ function () {
    var aKeys = document.cookie.replace(/((?:^|s*;)[^=]+)(?=;|$)|^s*|s*(?:=[^;]*)?(?:1|$)/g, "").split(/s*(?:=[^;]*)?;s*/);
    for (var nIdx = 0; nIdx < aKeys.length; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
      return aKeys;
  }
};

module.exports = docCookies;

},{}],4:[function(require,module,exports){
// -----------------------------------------------------------------------------
// ============================== MODEL ========================================
// -----------------------------------------------------------------------------

const vWidth = 1100;
const vHeight = 800;
let dude = new Image();
let fDude = new Image();

var model = {
  X: 500,
  Y: 350,
  s: 15,                 // Constant that defines the change in distance per action
  p: 90,                // Constant that defines period for the speed
  vWidth: vWidth,
  vHeight: vHeight,
  cX: (vWidth/2-50),
  cY: (vHeight/2-50),
  dude: dude,
  fDude: fDude,
  creeps: {},
  ai: {},
  pets: [],
  flipped: false,
  timeSet: Date.now(),    // unused?
  needsReset: true,
  MAP: [],
  columns: 0,
  rows: 0,
  unitWidth: 60,
  unitHeight: 100,
  id: 0,
  flags: [],
  units: {},
  missles: {}
}

module.exports = model;

},{}],5:[function(require,module,exports){
// -----------------------------------------------------------------------------
// ============================== RENDER =======================================
// -----------------------------------------------------------------------------

const model = require('./model');
const utils = require('./utility');
const actions = require('./actions');
const SharedConst = require('../../shared/constants.js');
let ctx;
let outsideData;

function renderIdle() {
  ctx.clearRect(0, 0, model.vWidth, model.vHeight);
  ctx.fillStyle = 'white';
  ctx.font = "30px Arial";
  ctx.fillText("Idled out, please refresh page",350,300);
};

function drawMap() {
  let x0 = 500-model.X;
  let y0 = 350-model.Y;
  var grd = ctx.createLinearGradient(0,0,200,0);

  // Draw the map Tiles for each level
  for(let l=0; l<5; l++) {

    // Draw the map Shadows
    for(let i=leftBound(); i<rightBound(); i++) {
      for(let j=topBound(); j<bottomBound(); j++) {
        if(model.MAP[i][j].l > 0 && model.MAP[i][j].l == l) {
          if(model.MAP[i][j].t == 6) {
            drawRampShadowY(i*100+x0, j*100+y0);
          }
          else {
            drawShadow(i*100+x0, j*100+y0);
          }
        }
        // else if(MAP[i][j].type == 4){
        //   drawShadow(i*100+x0, j*100+y0);
        // }
      }
    }

    for(let i=leftBound(); i<rightBound(); i++) {
      for(let j=topBound(); j<bottomBound(); j++) {
        if(model.MAP[i][j].l == l) {
          if(model.MAP[i][j].t == 0) {
            grassTile(i*100+x0,j*100+y0);
          }
          else if(model.MAP[i][j].t == 2){
            waterTile(i*100+x0,j*100+y0);
          }
          else if(model.MAP[i][j].t == 3){
            pathTile(i*100+x0,j*100+y0);
          }
          else if(model.MAP[i][j].t == 4){
            grassTile(i*100+x0,j*100+y0);
          }
          else if(model.MAP[i][j].t == 6){
            rampY(i*100+x0,j*100+y0);
          }
          else if(model.MAP[i][j].t == 7){
            waterTileb(i*100+x0,j*100+y0);
          }
        }
      }
    }
  }

  // Draw the map additions
  for(let i=leftBound(); i<rightBound(); i++) {
    for(let j=topBound(); j<bottomBound(); j++) {
      if(model.MAP[i][j].a == 1){
        flag(i*100+x0, j*100+y0, '#f00', model.MAP[i][j].h);
      }
      else if(model.MAP[i][j].a == 2){
        smallTree(i*100+x0, j*100+y0);
      }
      else if(model.MAP[i][j].a == 3) {
        wallTile(i*100+x0, j*100+y0);
      }
    }
  }

  if(actions.placingF) {
    highLightPotential();
  }
};

function highLightPotential() {
  let offSX = 100 - model.X%100;
  let offSY = 100 - model.Y%100;
  ctx.fillStyle = "red";
  if(mouseInside(600+offSX, 700+offSX, 350+offSY, 450+offSY)) {
    ctx.globalAlpha = 0.2;
    ctx.fillRect(610+offSX, 360+offSY, 80, 80);
    ctx.globalAlpha = 1.0; }
  if(mouseInside(600+offSX, 700+offSX, 250+offSY, 350+offSY)) {
    ctx.globalAlpha = 0.2;
    ctx.fillRect(610+offSX, 260+offSY, 80, 80);
    ctx.globalAlpha = 1.0; }
  if(mouseInside(300+offSX, 400+offSX, 350+offSY, 450+offSY)) {
    ctx.globalAlpha = 0.2;
    ctx.fillRect(310+offSX, 360+offSY, 80, 80);
    ctx.globalAlpha = 1.0; }
  if(mouseInside(300+offSX, 400+offSX, 250+offSY, 350+offSY)) {
    ctx.globalAlpha = 0.2;
    ctx.fillRect(310+offSX, 260+offSY, 80, 80);
    ctx.globalAlpha = 1.0; }
  if(mouseInside(400+offSX, 500+offSX, 150+offSY, 250+offSY)) {
    ctx.globalAlpha = 0.2;
    ctx.fillRect(410+offSX, 160+offSY, 80, 80);
    ctx.globalAlpha = 1.0; }
  if(mouseInside(500+offSX, 600+offSX, 150+offSY, 250+offSY)) {
    ctx.globalAlpha = 0.2;
    ctx.fillRect(510+offSX, 160+offSY, 80, 80);
    ctx.globalAlpha = 1.0; }
  if(mouseInside(400+offSX, 500+offSX, 450+offSY, 550+offSY)) {
    ctx.globalAlpha = 0.2;
    ctx.fillRect(410+offSX, 460+offSY, 80, 80);
    ctx.globalAlpha = 1.0; }
  if(mouseInside(500+offSX, 600+offSX, 450+offSY, 550+offSY)) {
    ctx.globalAlpha = 0.2;
    ctx.fillRect(510+offSX, 460+offSY, 80, 80);
    ctx.globalAlpha = 1.0; }
  ctx.rect(600+offSX, 350+offSY, 100, 100);
  ctx.rect(600+offSX, 250+offSY, 100, 100);
  ctx.rect(300+offSX, 350+offSY, 100, 100);
  ctx.rect(300+offSX, 250+offSY, 100, 100);
  ctx.rect(400+offSX, 150+offSY, 100, 100);
  ctx.rect(500+offSX, 150+offSY, 100, 100);
  ctx.rect(400+offSX, 450+offSY, 100, 100);
  ctx.rect(500+offSX, 450+offSY, 100, 100);
  ctx.strokeStyle = '#2255ff';
  ctx.stroke();
};

function mouseInside(x1, x2, y1, y2) {
  if(actions.mouse.offsetX > x1 && actions.mouse.offsetX < x2 &&
    actions.mouse.offsetY > y1 && actions.mouse.offsetY < y2) {
    return true; }
  else { return false; }
};

function grassTile(x, y) {
  ctx.fillStyle = '#5a2';
  ctx.fillRect(x-1,y-1,101, 101);
  ctx.beginPath();
  ctx.moveTo(x+10, y+10);
  ctx.lineTo(x+20, y+30);
  ctx.lineTo(x+30, y+10);
  ctx.strokeStyle = '#000';
  ctx.stroke();
};

function waterTile(x, y) {
  ctx.fillStyle = '#57a';
  ctx.fillRect(x-1,y-1,101, 101);
};

function waterTileb(x, y) {
  ctx.fillStyle = '#469';
  ctx.fillRect(x-1,y-1,101, 101);
};

function blankTile(x, y) {
  ctx.fillStyle = '#333';
  ctx.fillRect(x-1,y-1,101, 101);
};

function pathTile(x, y) {
  ctx.fillStyle = '#9a6';
  ctx.fillRect(x-1,y-1,101, 101);
};

function wallTile(x, y) {
  ctx.fillStyle = '#aaa';
  ctx.fillRect(x-1,y-1,101, 101);
};

function rampY(x, y) {
  ctx.fillStyle = '#5a2';
  ctx.fillRect(x-1,y-1,101, 101);
};

function rampX(x, y) {
  ctx.fillStyle = '#5a2';
  ctx.fillRect(x-1,y-1,101, 101);
};

function smallTree(x, y) {
  ctx.beginPath();
  ctx.arc(x+50, y+50, 50, 0, 2 * Math.PI, false);
  ctx.fillStyle = '#482';
  ctx.fill();
  ctx.strokeStyle="#371";
  ctx.stroke();
};

function flag(x, y, color, health) {
  // Draw pole
  ctx.beginPath();
  ctx.moveTo(x+50, y+10);
  ctx.lineTo(x+50, y+80);
  ctx.strokeStyle = '#333';
  // Draw flag part
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x+50, y+40);
  ctx.lineTo(x+80, y+25);
  ctx.lineTo(x+50, y+10);
  ctx.lineTo(x+50, y+40);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.fill();
  // Draw Health
  ctx.fillStyle = '#a32';
  ctx.fillRect(x+24, y-15, health/2, 5);
};

function drawShadow(x, y) {
  ctx.fillStyle = '#aaa';
  ctx.shadowBlur = 50;
  ctx.shadowColor = "#444";
  ctx.fillRect(x, y,100, 100);
  ctx.shadowBlur = 0;
};

function drawOnTop() {

};

function drawData() {
  // Draw the Outside Data
  if(outsideData != null) {
    drawPlayers();
    drawAI();
    drawMissles();
    drawHealth();
    drawBuilds();
  }
  drawSelf();
};

function drawPlayers() {
  if(model.units != null) {
    var keys = Object.keys(model.units);
    for(var i=0;i<keys.length;i++){
      var key= keys[i];

      // check if unit is logged in
      if(model.units[key]) {
        if(model.units[key].loggedIn && !model.units[key].ai) {
          if(key != model.id) {
            if(model.units[key].ll) {
              ctx.drawImage(model.fDude, model.units[key].x - model.X + 500, model.units[key].y - model.Y + 350, 100, 100);
            }
            else {
              ctx.drawImage(model.dude, model.units[key].x - model.X + 500, model.units[key].y - model.Y + 350, 100, 100);
            }
            ctx.fillStyle = '#a32';
            ctx.fillRect(model.units[key].x+24 - model.X + 500,model.units[key].y-15 - model.Y + 350,model.units[key].health/2, 5);
          }
        }
      }
    }
  }
}

function drawAI() {
  if(model.ai != null) {
    var keys = Object.keys(model.ai);
    for(var i=0;i<keys.length;i++){
      var key= keys[i];
      if(model.ai[key] && model.ai[key].ai) {
        ctx.drawImage(model.creeps.dog, model.ai[key].x - model.X + 500, model.ai[key].y - model.Y + 350, 136, 100);
      }
      ctx.fillStyle = '#a32';
      ctx.fillRect(model.ai[key].x+24 - model.X + 500,model.ai[key].y-15 - model.Y + 350,model.ai[key].health/2, 5);
    }
  }
}

function drawMissles() {
  if(model.missles != null) {
    var keys = Object.keys(model.missles);
    for(var j=0;j<keys.length;j++){
      key = keys[j];
      let missle = model.missles[key];
      ctx.beginPath();
      ctx.arc(missle.curX - model.X + 500, missle.curY - model.Y + 350, 5, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'black';
      ctx.fill();
      ctx.stroke();
    }
  }
}

function drawHealth() {
  if(model.units[model.id] != null) {
    ctx.fillStyle = '#a32';
    ctx.fillRect(model.cX+24, model.cY-15,model.units[model.id].health/2, 5);
  }
}

function drawBuilds() {
  // Draw builds
  if(outsideData.builds != null) {
    model.MAP[outsideData.builds.x][outsideData.builds.y] = outsideData.builds.type;
  }
}

function drawSelf() {
  if(model.flipped) {
    ctx.drawImage(model.fDude, model.cX, model.cY, 100, 100);
  }
  else {
    ctx.drawImage(model.dude, model.cX, model.cY, 100, 100);
  }
}

function leftBound() {
  if(model.X-500 < 0)
    return 0;
  else {
    return parseInt((model.X-500)/100);
  }
};

function rightBound() {
  if(parseInt((model.X+500)/100) + 2 > model.columns)
    return (model.columns);
  return parseInt((model.X+500)/100) + 2;
};

function topBound() {
  if(model.Y-350 < 0)
    return 0;
  else {
    return parseInt((model.Y-350)/100);
  }
};

function bottomBound() {
  if(parseInt((model.Y+350)/100) + 2 > model.rows)
    return model.rows;
  return parseInt((model.Y+350)/100) + 2;
};

function colorMap(callback) {
  for(let i=0; i<(model.rows); i++) {
    for(let j=0; j<(model.columns); j++) {
      if(model.MAP[i][j] == 1) {
        ctx.fillStyle = '#eee';
        ctx.fillRect(10+x0,10+y0,150, 80);
      }
      else {

      }
    }
  }
  callback();
};

function gameWon(win) {
  ctx.clearRect(0, 0, model.vWidth, model.vHeight);
  ctx.fillStyle = 'white';
  ctx.font = "30px Arial";
  ctx.fillText("Game Won by: " + win.user,350,300);
  ctx.fillText("Reset in: " + parseInt(win.reset/(1000 / SharedConst.SPEED) + 1), 350, 400);
};

const render = {
  setCtx: (ctxp) => {
    ctx = ctxp;
  },
  render: (outsideDataP) => {
    outsideData = outsideDataP;
    ctx.clearRect(0, 0, model.vWidth, model.vHeight);
    drawMap();
    drawData();
  },
  renderIdle: renderIdle,
  gameWon: gameWon
};

module.exports = render;

},{"../../shared/constants.js":7,"./actions":2,"./model":4,"./utility":6}],6:[function(require,module,exports){
// -----------------------------------------------------------------------------
// ============================== UTILITY ========================================
// -----------------------------------------------------------------------------

var utils = {
  dist: function(x1, y1, x2, y2) {
      return (Math.hypot(x2-x1, y2-y1))
    },
  unit: function(x1, y1, x2, y2) {
      let d = this.dist(x1, y1, x2, y2);
      let dir = {
        x: (x2 - x1)/d,
        y: (y2 - y1)/d
      }
      return dir;
    },
  validate: function(format, input) {
      var keys = Object.keys(format);
      for(var i=0;i<keys.length;i++){
        var key = keys[i];
        if(input[key] == null) {
          return false;
        }
        else {
          if(typeof format[key] === 'object') {
            if(!this.validate(format[key], input[key]))
              return false;
          }
        }
      }
      return true;
    }
}

module.exports = utils;

},{}],7:[function(require,module,exports){
const SharedConst = {
  UNITWIDTH: 60,
  UNITHEIGHT:100,
  SPEED: 45,
  SAVEINTERVAL: 900,
  WINPERCENTAGE: .6,
  RESETINTERVAL: 222,
  MISSLESPEED: 15,
  MISSLEDIST: 30,
  MAXSPEED: 30,
  DRAINRANGE: 100,
  DAMAGE: 30
}

module.exports = SharedConst;

},{}],8:[function(require,module,exports){
const CONSTANTS = require('./constants.js');

function processMissles(missles, map, percentage) {
  // console.log(percentage);
  if(missles != null) {
    var keys = Object.keys(missles);
    for(let j=0;j<keys.length;j++) {
      var key = keys[j];
      if(missles[key].curX != null) {
        var missle = missles[key];
        missles[key].curX = missle.curX + (missle.dX * percentage);
        missles[key].curY = missle.curY + (missle.dY * percentage);
        missles[key].dist++;
        if( missles[key].dist > CONSTANTS.MISSLEDIST || hitWall(missles[key].curX, missles[key].curY, map)) {
          delete missles[key];
        }
      }
    }
  }
  return missles;
}

function hitWall(iX, iY, map) {
  if(map[parseInt(iX/100)] && map[parseInt(iX/100)][parseInt(iY/100)]) {
    let tile = map[parseInt(iX/100)][parseInt(iY/100)];
    if(tile.a == 2 || tile.a == 3) {
      return true;
    }
  }
  return false;
}

// If all four corners are clear return true, else false
function canGo(iX, iY, width, height, map) {
  if(isClear(map[parseInt((iX+20)/100)][parseInt((iY+40)/100)])
  && isClear(map[parseInt((iX+20)/100)][parseInt((iY+99)/100)])
  && isClear(map[parseInt((iX+80)/100)][parseInt((iY+40)/100)])
  && isClear(map[parseInt((iX+80)/100)][parseInt((iY+99)/100)])) {
    return true;
  }
  return false;
}

function isClear(tile) {
  if((tile.t == 0 || tile.t == 3 || tile.y == 7) && tile.a != 2)
    return true;
  return false;
}

module.exports = {processMissles: processMissles, canGo: canGo}

},{"./constants.js":7}]},{},[1]);
