

var X = 500;
var Y = 350;
var s = 4;
var action = 0;
gameplay = true;
const vWidth = 1100;
const vHeight = 800;
const cX = (vWidth/2-50);
const cY = (vHeight/2-50);
var domMAP = Array(rows).fill().map(() => Array(columns));
var dude = new Image();
var c;
var ctx;
var flipped = false;
var timeSet = Date.now();

initiateMap();
var socket = io();
var id;
var outsideData;


$( function() {
  id = docCookies.getItem('userId');
  socket.on('chat message', function(msg){
      outsideData = msg;
      drawMap();
  });
  c = document.getElementById("theView");
  ctx = c.getContext("2d");
  dude.src = '/static/images/still.png';
  drawMap();
  window.requestAnimationFrame(render);
});

function render() {
  var timeDif = Date.now() - timeSet;
  timeSet = Date.now();
  switch(action) {
    case 1:
      if(canGo(X, Y-s)) {
        Y-=timeDif/s;
      }
      break;
    case 2:
      if(canGo(X, Y+s)) {
        Y+=timeDif/s;
      }
      break;
    case 3:
      if(canGo(X-s, Y)) {
        X-=timeDif/s;
        flipped = true;
      }
      break;
    case 4:
      if(canGo(X+s, Y)) {
        X+=timeDif/s;
        flipped = false;
      }
      break;
  };

  if(action != 0) {
    ctx.clearRect(0, 0, vWidth, vHeight); // clear canvas
    if(flipped) {
      dude.src = '/static/images/stillF.png';
    }
    else {
      dude.src = '/static/images/still.png';
    }
    drawMap();
    var data = {id: id, x: X, y: Y};
    socket.emit('chat message', data);
  }
  window.requestAnimationFrame(render);
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
  if(outsideData != null) {
    if(outsideData.units != null) {
      var keys = Object.keys(outsideData.units);
      for(var i=0;i<keys.length;i++){
        if(keys[i] != id) {
          var key = keys[i];
          ctx.drawImage(dude, outsideData.units[key].x - X + 500, outsideData.units[key].y - Y + 350, 100, 100);
        }
      }
    }
  }
  ctx.drawImage(dude, cX, cY, 100, 100);
}

function drawDude(x, y) {

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
  if(action == 0) {
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
    };
  };
  // emit socket data for movement
  // socket.emit('chat message', 'sending something');
});

document.addEventListener('keyup', (event) => {
  action = 0;
});

function goUp() {
  action = 1;
};

function goDown() {
  action = 2;
};

function goLeft() {
  action = 3;
};

function goRight() {
  action = 4;
};
