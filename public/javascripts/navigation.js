

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

initiateMap();
var socket = io();
var id;
var data;
var outsideData;


$( function() {
  id = docCookies.getItem('userId');
  socket.on('appData', function(msg){
    if(needsReset) {
      resetLoc();
    }
    data = { unit: {id: id, x: X, y: Y, ll: flipped, up: act.up, right: act.right}};
    socket.emit('appData', data);
    outsideData = msg;
    drawMap();
    render();
  });
  c = document.getElementById("theView");
  ctx = c.getContext("2d");
  dude.src = '/static/images/still.png';
  fDude.src = '/static/images/stillF.png';
  drawMap();
});

function resetLoc() {
  if(outsideData != null) {
    if(outsideData.units != null) {
      X = outsideData.units[id].x;
      Y = outsideData.units[id].y;
      needsReset = false;
    }
  }
}

function render() {

  if(act.up > 0) {
    if(canGo(X, Y-s)) {
      Y-=act.up;
    }
  }
  if(act.up < 0) {
    if(canGo(X, Y+s)) {
      Y-=act.up;
    }
  }
  if(act.right < 0) {
    if(canGo(X-s, Y)) {
      X+= act.right;
      flipped = true;
    }
  }
  if(act.right > 0) {
    if(canGo(X+s, Y)) {
      X+= act.right;
      flipped = false;
    }
  }

  if(act.up != 0 || act.right != 0) {
    ctx.clearRect(0, 0, vWidth, vHeight); // clear canvas
    drawMap();
  }
}

function canGo(iX, iY) {
  if(MAP[parseInt(iX/100)][parseInt(iY/100)] != 0 || MAP[parseInt((iX+100)/100)][parseInt((iY+100)/100)] != 0) {
    return false;
  }
  else {
    return true;
  }
}

function drawMap() {
  let x0 = 500-X;
  let y0 = 350-Y;
  var grd = ctx.createLinearGradient(0,0,200,0);

  // Draw the map Tiles
  for(let i=leftBound(); i<rightBound(); i++) {
    for(let j=topBound(); j<bottomBound(); j++) {
      if(MAP[i][j] == 1) {
        wallTile(i*100+x0, j*100+y0);
      }
      else {
        grassTile(i*100+x0,j*100+y0);
      }
    }
  }

  // Draw the Outside Data
  if(outsideData != null) {

    // Draw the Players
    if(outsideData.units != null) {
      var keys = Object.keys(outsideData.units);
      for(var i=0;i<keys.length;i++){
        if(keys[i] != id) {
          var key = keys[i];
          if(outsideData.units[key].ll) {
            ctx.drawImage(fDude, outsideData.units[key].x - X + 500, outsideData.units[key].y - Y + 350, 100, 100);
          }
          else {
            ctx.drawImage(dude, outsideData.units[key].x - X + 500, outsideData.units[key].y - Y + 350, 100, 100);
          }
        }
      }
    }
  }
  if(flipped) {
    ctx.drawImage(fDude, cX, cY, 100, 100);
  }
  else {
    ctx.drawImage(dude, cX, cY, 100, 100);
  }
}

function grassTile(x, y) {
  ctx.fillStyle = '#5a2';
  ctx.fillRect(x,y,100, 100);
  ctx.beginPath();
  ctx.moveTo(x+10, y+10);
  ctx.lineTo(x+20, y+30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x+30, y+10);
  ctx.lineTo(x+20, y+30);
  ctx.stroke();
}

function wallTile(x, y) {
  ctx.fillStyle = '#aaa';
  ctx.fillRect(x, y,100, 100);
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

document.addEventListener('keydown', (event) => {
  const keyName = event.key;
  if(act.up == 0 && act.right == 0) {
    switch(keyName) {
      case "w":
        goUp();
        break;
      case "s":
        goDown();
        break;
      case "d":
        goRight();
        break;
      case "a":
        goLeft();
        break;
      case " ":
        console.log("space");
        break;
    };
  };
});

document.addEventListener('keyup', (event) => {
  act.up = 0;
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

document.addEventListener('click', (event) => {
  var clickX = event.offsetX;
  var clickY = event.offsetY;
  shoot(clickX, clickY);
});

function shoot(x2, y2) {
  console.log(x2 + ", " + y2);

};
