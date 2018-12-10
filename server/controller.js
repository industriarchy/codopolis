// ------------------------CONTROLLER------------------------------//

const map = require('./map.js');
const utils = require('./utility.js');
const formats = require('./formats.js')
const drainRange = 100;
let flagDrains = [];
var unitWidth = 60;
var unitHeight = 100;
const damage = 30;

function processData() {
  processUnits();
  processMissles();
  processFlags();
}

function processUnits() {
  clearActions();
  // needs to test hits sent from front ends
  if(map.mapData.units != null) {
    var keys = Object.keys(map.mapData.units);
    for(var i=0;i<keys.length;i++){
      var key = keys[i];

      if(!utils.validate(formats.unit, map.mapData.units[key])) {
        delete map.mapData.units[key];
      }

      if(map.mapData.units[key]) {
        theUnit = map.mapData.units[key];

        if(map.mapData.units.idle > 30) {
          delete map.mapData.units;
        }
        // Only look at units currently logged in
        if(theUnit.loggedIn == true) {
          // Process hits
          var keys2 = Object.keys(map.mapData.missles);
          for(let j=0; j<keys2.length; j++) {
            var key2 = keys2[j];
            var missle = map.mapData.missles[key2];
            if(utils.validate(formats.missles, missle)) {
              if(missle.sender != key) {
                if(hitUnit(missle.curX, missle.curY, theUnit)) {
                  delete map.mapData.missles[key2];
                  theUnit.health -= damage;
                  if(theUnit.health < 0) {
                    die(key);
                  }
                }
              }
            }
          }

          // Process movement
          let beforeX = theUnit.x;
          if(theUnit.x && theUnit.y) {
            if(theUnit.right && canGo(theUnit.x + theUnit.right, theUnit.y)) {
              theUnit.x += theUnit.right;
            }
            if(theUnit.up && canGo(beforeX, theUnit.y - theUnit.up)) {
              theUnit.y -= theUnit.up;
            }
          }

          // Add any flag Drains
          if(theUnit.drainFlag) {
            flagDrains.push(theUnit.drainFlag);
          }
        }
        // Process AI
        else if(theUnit.ai) {

        }
      }
    }
  }
}

function valid(unit) {

}

function processMissles() {
  if(map.mapData.missles != null) {
    var keys = Object.keys(map.mapData.missles);
    for(let j=0;j<keys.length;j++) {
      var key = keys[j];
      if(map.mapData.missles[key].curX != null) {
        var missle = map.mapData.missles[key];
        map.mapData.missles[key].curX = missle.curX + missle.dX;
        map.mapData.missles[key].curY = missle.curY + missle.dY;
        map.mapData.missles[key].dist++;
        if( map.mapData.missles[key].dist > 30 || hitWall(map.mapData.missles[key].curX, map.mapData.missles[key].curY)) {
          delete map.mapData.missles[key];
        }
      }
    }
  }
}

function processFlags() {
  flagDrains.map( (flag, i) => {
    // should verify here
    if(flag.flag) {
      if(flag.flag.health > 100) {
        return;
      } else {
        map.mapData.flags[flag.id] = flag.flag;
        map.map[flag.flag.x][flag.flag.y].h = flag.flag.health;
        map.map[flag.flag.x][flag.flag.y].o = flag.flag.owner;
      }
    }
  });
}

function hitUnit(x, y, unit) {
  if(unit.x != null) {
    var xMin = unit.x+50-(unitWidth/2);
    var xMax = unit.x+50+(unitWidth/2);
    var yMin = unit.y+50-(unitHeight/2);
    var yMax = unit.y+50+(unitHeight/2);
    if(x > xMin && x < xMax && y > yMin && y < yMax) {
      return true;
    }
  }
  return false;
}

function hitWall(iX, iY) {
  let tile = map.map[parseInt(iX/100)][parseInt(iY/100)];
  if(tile.t == 0 || tile.t == 1 || tile.t == 2 || tile.t == 3 || tile.y == 7) {
    return false;
  }
  return true;
}

function die(unit) {
  map.mapData.units[unit] = {
    x: map.neutralSpawn.x,
    y: map.neutralSpawn.y,
    ll: true,
    right: 0,
    up: 0,
    health: 100,
    timeout: 0,
    alive: false,
    loggedIn: true
  };
}


function inRange(aX, aY, bX, bY, range) {
  if(utils.dist(aX, aY, bX, bY) < range) {
    return true;
  }
  return false;
}

// If all four corners are clear return true, else false
function canGo(iX, iY, width, height) {
  if(isClear(map.map[parseInt((iX+20)/100)][parseInt(iY/100)])
  && isClear(map.map[parseInt((iX+20)/100)][parseInt((iY+99)/100)])
  && isClear(map.map[parseInt((iX+80)/100)][parseInt((iY)/100)])
  && isClear(map.map[parseInt((iX+80)/100)][parseInt((iY+99)/100)])) {
    return true;
  }
  return false;
}

function isClear(tile) {
  if((tile.t == 0 || tile.t == 3 || tile.y == 7) && tile.a != 2)
    return true;
  return false;
}


function shoot(msg) {
  // first check timeout
  if(map.mapData.units[msg.unit.id].timeout < 1) {

    // Then look through missles
    var keys = Object.keys(msg.unit.missles);
    for(var i=0;i<keys.length;i++){
      var key = keys[i];
      // if theres a new missle
      if(msg.unit.missles[key].shooting) {
        // add the new missle to the json
        map.mapData.curMId++;
        let aMissle = {
          sender: msg.unit.id,
          curX: map.mapData.units[msg.unit.id].x + 50,
          curY: map.mapData.units[msg.unit.id].y + 50,
          dX: msg.unit.missles[key].dX,
          dY: msg.unit.missles[key].dY,
          dist: 0,
          type: msg.unit.missles[key].type
        };
        map.mapData.missles[map.mapData.curMId] = aMissle;
        map.mapData.units[msg.unit.id].timeout = 30;
      }
    }
  }
  else {
    map.mapData.units[msg.unit.id].timeout--;
  }
}

function build(msg) {
  map.change(msg.unit.build.type, msg.unit.build.x, msg.unit.build.y);
  map.mapData.builds = {type: msg.unit.build.type, x: msg.unit.build.x, y: msg.unit.build.y};
}

function clearActions() {
  flagDrains = [];
}

function resetUnits() {
  if(map.mapData.units != null) {
    var keys = Object.keys(map.mapData.units);
    for(var i=0;i<keys.length;i++){
      var key = keys[i];
      die(key);
    }
  }
}

module.exports = {processData: processData, shoot: shoot, build: build, resetUnits: resetUnits};
