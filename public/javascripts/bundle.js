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

},{"./actions":2,"./cookies":3,"./model":4,"./render":5,"./utility":6}],2:[function(require,module,exports){
// -----------------------------------------------------------------------------
// ============================== ACTIONS ======================================
// -----------------------------------------------------------------------------

var utils = require('./utility');
var model = require('./model');
var model = require('./model');

var mouse;
var sX, sY, eX, eY;

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
  console.log(pointing);
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
   dX: diff.x * 15,
   dY: diff.y * 15,
   dist: 0,
   type: "A",
   shooting: true
  };
 // console.log(outsideData.units[id]);
 // if(outsideData.units[id].missles != null && outsideData.units[id].missles != undefined) {
 //   console.log(outsideData.units[id].missles);
 //   while(outsideData.units[id].missles[i] != null) {
 //     i++;
 //   }
 // }
 // else {
 //   outsideData.units[id].missles = {};
 // }
 // outsideData.units[id].missles[i] = aMissle;
 // console.log(outsideData.units[id]);
 if(actions.missles[1] == undefined) {
   actions.missles[1] = aMissle;
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
  console.log(actions.build);
}

function insideBlock(x, y, x1, x2, y1, y2) {
  // console.log(x, y, x1, x2, y1, y2);
  if(x > x1 && x < x2 &&
    y > y1 && y < y2) {
    return true; }
  else { return false; }
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

// Export functions
var actions = {

  assignListeners: function(c) {
    document.getElementById("logout").addEventListener("click", logout);
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

    document.addEventListener('keyup', (event) => {
      if(event.key == "w" || event.key == "s")
        actions.act.up = 0;
      if(event.key == "a" || event.key == "d")
        actions.act.right = 0;
    });
  },
  act: {                           // actions
    up: 0,
    right: 0,
    shoot: false
  },
  placingF: false,                 // actions
  missles: {},                    // actions
  mouse: {},                          // actions
  sX, sY, eX, eY,                   // actions
  build: {type: 0, x: 0, y: 0}    // actions
}

module.exports = actions;

},{"./model":4,"./utility":6}],3:[function(require,module,exports){
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
  s: 5,                 // Constant that defines the change in distance per action
  vWidth: vWidth,
  vHeight: vHeight,
  cX: (vWidth/2-50),
  cY: (vHeight/2-50),
  dude: dude,
  fDude: fDude,
  flipped: false,
  timeSet: Date.now(),    // unused?
  needsReset: true,
  MAP: [],
  columns: 0,
  rows: 0,
  unitWidth: 60,
  unitHeight: 100,
  id: 0
}

module.exports = model;

},{}],5:[function(require,module,exports){
// -----------------------------------------------------------------------------
// ============================== RENDER =======================================
// -----------------------------------------------------------------------------

const model = require('./model');
const utils = require('./utility');
const actions = require('./actions');
let ctx;
let outsideData;

// This is for client-side rendering (for personal action to be smoother/quicker)
function renderActions() {

  ctx.clearRect(0, 0, model.vWidth, model.vHeight);

  let beforeX = model.X;
  if(actions.act.right != 0) {
    if(canGo(model.X+actions.act.right, model.Y)) {
      model.X+= actions.act.right;
    }
  }
  if(actions.act.up != 0) {
    if(canGo(beforeX, model.Y-actions.act.up)) {
      model.Y-=actions.act.up;
    }
  }
  if(actions.act.right < 0) {
    model.flipped = true;
  }
  if(actions.act.right > 0) {
    model.flipped = false;
  }
}

// If all four corners are clear return true, else false
function canGo(iX, iY) {
  if(isClear(model.MAP[parseInt((iX+20)/100)][parseInt(iY/100)])
  && isClear(model.MAP[parseInt((iX+20)/100)][parseInt((iY+99)/100)])
  && isClear(model.MAP[parseInt((iX+80)/100)][parseInt((iY)/100)])
  && isClear(model.MAP[parseInt((iX+80)/100)][parseInt((iY+99)/100)])) {
    return true;
  }
  return false;
}

function isClear(tile) {
  if(tile == 0)
    return true;
  if(tile.type == 3)
    return true;
  return false;
}

function drawMap() {
  let x0 = 500-model.X;
  let y0 = 350-model.Y;
  var grd = ctx.createLinearGradient(0,0,200,0);

  // Draw the map Tiles
  for(let i=leftBound(); i<rightBound(); i++) {
    for(let j=topBound(); j<bottomBound(); j++) {
      if(model.MAP[i][j] == 0) {
        grassTile(i*100+x0,j*100+y0);
      }
      else if(model.MAP[i][j].type == 2){
        waterTile(i*100+x0,j*100+y0);
      }
      else if(model.MAP[i][j].type == 3){
        pathTile(i*100+x0,j*100+y0);
      }
      else if(model.MAP[i][j].type == 4){
        grassTile(i*100+x0,j*100+y0);
      }
    }
  }

  // Draw the map Shadows
  for(let i=leftBound(); i<rightBound(); i++) {
    for(let j=topBound(); j<bottomBound(); j++) {
      if(model.MAP[i][j] == 1 || model.MAP[i][j].type == 1) {
        drawShadow(i*100+x0, j*100+y0);
      }
      else {
      }
    }
  }

  // Draw the map Walls
  for(let i=leftBound(); i<rightBound(); i++) {
    for(let j=topBound(); j<bottomBound(); j++) {
      if(model.MAP[i][j] == 1 || model.MAP[i][j].type == 1) {
        wallTile(i*100+x0, j*100+y0);
      }
      else if(model.MAP[i][j].type == 4){
        smallTree(i*100+x0, j*100+y0);
      }
    }
  }

  if(actions.placingF) {
    highLightPotential();
  }
  drawData();
}

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
}

function mouseInside(x1, x2, y1, y2) {
  if(actions.mouse.offsetX > x1 && actions.mouse.offsetX < x2 &&
    actions.mouse.offsetY > y1 && actions.mouse.offsetY < y2) {
    return true; }
  else { return false; }
}

function grassTile(x, y) {
  ctx.fillStyle = '#5a2';
  ctx.fillRect(x,y,100, 100);
  ctx.beginPath();
  ctx.moveTo(x+10, y+10);
  ctx.lineTo(x+20, y+30);
  ctx.lineTo(x+30, y+10);
  ctx.strokeStyle = '#000';
  ctx.stroke();
}

function waterTile(x, y) {
  ctx.fillStyle = '#57a';
  ctx.fillRect(x,y,100, 100);
}

function blankTile(x, y) {
  ctx.fillStyle = '#333';
  ctx.fillRect(x,y,100, 100);
}

function pathTile(x, y) {
  ctx.fillStyle = '#9a6';
  ctx.fillRect(x,y,100, 100);
}

function wallTile(x, y) {
  ctx.fillStyle = '#aaa';
  ctx.fillRect(x, y,100, 100);
}

function smallTree(x, y) {
  ctx.beginPath();
  ctx.arc(x+50, y+50, 50, 0, 2 * Math.PI, false);
  ctx.fillStyle = '#482';
  ctx.fill();
  ctx.strokeStyle="#371";
  ctx.stroke();
}

function drawShadow(x, y) {
  ctx.fillStyle = '#aaa';
  ctx.shadowBlur = 50;
  ctx.shadowColor = "#444";
  ctx.fillRect(x, y,100, 100);
  ctx.shadowBlur = 0;
}

function drawData() {
  // Draw the Outside Data
  if(outsideData != null) {

    // Draw the Players
    if(outsideData.units != null) {
      var keys = Object.keys(outsideData.units);
      for(var i=0;i<keys.length;i++){
        var key= keys[i];

        // check if unit is logged in
        if(outsideData.units[key].loggedIn) {
          if(key != model.id) {
            if(outsideData.units[key].ll) {
              ctx.drawImage(model.fDude, outsideData.units[key].x - model.X + 500, outsideData.units[key].y - model.Y + 350, 100, 100);
            }
            else {
              ctx.drawImage(model.dude, outsideData.units[key].x - model.X + 500, outsideData.units[key].y - model.Y + 350, 100, 100);
            }
            ctx.fillStyle = '#a32';
            ctx.fillRect(outsideData.units[key].x+24 - model.X + 500,outsideData.units[key].y-15 - model.Y + 350,outsideData.units[key].health/2, 5);
          }

          //Check for hit
          var myMissles = outsideData.missles;
          hits = {};
          if(myMissles != null && key != model.id) {
            var keys2 = Object.keys(myMissles);
            for(var j=0; j<keys2.length; j++) {
              var key2 = keys2[j];

              // Need to actually run a validate here
              if(myMissles[key2].curX != null) {
                if(hitUnit(myMissles[key2].curX, myMissles[key2].curY, key)) {
                  // need to send hit
                  hits = {sender: model.id, missle: key2, unit: key};
                }
              }
            }
          }
        }
      }
    }

    // draw the projectiles
    if(outsideData.missles != null) {
      var keys = Object.keys(outsideData.missles);
      for(var j=0;j<keys.length;j++){
        key = keys[j];
        let missle = outsideData.missles[key];
        ctx.beginPath();
        ctx.arc(missle.curX - model.X + 500, missle.curY - model.Y + 350, 5, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.stroke();
      }
    }

    // draw health
    if(outsideData.units != null) {
      ctx.fillStyle = '#a32';
      ctx.fillRect(model.cX+24, model.cY-15,outsideData.units[model.id].health/2, 5);
    }

    // Draw builds
    if(outsideData.builds != null) {
      model.MAP[outsideData.builds.x][outsideData.builds.y] = outsideData.builds.type;
    }
  }
  if(model.flipped) {
    ctx.drawImage(model.fDude, model.cX, model.cY, 100, 100);
  }
  else {
    ctx.drawImage(model.dude, model.cX, model.cY, 100, 100);
  }

}

function hitUnit(x, y, unit) {
  var xMin = outsideData.units[unit].x+50-(model.unitWidth/2);
  var xMax = outsideData.units[unit].x+50+(model.unitWidth/2);
  var yMin = outsideData.units[unit].y+50-(model.unitHeight/2);
  var yMax = outsideData.units[unit].y+50+(model.unitHeight/2);
  if(x > xMin && x < xMax && y > yMin && y < yMax) {
    return true;
  }
  return false;
}

function die() {

}

function leftBound() {
  if(model.X-500 < 0)
    return 0;
  else {
    return parseInt((model.X-500)/100);
  }
}

function rightBound() {
  if(parseInt((model.X+500)/100) + 2 > model.columns)
    return (model.columns);
  return parseInt((model.X+500)/100) + 2;
}

function topBound() {
  if(model.Y-350 < 0)
    return 0;
  else {
    return parseInt((model.Y-350)/100);
  }
}

function bottomBound() {
  if(parseInt((model.Y+350)/100) + 2 > model.rows)
    return model.rows;
  return parseInt((model.Y+350)/100) + 2;
}

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
}

const render = {
  setCtx: (ctxp) => {
    ctx = ctxp;
  },
  render: (outsideDataP) => {
    outsideData = outsideDataP;
    renderActions();
    drawMap();
  }
};

module.exports = render;

},{"./actions":2,"./model":4,"./utility":6}],6:[function(require,module,exports){
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

},{}]},{},[1]);
