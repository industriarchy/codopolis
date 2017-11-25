var express = require('express');
var app = express();
var server = app.listen(3000, function() {
    console.log("server started on port 3000");
});
var io = require('socket.io').listen(server);
var session = require('express-session')
var cookieParser = require('cookie-parser')

var numConnected = 0;
var alreadySending = false;

//  ------------------ mapData Format  ----------------------
//  curId: int          -> specifies the next id to be created by new player
//  units: {
//   id: {              -> id of the units
//      x: int          -> x-coord of unit
//      y: int          -> y-coord of unit
//      ll: bool        -> var for looking right
//      missles: {
//        timeout: int  -> time left before another shot
//        id: { int     -> id of missle
//          curX: int   -> current x-coord
//          curY: int   -> current y-coord
//          dX: int     -> travel speed x
//          dY: int     -> travel speed y
//          dist: int   -> distance traveled so far
//          type: string -> projectile type
//        },
//      }
//    },
//  }
//  ----------------------------------------------------------

// Need to make map work on server rendering

var mapData = {
  curId: 0,
  units: {}
};

io.on('connection', function(socket){
  socket.on('appData', function(msg){
    if(mapData.units[msg.unit.id] == null) {
      mapData.units[msg.unit.id] = msg.unit;
      mapData.units[msg.unit.id].missles.timeout = 0;
    }
    mapData.units[msg.unit.id].up= msg.unit.up;
    mapData.units[msg.unit.id].right = msg.unit.right
    if(msg.unit.missles == undefined) {
      mapData.units[msg.unit.id].missles = {};
    }
    else {
      // console.log(JSON.stringify(mapData.units));
      shoot(msg);
    }
  });
  numConnected++;
  socket.on('disconnect', function(){
    numConnected--;
  });
  batchSend(socket);
});

// Should try to see if map is different before sending as well to avoid extra emits
// Also should try to send different data depending on the person
function batchSend(socket) {
  if(!alreadySending) {
    setInterval(() => {
      if(numConnected > 0) {
        // console.log(JSON.stringify(mapData));
        processData();
        io.emit('appData', mapData);
      };
    }, 30);
    alreadySending = true;
  }
}

function processData() {
  if(mapData.units != null) {
    var keys = Object.keys(mapData.units);
    for(var i=0;i<keys.length;i++){
      var key = keys[i];

      // Process units
      mapData.units[key].x += mapData.units[key].right;
      mapData.units[key].y -= mapData.units[key].up;

      // Process Missles
      if(mapData.units[key].missles != null) {
        var keys2 = Object.keys(mapData.units[key].missles);
        for(let j=0;j<keys2.length;j++) {
          var key2 = keys2[j];
          var missle = mapData.units[key].missles[key2];
          mapData.units[key].missles[key2].curX = missle.curX + missle.dX;
          mapData.units[key].missles[key2].curY = missle.curY + missle.dY;
          mapData.units[key].missles[key2].dist++;
          if( mapData.units[key].missles[key2].dist > 100 ) {
            delete mapData.units[key].missles[key2];
          }
        }
      }
    }
  }
}

app.use(session({
  secret: 'samwise',
  resave: false,
  saveUninitialized: true
}));

app.use(cookieParser());

// set up static file serving from the public directory
app.use('/static', express.static(__dirname + '/public'));

app.get('/', function(req, res){
  if(!req.session.user) {
    mapData.curId++;
    req.session.user = mapData.curId;
    res.cookie('userId', req.session.user);
    makeChar();
  }
  res.sendFile(__dirname + '/index.html');
});

function makeChar() {
  mapData.units[mapData.curId] = {
    x: 500,
    y: 350,
    ll: true,
    right: 0,
    up: 0,
    missles: {
      timeout: 0,
      curId: 0
    }
  }
}

function makeMissle(msg, id, curX, curY, dx, dy, dist, type) {
  //        id: { int     -> id of missle
  //          curX: int   -> current x-coord
  //          curY: int   -> current y-coord
  //          dX: int     -> travel speed x
  //          dY: int     -> travel speed y
  //          dist: int   -> distance traveled so far
  //          type: string -> projectile type
  // mapData.units[msg.unit.id].missles
}

function shoot(msg) {
  //console.log(mapData.units[msg.unit.id].missles.timeout);
  // first check timeout
  if(mapData.units[msg.unit.id].missles.timeout < 1) {

    // Then look through missles
    var keys = Object.keys(msg.unit.missles);
    for(var i=0;i<keys.length;i++){
      var key = keys[i];
      // if theres a new missle
      if(msg.unit.missles[key].shooting) {
        // add the new missle to the json if its there
        mapData.units[msg.unit.id].missles.curId++;
        mapData.units[msg.unit.id].missles[mapData.units[msg.unit.id].missles.curId] = msg.unit.missles[key];
        mapData.units[msg.unit.id].missles.timeout = 30;
        console.log(mapData.units[msg.unit.id].missles.curId);
      }
    }
  }
  else {
    mapData.units[msg.unit.id].missles.timeout--;
  }
}
