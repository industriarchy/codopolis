// -----------------------------------------------------------------------------
// ============================== ACTIONS ======================================
// -----------------------------------------------------------------------------

var utils = require('./utility');
var model = require('./model');
var docCookies = require('./cookies');

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

function detectFlag() {
  model.flags.forEach( (flag, i) => {
    if(utils.dist(model.X+50, model.Y+80, flag.x*100+50, flag.y*100+50) < 60) {
      if(model.flags[i].health < 1)
        model.flags[i].owner = docCookies.getItem('userId');
      if(model.flags[i].owner == docCookies.getItem('userId')) {
        model.flags[i].health++;
      }
      else {
        model.flags[i].health--;
      }
      actions.drainFlag = { flag: model.flags[i], id: i};
    }
  });
}

// Export functions
var actions = {

  assignListeners: function(c) {
    return new Promise( function(resolve, reject) {
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

      var a = document.addEventListener('keyup', (event) => {
        if(event.key == "w" || event.key == "s")
          actions.act.up = 0;
        if(event.key == "a" || event.key == "d")
          actions.act.right = 0;
      });
      resolve(a);
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
  build: {type: 0, x: 0, y: 0},    // actions
  drainFlag: {
    draing: false,
    x: 0, y: 0
  },
  detectFlag: detectFlag,
  drainFlag: {}
}

module.exports = actions;
