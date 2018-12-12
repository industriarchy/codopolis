// -----------------------------------------------------------------------------
// ============================== RENDER =======================================
// -----------------------------------------------------------------------------

const model = require('./model');
const utils = require('./utility');
const actions = require('./actions');
let ctx;
let outsideData;

function renderIdle() {
  ctx.clearRect(0, 0, model.vWidth, model.vHeight);
  ctx.fillStyle = 'white';
  ctx.font = "30px Arial";
  ctx.fillText("Idled out, please refresh page",350,300);
};

// This is for client-side rendering (for personal action to be smoother/quicker)
function renderActions() {

  ctx.clearRect(0, 0, model.vWidth, model.vHeight);

  let beforeX = model.X;
  if(actions.act.right != 0) {
    if(canGo(model.X+actions.act.right, model.Y)) {
      model.X+= actions.act.right;
    }
  }
  if(actions.act.up != 0) {
    if(canGo(beforeX, model.Y-actions.act.up)) {
      model.Y-=actions.act.up;
    }
  }
  if(actions.act.right < 0) {
    model.flipped = true;
  }
  if(actions.act.right > 0) {
    model.flipped = false;
  }
};

// If all four corners are clear return true, else false
function canGo(iX, iY) {
  if(isClear(model.MAP[parseInt((iX+20)/100)][parseInt(iY/100)])
  && isClear(model.MAP[parseInt((iX+20)/100)][parseInt((iY+99)/100)])
  && isClear(model.MAP[parseInt((iX+80)/100)][parseInt((iY)/100)])
  && isClear(model.MAP[parseInt((iX+80)/100)][parseInt((iY+99)/100)])) {
    return true;
  }
  return false;
};

function isClear(tile) {
  if((tile.t == 0 || tile.t == 3 || tile.y == 7) && tile.a != 2)
    return true;
  return false;
};

function drawMap() {
  let x0 = 500-model.X;
  let y0 = 350-model.Y;
  var grd = ctx.createLinearGradient(0,0,200,0);

  // Draw the map Tiles for each level
  for(let l=0; l<5; l++) {

    // Draw the map Shadows
    for(let i=leftBound(); i<rightBound(); i++) {
      for(let j=topBound(); j<bottomBound(); j++) {
        if(model.MAP[i][j].l > 0 && model.MAP[i][j].l == l) {
          if(model.MAP[i][j].t == 6) {
            drawRampShadowY(i*100+x0, j*100+y0);
          }
          else {
            drawShadow(i*100+x0, j*100+y0);
          }
        }
        // else if(MAP[i][j].type == 4){
        //   drawShadow(i*100+x0, j*100+y0);
        // }
      }
    }

    for(let i=leftBound(); i<rightBound(); i++) {
      for(let j=topBound(); j<bottomBound(); j++) {
        if(model.MAP[i][j].l == l) {
          if(model.MAP[i][j].t == 0) {
            grassTile(i*100+x0,j*100+y0);
          }
          else if(model.MAP[i][j].t == 2){
            waterTile(i*100+x0,j*100+y0);
          }
          else if(model.MAP[i][j].t == 3){
            pathTile(i*100+x0,j*100+y0);
          }
          else if(model.MAP[i][j].t == 4){
            grassTile(i*100+x0,j*100+y0);
          }
          else if(model.MAP[i][j].t == 6){
            rampY(i*100+x0,j*100+y0);
          }
          else if(model.MAP[i][j].t == 7){
            waterTileb(i*100+x0,j*100+y0);
          }
        }
      }
    }
  }

  // Draw the map additions
  for(let i=leftBound(); i<rightBound(); i++) {
    for(let j=topBound(); j<bottomBound(); j++) {
      if(model.MAP[i][j].a == 1){
        flag(i*100+x0, j*100+y0, '#f00', model.MAP[i][j].h);
        // flag(i*100+x0, j*100+y0, '#f00', 100);
      }
      else if(model.MAP[i][j].a == 2){
        smallTree(i*100+x0, j*100+y0);
      }
      else if(model.MAP[i][j].a == 3) {
        wallTile(i*100+x0, j*100+y0);
      }
    }
  }

  if(actions.placingF) {
    highLightPotential();
  }
  drawData();
};

