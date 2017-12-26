
// -----------------------------------------------------------------------------
// ============================== SETUP ========================================
// -----------------------------------------------------------------------------

// Global Variables (I know I will eventually start using objects, maybe?)
var X = 500;
var Y = 350;
var s = 5;
var act = {
  up: 0,
  right: 0,
  shoot: false
}
gameplay = true;
const vWidth = 1100;
const vHeight = 800;
const cX = (vWidth/2-50);
const cY = (vHeight/2-50);
var dude = new Image();
var fDude = new Image();
var c;
var ctx;
var flipped = false;
var timeSet = Date.now();
var needsReset = true;
var placingF = false;
var MAP;
var columns;
var rows;
var unitWidth = 60;
var unitHeight = 100;
var socket = io();
var id;
var data;
var outsideData;
var missles = {};
var hits = {};
var mouse;
var placementGrid = new Array(8);
var mapSet = false;

// Formats
var hitsF = {sender: 0, missle: 0, unit: 0};
var build = {type: 0, x: 0, y: 0};


$( function() {

  // Goto Actions
  assignListeners();

  id = docCookies.getItem('userId');

  socket.on('appData', function(msg){
    console.log("X: ", X, ", Y: ", Y);
    // Emit your actions data
    data = { unit: {id: id, ll: flipped, up: act.up, right: act.right,
       missles: missles, alive: true, build: build}, mapSet: mapSet };
    socket.emit('appData', data);

    // Reset if dead
    if(msg.units[id].alive == false) {
      X = msg.units[id].x;
      Y = msg.units[id].y;
    }
    if(needsReset) {
      resetLoc();
    }

    // Set map
    if(msg.map != null) {
      if(msg.setMap) {
        MAP = msg.map;
        mapSet = true;
        columns = MAP.length;
        rows = MAP[0].length;
      }

      // Collect Data and render collected Data
      clearData();
      outsideData = msg;
      renderActions();
      drawMap();
    }
  });

  ctx = c.getContext("2d");
  dude.src = '/static/images/still.png';
  fDude.src = '/static/images/stillF.png';
});

function setMapPart(x1, y1, x2, y2, mapPart) {
  for(let i=0; i<(y2-y1); i++) {
    for(let j=0; j<(x2-x1); j++) {
      MAP[i+x1][j+y1] = mapPart[i][j];
    }
  }
}

// -----------------------------------------------------------------------------
// ============================== RENDER ========================================
// -----------------------------------------------------------------------------


// This is for client-side rendering (for personal action to be smoother/quicker)
function renderActions() {

  ctx.clearRect(0, 0, vWidth, vHeight);

  let beforeX = X;
  if(act.right != 0) {
    if(canGo(X+act.right, Y)) {
      X+= act.right;
    }
  }
  if(act.up != 0) {
    if(canGo(beforeX, Y-act.up)) {
      Y-=act.up;
    }
  }
  if(act.right < 0) {
    flipped = true;
  }
  if(act.right > 0) {
    flipped = false;
  }
}

