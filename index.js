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
  units: {},
  missles: {}
};

io.on('connection', function(socket){
  socket.on('appData', function(msg){
    if(mapData.units[msg.unit.id] == null) {
      mapData.units[msg.unit.id] = msg.unit;
    }
    mapData.units[msg.unit.id].up= msg.unit.up;
    mapData.units[msg.unit.id].right = msg.unit.right;
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
          mapData.units[key].missles[key2].curX = missle.curX + missle.dx;
          mapData.units[key].missles[key2].curY = missle.curY + missle.dy;
          mapData.units[key].missles[key2].dist++;
          if( mapData.units[key].missles[key2].dist > 30 ) {
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
  }
  res.sendFile(__dirname + '/index.html');
});



function didHit() {

}