function highLightPotential() {
  let offSX = 100 - model.X%100;
  let offSY = 100 - model.Y%100;
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
};

function mouseInside(x1, x2, y1, y2) {
  if(actions.mouse.offsetX > x1 && actions.mouse.offsetX < x2 &&
    actions.mouse.offsetY > y1 && actions.mouse.offsetY < y2) {
    return true; }
  else { return false; }
};

function grassTile(x, y) {
  ctx.fillStyle = '#5a2';
  ctx.fillRect(x,y,100, 100);
  ctx.beginPath();
  ctx.moveTo(x+10, y+10);
  ctx.lineTo(x+20, y+30);
  ctx.lineTo(x+30, y+10);
  ctx.strokeStyle = '#000';
  ctx.stroke();
};

function waterTile(x, y) {
  ctx.fillStyle = '#57a';
  ctx.fillRect(x,y,100, 100);
};

function waterTileb(x, y) {
  ctx.fillStyle = '#469';
  ctx.fillRect(x,y,100, 100);
};

function blankTile(x, y) {
  ctx.fillStyle = '#333';
  ctx.fillRect(x,y,100, 100);
};

function pathTile(x, y) {
  ctx.fillStyle = '#9a6';
  ctx.fillRect(x,y,100, 100);
};

function wallTile(x, y) {
  ctx.fillStyle = '#aaa';
  ctx.fillRect(x, y,100, 100);
};

function rampY(x, y) {
  ctx.fillStyle = '#5a2';
  ctx.fillRect(x,y,100, 100);
};

function rampX(x, y) {
  ctx.fillStyle = '#5a2';
  ctx.fillRect(x,y,100, 100);
};

function smallTree(x, y) {
  ctx.beginPath();
  ctx.arc(x+50, y+50, 50, 0, 2 * Math.PI, false);
  ctx.fillStyle = '#482';
  ctx.fill();
  ctx.strokeStyle="#371";
  ctx.stroke();
};

function flag(x, y, color, health) {
  // Draw pole
  ctx.beginPath();
  ctx.moveTo(x+50, y+10);
  ctx.lineTo(x+50, y+80);
  ctx.strokeStyle = '#333';
  // Draw flag part
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x+50, y+40);
  ctx.lineTo(x+80, y+25);
  ctx.lineTo(x+50, y+10);
  ctx.lineTo(x+50, y+40);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.fill();
  // Draw Health
  ctx.fillStyle = '#a32';
  ctx.fillRect(x+24, y-15, health/2, 5);
};

function drawShadow(x, y) {
  ctx.fillStyle = '#aaa';
  ctx.shadowBlur = 50;
  ctx.shadowColor = "#444";
  ctx.fillRect(x, y,100, 100);
  ctx.shadowBlur = 0;
};

function drawOnTop() {

};

