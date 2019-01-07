const CONSTANTS = require('../shared/constants.js');

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
