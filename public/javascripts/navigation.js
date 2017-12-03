
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

// Formats
var hitsF = {sender: 0, missle: 0, unit: 0};


$( function() {
  document.getElementById("logout").addEventListener("click", logout);
  id = docCookies.getItem('userId');
  MAP = docCookies.parseMap(docCookies.getItem('MAP'));
  columns = MAP.length;
  rows = MAP[0].length;

  socket.on('appData', function(msg){
    //reset if dead
    if(msg.units[id].alive == false) {
      X = msg.units[id].x;
      Y = msg.units[id].y;
    }
    if(needsReset) {
      resetLoc();
    }
    data = { unit: {id: id, x: X, y: Y, ll: flipped, up: act.up, right: act.right,
       missles: missles, alive: true}, hits: hits};
    socket.emit('appData', data);
    clearData();
    outsideData = msg;
    render();
    drawMap();
  });
  c = document.getElementById("theView");
  ctx = c.getContext("2d");
  dude.src = '/static/images/still.png';
  fDude.src = '/static/images/stillF.png';
  drawMap();
});

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
  }
}

function canGo(iX, iY) {
  if(MAP[parseInt(iX/100)][parseInt(iY/100)] != 0
  ||  MAP[parseInt((iX)/100)][parseInt((iY+100)/100)] != 0
  ||  MAP[parseInt((iX+100)/100)][parseInt((iY)/100)] != 0
  || MAP[parseInt((iX+100)/100)][parseInt((iY+100)/100)] != 0) {
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

  drawData();
}

function grassTile(x, y) {
  ctx.fillStyle = '#5a2';
  ctx.fillRect(x,y,100, 100);
  ctx.beginPath();
  ctx.moveTo(x+10, y+10);
  ctx.lineTo(x+20, y+30);
  ctx.lineTo(x+30, y+10);
  ctx.stroke();
}

function wallTile(x, y) {
  ctx.fillStyle = '#aaa';
  ctx.fillRect(x, y,100, 100);
}

function drawData() {
  // Draw the Outside Data
  if(outsideData != null) {

    // Draw the Players
    if(outsideData.units != null) {
      var keys = Object.keys(outsideData.units);
      for(var i=0;i<keys.length;i++){
        var key= keys[i];
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

document.addEventListener('click', (event) => {
  if(event.target.nodeName == "CANVAS") {
    var clickX = event.offsetX;
    var clickY = event.offsetY;
    shoot(clickX, clickY);
  }
});

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

// Some basic utility functions

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
