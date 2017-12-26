// ------------------------THE MAP------------------------------//

var columns = 110;
var rows = 80;
var MAP;

MAP = Array(columns).fill().map(() => Array(rows).fill({type: 0}));
console.log("this ran");

function readMap() {
  console.log("runs");
  var map;
  fs = require('fs')
  fs.readFile(__dirname + "/basicMap.m", 'utf8', function (err,data) {
    if (err) {
      return console.log(err);
    }
    map = JSON.parse(data);
    for(let i=0; i<map.length; i++) {
      for(let j=0; j<map[0].length; j++) {
        MAP[i][j] = map[i][j];
      }
    }
    // MAP = JSON.parse(data);
    columns = map.length;
    rows = map[0].length;
    // console.log(map);
    // MAP = map.slice(0);
  });
}

function createWall(x1, y1, len, dir, val) {
  switch(dir) {
    // Right is 0
    case 0:
      for(let i=0; i<len; i++) {
        MAP[x1+i][y1] = val;
      };
      break;
    // Down is 1
    case 1:
      for(let i=0; i<len; i++) {
        MAP[x1][y1+i] = val;
      };
      break;
      // Left is 2
      case 2:
        for(let i=0; i<len; i++) {
          MAP[x1-i][y1] = val;
        };
        break;
      // Up is 3
      case 3:
        for(let i=0; i<len; i++) {
          MAP[x1][y1-i] = val;
        };
        break;
  };
}

function initiateMap() {
  createWall(0, 0, 33, 0, 1);
  createWall(0, 1, 23, 1, 1);
  createWall(1, 23, 32, 0, 1);
  createWall(32, 1, 22, 1, 1);
  createWall(9, 9, 5, 0, 1);
  createWall(9, 8, 5, 3, 1);
};

function change(type, x, y) {
  MAP[x][y] = type;
};

module.exports = {map: MAP, initiateMap: initiateMap, change: change, readMap: readMap};
