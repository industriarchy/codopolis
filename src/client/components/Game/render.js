// -----------------------------------------------------------------------------
// ============================== RENDER =======================================
// -----------------------------------------------------------------------------

const model = require('./model');
import { utils } from '../Utility/utility.js';
const actions = require('./actions');
const SharedConst = require('../../../shared/constants.js');
var docCookies = require('./cookies');
let ctx;
let outsideData;

function renderIdle() {
  ctx.clearRect(0, 0, model.vWidth, model.vHeight);
  ctx.fillStyle = 'white';
  ctx.font = "30px Arial";
  ctx.fillText("Idled out, please refresh page",350,300);
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
        let fColor = '#f00';
        if(model.MAP[i][j].o == docCookies.getItem('userId'))
          fColor = '#0f0';
        flag(i*100+x0, j*100+y0, fColor, model.MAP[i][j].h);
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
  ctx.fillRect(x-1,y-1,101, 101);
  ctx.beginPath();
  ctx.moveTo(x+10, y+10);
  ctx.lineTo(x+20, y+30);
  ctx.lineTo(x+30, y+10);
  ctx.strokeStyle = '#000';
  ctx.stroke();
};

function waterTile(x, y) {
  ctx.fillStyle = '#57a';
  ctx.fillRect(x-1,y-1,101, 101);
};

function waterTileb(x, y) {
  ctx.fillStyle = '#469';
  ctx.fillRect(x-1,y-1,101, 101);
};

function blankTile(x, y) {
  ctx.fillStyle = '#333';
  ctx.fillRect(x-1,y-1,101, 101);
};

function pathTile(x, y) {
  ctx.fillStyle = '#9a6';
  ctx.fillRect(x-1,y-1,101, 101);
};

function wallTile(x, y) {
  ctx.fillStyle = '#aaa';
  ctx.fillRect(x-1,y-1,101, 101);
};

function rampY(x, y) {
  ctx.fillStyle = '#5a2';
  ctx.fillRect(x-1,y-1,101, 101);
};

function rampX(x, y) {
  ctx.fillStyle = '#5a2';
  ctx.fillRect(x-1,y-1,101, 101);
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
    drawPlayers();
    drawAI();
    drawMissles();
    drawHealth();
    drawBuilds();
  }
  drawSelf();
};

function drawPlayers() {
  if(model.units != null) {
    var keys = Object.keys(model.units);
    for(var i=0;i<keys.length;i++){
      var key= keys[i];

      // check if unit is logged in
      if(model.units[key]) {
        if(model.units[key].loggedIn && !model.units[key].ai) {
          if(key != model.id) {
            if(model.units[key].ll) {
              ctx.drawImage(model.fDude, model.units[key].x - model.X + 500, model.units[key].y - model.Y + 350, 100, 100);
            }
            else {
              ctx.drawImage(model.dude, model.units[key].x - model.X + 500, model.units[key].y - model.Y + 350, 100, 100);
            }
            ctx.fillStyle = '#a32';
            ctx.fillRect(model.units[key].x+24 - model.X + 500,model.units[key].y-15 - model.Y + 350,model.units[key].health/2, 5);
          }
        }
      }
    }
  }
}

function drawAI() {
  if(model.ai != null) {
    var keys = Object.keys(model.ai);
    for(var i=0;i<keys.length;i++){
      var key= keys[i];
      if(model.ai[key] && model.ai[key].ai) {
        ctx.drawImage(model.creeps.dog, model.ai[key].x - model.X + 500, model.ai[key].y - model.Y + 350, 136, 100);
      }
      ctx.fillStyle = '#a32';
      ctx.fillRect(model.ai[key].x+24 - model.X + 500,model.ai[key].y-15 - model.Y + 350,model.ai[key].health/2, 5);
    }
  }
}

function drawMissles() {
  if(model.missles != null) {
    var keys = Object.keys(model.missles);
    for(var j=0;j<keys.length;j++){
      let key = keys[j];
      let missle = model.missles[key];
      ctx.beginPath();
      ctx.arc(missle.curX - model.X + 500, missle.curY - model.Y + 350, 5, 0, 2 * Math.PI, false);
      ctx.fillStyle = 'black';
      ctx.fill();
      ctx.stroke();
    }
  }
}

function drawHealth() {
  if(model.units[model.id] != null) {
    ctx.fillStyle = '#a32';
    ctx.fillRect(model.cX+24, model.cY-15,model.units[model.id].health/2, 5);
  }
}

function drawBuilds() {
  // Draw builds
  if(outsideData.builds != null) {
    model.MAP[outsideData.builds.x][outsideData.builds.y] = outsideData.builds.type;
  }
}

function drawSelf() {
  if(model.flipped) {
    ctx.drawImage(model.fDude, model.cX, model.cY, 100, 100);
  }
  else {
    ctx.drawImage(model.dude, model.cX, model.cY, 100, 100);
  }
}

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
  ctx.fillText("Reset in: " + parseInt(win.reset/(1000 / SharedConst.SPEED) + 1), 350, 400);
};

export const render = {
  setCtx: (ctxp) => {
    ctx = ctxp;
  },
  render: (outsideDataP) => {
    outsideData = outsideDataP;
    ctx.clearRect(0, 0, model.vWidth, model.vHeight);
    drawMap();
    drawData();
  },
  renderIdle: renderIdle,
  gameWon: gameWon
};