function drawData() {
  // Draw the Outside Data
  if(outsideData != null) {

    // Draw the Players
    if(outsideData.units != null) {
      var keys = Object.keys(outsideData.units);
      for(var i=0;i<keys.length;i++){
        var key= keys[i];

        // check if unit is logged in
        if(outsideData.units[key]) {
          if(outsideData.units[key].loggedIn) {
            if(key != model.id) {
              if(outsideData.units[key].ll) {
                ctx.drawImage(model.fDude, outsideData.units[key].x - model.X + 500, outsideData.units[key].y - model.Y + 350, 100, 100);
              }
              else {
                ctx.drawImage(model.dude, outsideData.units[key].x - model.X + 500, outsideData.units[key].y - model.Y + 350, 100, 100);
              }
              ctx.fillStyle = '#a32';
              ctx.fillRect(outsideData.units[key].x+24 - model.X + 500,outsideData.units[key].y-15 - model.Y + 350,outsideData.units[key].health/2, 5);
            }

            //Check for hit
            var myMissles = outsideData.missles;
            hits = {};
            if(myMissles != null && key != model.id) {
              var keys2 = Object.keys(myMissles);
              for(var j=0; j<keys2.length; j++) {
                var key2 = keys2[j];

                // Need to actually run a validate here
                if(myMissles[key2].curX != null) {
                  if(hitUnit(myMissles[key2].curX, myMissles[key2].curY, key)) {
                    // need to send hit
                    hits = {sender: model.id, missle: key2, unit: key};
                  }
                }
              }
            }
          }
          else if(outsideData.units[key].ai) {
            // console.log("hit ai", model.creeps.dog);s
            ctx.drawImage(model.creeps.dog, outsideData.units[key].x - model.X + 500, outsideData.units[key].y - model.Y + 350, 136, 100);
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
        ctx.arc(missle.curX - model.X + 500, missle.curY - model.Y + 350, 5, 0, 2 * Math.PI, false);
        ctx.fillStyle = 'black';
        ctx.fill();
        ctx.stroke();
      }
    }

    // draw health
    if(outsideData.units != null) {
      ctx.fillStyle = '#a32';
      ctx.fillRect(model.cX+24, model.cY-15,outsideData.units[model.id].health/2, 5);
    }

    // Draw builds
    if(outsideData.builds != null) {
      model.MAP[outsideData.builds.x][outsideData.builds.y] = outsideData.builds.type;
    }
  }
  if(model.flipped) {
    ctx.drawImage(model.fDude, model.cX, model.cY, 100, 100);
  }
  else {
    ctx.drawImage(model.dude, model.cX, model.cY, 100, 100);
  }
};

function hitUnit(x, y, unit) {
  var xMin = outsideData.units[unit].x+50-(model.unitWidth/2);
  var xMax = outsideData.units[unit].x+50+(model.unitWidth/2);
  var yMin = outsideData.units[unit].y+50-(model.unitHeight/2);
  var yMax = outsideData.units[unit].y+50+(model.unitHeight/2);
  if(x > xMin && x < xMax && y > yMin && y < yMax) {
    return true;
  }
  return false;
};

function die() {

};

function leftBound() {
  if(model.X-500 < 0)
    return 0;
  else {
    return parseInt((model.X-500)/100);
  }
};

function rightBound() {
  if(parseInt((model.X+500)/100) + 2 > model.columns)
    return (model.columns);
  return parseInt((model.X+500)/100) + 2;
};

function topBound() {
  if(model.Y-350 < 0)
    return 0;
  else {
    return parseInt((model.Y-350)/100);
  }
};

function bottomBound() {
  if(parseInt((model.Y+350)/100) + 2 > model.rows)
    return model.rows;
  return parseInt((model.Y+350)/100) + 2;
};

function colorMap(callback) {
  for(let i=0; i<(model.rows); i++) {
    for(let j=0; j<(model.columns); j++) {
      if(model.MAP[i][j] == 1) {
        ctx.fillStyle = '#eee';
        ctx.fillRect(10+x0,10+y0,150, 80);
      }
      else {

      }
    }
  }
  callback();
};

function gameWon(win) {
  ctx.clearRect(0, 0, model.vWidth, model.vHeight);
  ctx.fillStyle = 'white';
  ctx.font = "30px Arial";
  ctx.fillText("Game Won by: " + win.user,350,300);
  ctx.fillText("Reset in: " + parseInt(win.reset/33 + 1), 350, 400);
};

const render = {
  setCtx: (ctxp) => {
    ctx = ctxp;
  },
  render: (outsideDataP) => {
    outsideData = outsideDataP;
    renderActions();
    drawMap();
  },
  renderIdle: renderIdle,
  gameWon: gameWon
};

module.exports = render;
