// ------------------------CONTROLLER------------------------------//

const map = require('./map.js');
const utils = require('./utility.js');
const formats = require('../shared/formats.js')
const functions = require('../shared/functions.js');
const SharedConst = require('../shared/constants.js');
let flagDrains = [];

function processData() {
  clearActions();
  processUnits();
  processAI();
  processMissles();
  processFlags();
  processBuilds();
}

function processUnits() {
  // needs to test hits sent from front ends
  if (map.mapData.units != null) {
    var keys = Object.keys(map.mapData.units);
    for(var i=0;i<keys.length;i++){
      var key = keys[i];

      if (!utils.validate(formats.unit, map.mapData.units[key])) {
        console.log("deleting unit", map.mapData.units[key]);
        delete map.mapData.units[key];
      }

      if (map.mapData.units[key]) {
        theUnit = map.mapData.units[key];

        if (map.mapData.units.idle > 30) {
          delete map.mapData.units;
        }
        // Only look at units currently logged in
        if (theUnit.loggedIn == true) {
          processHits(theUnit, key);
          processMovement(theUnit);

          // Add any flag Drains
          if (theUnit.drainFlag) {
            if (validFlagDrain(theUnit)) {
              flagDrains.push({
                flag: theUnit.drainFlag.flag,
                id: theUnit.drainFlag.id,
                user: key
              });
            }
          }
        }
      }
    }
  }
}

function validFlagDrain(theUnit) {
  if (!theUnit.drainFlag)
    return false;
  const flag = map.mapData.flags[theUnit.drainFlag.id];
  if (!flag)
    return false;
  if (utils.dist(theUnit.x+50, theUnit.y+80, flag.x*100+50, flag.y*100+50) < SharedConst.DRAINRANGE)
    return true;
  else return false;
}


function processMissles() {
  map.mapData.missles = functions.processMissles(map.mapData.missles, map.map, 1);
}

function processHits(theUnit, key) {
  var keys2 = Object.keys(map.mapData.missles);
  for(let j=0; j<keys2.length; j++) {
    var key2 = keys2[j];
    var missle = map.mapData.missles[key2];
    if (utils.validate(formats.missles, missle)) {
      if (missle.sender != key) {
        if (hitUnit(missle.curX, missle.curY, theUnit)) {
          delete map.mapData.missles[key2];
          theUnit.health -= SharedConst.DAMAGE;
          if (theUnit.health < 0) {
            die(key);
          }
        }
      }
    }
  }
}

function processMovement(theUnit) {
  if (theUnit.x && theUnit.y && theUnit.newX && theUnit.newY) {
    if (functions.canGo(theUnit.newX, theUnit.newY, 60, 60, map.map) && inRange(theUnit.x, theUnit.y, theUnit.newX, theUnit.newY, SharedConst.MAXSPEED)) {
      theUnit.x = theUnit.newX;
      theUnit.y = theUnit.newY;
      theUnit.resetLoc = false;
    }
    else {
      theUnit.resetLoc = true;
    }
  }
}

function processFlags() {
  flagDrains.map( (flag, i) => {
    // should verify here
    if (flag.flag && map.map[flag.flag.x]) {
      if (flag.flag.health > 100) {
        return;
      } else if (map.map[flag.flag.x][flag.flag.y].h < 1){
        map.map[flag.flag.x][flag.flag.y].o = flag.flag.owner;
        map.mapData.flags[flag.id].owner = flag.flag.owner;
        map.map[flag.flag.x][flag.flag.y].h++;
      } else {
        if (map.map[flag.flag.x][flag.flag.y].o != flag.user) {
          map.map[flag.flag.x][flag.flag.y].h--;
        }
        else {
          map.map[flag.flag.x][flag.flag.y].o = flag.flag.owner;
          map.mapData.flags[flag.id].owner = flag.flag.owner;
          map.map[flag.flag.x][flag.flag.y].h++;
        }
        map.mapData.flags[flag.id].health = map.map[flag.flag.x][flag.flag.y].h;
      }
    }
  });
}