// If all four corners are clear return true, else false
function canGo(iX, iY) {
  if(isClear(MAP[parseInt((iX+20)/100)][parseInt(iY/100)])
  && isClear(MAP[parseInt((iX+20)/100)][parseInt((iY+99)/100)])
  && isClear(MAP[parseInt((iX+80)/100)][parseInt((iY)/100)])
  && isClear(MAP[parseInt((iX+80)/100)][parseInt((iY+99)/100)])) {
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
  let x0 = 500-X;
  let y0 = 350-Y;
  var grd = ctx.createLinearGradient(0,0,200,0);

  // Draw the map Tiles
  for(let i=leftBound(); i<rightBound(); i++) {
    for(let j=topBound(); j<bottomBound(); j++) {
      if(MAP[i][j] == 0) {
        grassTile(i*100+x0,j*100+y0);
      }
      else if(MAP[i][j].type == 2){
        waterTile(i*100+x0,j*100+y0);
      }
      else if(MAP[i][j].type == 3){
        pathTile(i*100+x0,j*100+y0);
      }
      else if(MAP[i][j].type == 4){
        grassTile(i*100+x0,j*100+y0);
      }
    }
  }

  // Draw the map Shadows
  for(let i=leftBound(); i<rightBound(); i++) {
    for(let j=topBound(); j<bottomBound(); j++) {
      if(MAP[i][j] == 1 || MAP[i][j].type == 1) {
        drawShadow(i*100+x0, j*100+y0);
      }
      else {
      }
    }
  }

  // Draw the map Walls
  for(let i=leftBound(); i<rightBound(); i++) {
    for(let j=topBound(); j<bottomBound(); j++) {
      if(MAP[i][j] == 1 || MAP[i][j].type == 1) {
        wallTile(i*100+x0, j*100+y0);
      }
      else if(MAP[i][j].type == 4){
        smallTree(i*100+x0, j*100+y0);
      }
    }
  }

  if(placingF) {
    highLightPotential();
  }
  drawData();
}

function highLightPotential() {
  let offSX = 100 - X%100;
  let offSY = 100 - Y%100;
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
  if(mouse.offsetX > x1 && mouse.offsetX < x2 &&
    mouse.offsetY > y1 && mouse.offsetY < y2) {
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
  // ctx.fillStyle = '#5a2';
  // ctx.fillRect(x,y,100, 100);
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
          if(key != id) {
            if(outsideData.units[key].ll) {
              ctx.drawImage(fDude, outsideData.units[key].x - X + 500, outsideData.units[key].y - Y + 350, 100, 100);
            }
            else {
              ctx.drawImage(dude, outsideData.units[key].x - X + 500, outsideData.units[key].y - Y + 350, 100, 100);
            }
            ctx.fillStyle = '#a32';
            ctx.fillRect(outsideData.units[key].x+24 - X + 500,outsideData.units[key].y-15 - Y + 350,outsideData.units[key].health/2, 5);
          }

          //Check for hit
          var myMissles = outsideData.missles;
          hits = {};
          if(myMissles != null && key != id) {
            var keys2 = Object.keys(myMissles);
            for(var j=0; j<keys2.length; j++) {
              var key2 = keys2[j];

              // Need to actually run a validate here
              if(myMissles[key2].curX != null) {
                if(hitUnit(myMissles[key2].curX, myMissles[key2].curY, key)) {
                  // need to send hit
                  hits = {sender: id, missle: key2, unit: key};
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
        ctx.arc(missle.curX - X + 500, missle.curY - Y + 350, 5, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.stroke();
      }
    }

    // draw health
    if(outsideData.units != null) {
      ctx.fillStyle = '#a32';
      ctx.fillRect(cX+24,cY-15,outsideData.units[id].health/2, 5);
    }

    // Draw builds
    if(outsideData.builds != null) {
      MAP[outsideData.builds.x][outsideData.builds.y] = outsideData.builds.type;
    }
  }
  if(flipped) {
    ctx.drawImage(fDude, cX, cY, 100, 100);
  }
  else {
    ctx.drawImage(dude, cX, cY, 100, 100);
  }

}

function hitUnit(x, y, unit) {
  var xMin = outsideData.units[unit].x+50-(unitWidth/2);
  var xMax = outsideData.units[unit].x+50+(unitWidth/2);
  var yMin = outsideData.units[unit].y+50-(unitHeight/2);
  var yMax = outsideData.units[unit].y+50+(unitHeight/2);
  if(x > xMin && x < xMax && y > yMin && y < yMax) {
    return true;
  }
  return false;
}

function die() {

}

function leftBound() {
  if(X-500 < 0)
    return 0;
  else {
    return parseInt((X-500)/100);
  }
}

function rightBound() {
  if(parseInt((X+500)/100) + 2 > columns)
    return (columns);
  return parseInt((X+500)/100) + 2;
}

function topBound() {
  if(Y-350 < 0)
    return 0;
  else {
    return parseInt((Y-350)/100);
  }
}

function bottomBound() {
  if(parseInt((Y+350)/100) + 2 > rows)
    return rows;
  return parseInt((Y+350)/100) + 2;
}

function colorMap(callback) {
  for(let i=0; i<(rows); i++) {
    for(let j=0; j<(columns); j++) {
      if(MAP[i][j] == 1) {
        ctx.fillStyle = '#eee';
        ctx.fillRect(10+x0,10+y0,150, 80);
      }
      else {

      }
    }
  }
  callback();
}

function resetLoc() {
  if(outsideData != null) {
    if(outsideData.units[id] != null) {
      X = outsideData.units[id].x;
      Y = outsideData.units[id].y;
      needsReset = false;
    }
  }
}

function clearData() {
  missles = {};
  build.type = 0;
}

// -----------------------------------------------------------------------------
// ============================== ACTIONS ========================================
// -----------------------------------------------------------------------------

function assignListeners() {
  document.getElementById("logout").addEventListener("click", logout);
  c = document.getElementById("theView");
  c.addEventListener('click', (event) => {
    var clickX = event.offsetX;
    var clickY = event.offsetY;
    if(placingF) {
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
    mouse = event;
  });
}

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
    placingF = !placingF;
  }
});

document.addEventListener('keyup', (event) => {
  if(event.key == "w" || event.key == "s")
    act.up = 0;
  if(event.key == "a" || event.key == "d")
    act.right = 0;
});

function goUp() {
  act.up = s;
};

function goDown() {
  act.up = -s;
};

function goLeft() {
  act.right = -s;
};

function goRight() {
  act.right = s;
};


// For Mobile Controls
var sX, sY, eX, eY;
var pointing = false;
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
  act.up = 0;
  act.right = 0;
};

function dragging(e) {
  console.log(pointing);
  if(pointing) {
    eX = e.changedTouches[0].pageX;
    eY = e.changedTouches[0].pageY;
    let vec = unit(sX, sY, eX, eY);
    act.up = -(vec.y * s);
    act.right = vec.x * s;
  }
};

function shoot(x2, y2) {
  diff = unit(550, 400, x2, y2);
  let i=0;
  let aMissle = {
   curX: X+50,
   curY: Y+50,
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
 if(missles[1] == undefined) {
   missles[1] = aMissle;
  }
};

function placeFence(x, y) {
  x = x-500+X;
  y = y-350+Y;
  let offSX = 100 - X%100 + X - 500;
  let offSY = 100 - Y%100 + Y - 350;
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
    build = {type: fence, x: parseInt(x/100), y: parseInt(y/100)};
  }
  console.log(build);
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

// -----------------------------------------------------------------------------
// ============================== UTILITY ========================================
// -----------------------------------------------------------------------------

function dist(x1, y1, x2, y2) {
  return (Math.hypot(x2-x1, y2-y1))
}

function unit(x1, y1, x2, y2) {
  let d = dist(x1, y1, x2, y2);
  var dir = {
    x: (x2 - x1)/d,
    y: (y2 - y1)/d
  }
  return dir;
}

function validate(format, input) {
  var keys = Object.keys(format);
  for(var i=0;i<keys.length;i++){
    var key = keys[i];
    if(input[key] == null) {
      return false;
    }
    else {
      if(typeof format[key] === 'object') {
        if(!validate(format[key], input[key]))
          return false;
      }
    }
  }
  return true;
}
