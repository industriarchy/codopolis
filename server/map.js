// ------------------------THE MAP------------------------------//

const columns = 33;
const rows = 24;

// var MAP = new Array(height * width).fill(0);

var MAP = Array(columns).fill().map(() => Array(rows).fill(0));

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

module.exports = {map: MAP, initiateMap: initiateMap};