function processAI() {
  // needs to test hits sent from front ends
  if (map.mapData.ai != null) {
    var keys = Object.keys(map.mapData.ai);
    for(var i=0;i<keys.length;i++){
      let key = keys[i];

      if (!utils.validate(formats.aiProfiles.pet, map.mapData.ai[key])) {
        console.log("deleting ai", map.mapData.ai[key]);
        delete map.mapData.ai[key];
      }

      if (map.mapData.ai[key]) {
        theAI = map.mapData.ai[key];
        processHits(theAI, key);
        processMovement(theAI);

        // // Add any flag Drains
        // if (theAI.drainFlag) {
        //   if (validFlagDrain(theAI)) {
        //     flagDrains.push(theAI.drainFlag);
        //   }
        // }
      }
    }
  }
}

function processBuilds() {

}

function hitUnit(x, y, unit) {
  if (unit.x != null) {
    var xMin = unit.x+50-(SharedConst.UNITWIDTH/2);
    var xMax = unit.x+50+(SharedConst.UNITWIDTH/2);
    var yMin = unit.y+50-(SharedConst.UNITHEIGHT/2);
    var yMax = unit.y+50+(SharedConst.UNITHEIGHT/2);
    if (x > xMin && x < xMax && y > yMin && y < yMax) {
      return true;
    }
  }
  return false;
}

function die(unit) {
  map.mapData.units[unit] = {
    x: map.neutralSpawn.x,
    y: map.neutralSpawn.y,
    ll: true,
    health: 100,
    timeout: 0,
    alive: false,
    loggedIn: true
  };
}


function inRange(aX, aY, bX, bY, range) {
  if (utils.dist(aX, aY, bX, bY) < range) {
    return true;
  }
  return false;
}

// If all four corners are clear return true, else false
function canGo(iX, iY, width, height) {
  if (isClear(map.map[parseInt((iX+20)/100)][parseInt(iY/100)])
  && isClear(map.map[parseInt((iX+20)/100)][parseInt((iY+99)/100)])
  && isClear(map.map[parseInt((iX+80)/100)][parseInt((iY)/100)])
  && isClear(map.map[parseInt((iX+80)/100)][parseInt((iY+99)/100)])) {
    return true;
  }
  return false;
}

function isClear(tile) {
  if ((tile.t == 0 || tile.t == 3 || tile.y == 7) && tile.a != 2)
    return true;
  return false;
}


function shoot(msg) {
  // first check timeout
  // console.log("here", map.mapData.units, "id", msg.unit.id);
  if (map.mapData.units[msg.unit.id]) {
    if (map.mapData.units[msg.unit.id].timeout < 1) {

      // Then look through missles
      var keys = Object.keys(msg.unit.missles);
      for(var i=0;i<keys.length;i++){
        var key = keys[i];
        // if theres a new missle
        if (msg.unit.missles[key].shooting) {
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
          // console.log("Added missle", map.mapData.missles);
          map.mapData.units[msg.unit.id].timeout = 30;
        }
      }
    }
    else {
      map.mapData.units[msg.unit.id].timeout--;
    }
  }
}

function aiShoot(ai) {
  // first check timeout
  if (map.mapData.ai[ai.id]) {
    console.log("ai", ai);
    if (map.mapData.ai[ai.id].timeout < 1) {

      // Then look through missles
      var keys = Object.keys(ai.missles);
      for(var i=0;i<keys.length;i++){
        var key = keys[i];
        // if theres a new missle
        if (ai.missles[key].shooting) {
          // add the new missle to the json
          map.mapData.curMId++;
          let aMissle = {
            sender: ai.id,
            curX: map.mapData.ai[ai.id].x + 50,
            curY: map.mapData.ai[ai.id].y + 50,
            dX: ai.missles[key].dX,
            dY: ai.missles[key].dY,
            dist: 0,
            type: ai.missles[key].type
          };
          map.mapData.missles[ai.id] = aMissle;
          map.mapData.ai[ai.id].timeout = 30;
        }
      }
    }
    else {
      map.mapData.ai[ai.id].timeout--;
    }
  }
}

function build(msg) {
  if (utils.validate(msg.unit.build)) {
    map.change(msg.unit.build.type, msg.unit.build.x, msg.unit.build.y);
    map.mapData.builds = {type: msg.unit.build.type, x: msg.unit.build.x, y: msg.unit.build.y};
  }
}

function clearActions() {
  flagDrains = [];
}

function resetUnits() {
  if (map.mapData.units != null) {
    var keys = Object.keys(map.mapData.units);
    for(var i=0;i<keys.length;i++){
      var key = keys[i];
      die(key);
    }
  }
}

module.exports = {processData: processData, shoot: shoot, aiShoot: aiShoot, build: build, resetUnits: resetUnits};
