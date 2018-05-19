var express = require('express');
var bodyParser = require('body-parser');
var app = express();

var server = app.listen(3000, function() {
    console.log("server started on port 3000");
});

//Database Stuff
var mongo = require('mongodb');
var monk = require('monk');
const db = monk('localhost:27017/codopolis');
db.on('error', function (err) { console.error(err); });
db.on('open', function () { console.log('open'); });
db.then(() => {
  console.log('Connected correctly to server')
})

// include a few things
var io = require('socket.io').listen(server);
var session = require('express-session');
var cookieParser = require('cookie-parser');
var RedisStore = require("connect-redis")(session);
var map = require('./server/map.js');
var users = require('./routes/users');


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

var sessionMiddleware = session({
    secret: 'samwise',
    resave: false,
    saveUninitialized: true
    // store: new RedisStore()
});
io.use(function(socket, next) {
    sessionMiddleware(socket.request, socket.request.res, next);
});

app.use(sessionMiddleware);

// Make our db accessible to our router
app.use(function (req, res, next) {
    req.db = db;
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// For login API
app.use('/users', users);

// Global Variables
var unitWidth = 60;
var unitHeight = 100;
var numConnected = 0;
var alreadySending = false;
const speed = 30;
const damage = 30;
var sAddresses = {};

app.use(cookieParser());

// set up static file serving from the public directory
app.use('/static', express.static(__dirname + '/public'));

map.readMap();
// Setup Routing for main page
app.get('/', function(req, res){
  if(!req.session.user) {
    // Show Login
    res.sendFile(__dirname + '/login.html');
  }
  else {
    res.cookie('userId', req.session.user);
    res.cookie('MAP', map.map);
    if(newChar(req.session.user)) {
      makeChar(req.session.user);
    };
    res.sendFile(__dirname + '/index.html');
  }
});

//  ------------------ mapData Format  ----------------------
//  curId: int          -> specifies the next id to be created by new player
//  units: {
//   id: {              -> id of the units
//      x: int          -> x-coord of unit
//      y: int          -> y-coord of unit
//      ll: bool        -> var for looking right
//      timeout: int    -> time left before another shot
//      health: int     -> amount of health left
//      loggedIn: bool  -> determines if logged in or not
//      }
//    },
//  },
//  curMId: int
//  missles: {
//    id: { int         -> id of missle
//      sender: int     -> id of the sender
//      curX: int       -> current x-coord
//      curY: int       -> current y-coord
//      dX: int         -> travel speed x
//      dY: int         -> travel speed y
//      dist: int       -> distance traveled so far
//      type: string    -> projectile type
//    },
//  map: map
//  ----------------------------------------------------------


// FORMATS
// var hitsF = {sender: 0, missle: 0, unit: 0};
var misslesF = {sender: 0, curX: 0, curY: 0, dX: 0, dY: 0, dist: 0, type: "A"}

var mapData = {
  curId: 0,
  units: {},
  curMId: 0,
  missles: {},
  setMap: true
};
// hits = [];

io.on('connection', function(socket){
  let newClient = {socket: socket.id};
  pushIfNew(newClient);
  socket.on('appData', function(msg){
    // Set idle timeout
    if(sAddresses[socket.id]) {
      sAddresses[socket.id].idle = 0;

      if(msg.mapSet) {
        sAddresses[socket.id].data.setMap = false;
        delete sAddresses[socket.id].data.map;
      }
    }

    // Need to validate data structure here for incoming data (msg)
    if(msg.unit.alive == true) {
      if(mapData.units[msg.unit.id] != null) {
        mapData.units[msg.unit.id].alive = true;
      }
    }

    if(mapData.units[msg.unit.id] == null) {
      mapData.units[msg.unit.id] = msg.unit;
      mapData.units[msg.unit.id].missles.timeout = 0;
    }

    mapData.units[msg.unit.id].up= msg.unit.up;
    mapData.units[msg.unit.id].right = msg.unit.right
    mapData.units[msg.unit.id].ll = msg.unit.ll;
    mapData.units[msg.unit.id].loggedIn = true;

    // Add a missle if there
    if(msg.unit.missles == undefined) {
      mapData.units[msg.unit.id].missles = {};
    }
    else {
      shoot(msg);
    }

    // if building add a wall
    if(msg.unit.build.type != 0) {
      build(msg);
    }

    // TODO: Push hit checking to the front end and validate here
    // if(validate(hitsF, msg.hits)) {
    //   console.log("validated hits");
    //   hits.push(msg.hits);
    // }
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
  pushIfNew(socket.id);
  if(!alreadySending) {
    setInterval(() => {
      if(numConnected > 0) {
        processData();

        // JSON method
        var keys = Object.keys(sAddresses);
        for(let j=0;j<keys.length;j++) {
          var key = keys[j];
          sAddresses[key].idle++;
          sAddresses[key].data.units = mapData.units;
          sAddresses[key].data.missles = mapData.missles;
          sAddresses[key].data.builds = mapData.builds;
          io.to(key).emit('appData', sAddresses[key].data);
          delete sAddresses[key].data.builds;
          if(sAddresses[key] != null) {
            if(sAddresses[key].idle > 30) {
              delete sAddresses[key];
            }
          }
        }

      };
    }, speed);
    alreadySending = true;
  }
}

function pushIfNew(socket) {
  if(sAddresses[socket] == null)
    sAddresses[socket] = {data: {map: map.map, setMap: true}, idle: 0};
}

function processData() {
  // needs to test hits sent from front ends

  if(mapData.units != null) {
    var keys = Object.keys(mapData.units);
    for(var i=0;i<keys.length;i++){
      var key = keys[i];

      // Only look at units currently logged in
      if(mapData.units[key].loggedIn == true) {

        // Process hits
        var keys2 = Object.keys(mapData.missles);
        for(let j=0; j<keys2.length; j++) {
          var key2 = keys2[j];
          var missle = mapData.missles[key2];
          if(validate(misslesF, missle)) {
            if(missle.sender != key) {
              if(hitUnit(missle.curX, missle.curY, mapData.units[key])) {
                delete mapData.missles[key2];
                mapData.units[key].health -= damage;
                if(mapData.units[key].health < 0) {
                  die(key);
                }
              }
            }
          }
        }

        // Process units
        let beforeX = mapData.units[key].x;
        if(canGo(mapData.units[key].x + mapData.units[key].right, mapData.units[key].y)) {
          mapData.units[key].x += mapData.units[key].right;
        }
        if(canGo(beforeX, mapData.units[key].y - mapData.units[key].up)) {
          mapData.units[key].y -= mapData.units[key].up;
        }
      }
    }
  }

  // Process Missles
  if(mapData.missles != null) {
    var keys = Object.keys(mapData.missles);
    for(let j=0;j<keys.length;j++) {
      var key = keys[j];
      if(mapData.missles[key].curX != null) {
        var missle = mapData.missles[key];
        mapData.missles[key].curX = missle.curX + missle.dX;
        mapData.missles[key].curY = missle.curY + missle.dY;
        mapData.missles[key].dist++;
        if( mapData.missles[key].dist > 30 || hitWall(mapData.missles[key].curX, mapData.missles[key].curY)) {
          delete mapData.missles[key];
        }
      }
    }
  }

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
  if(map.map[parseInt(iX/100)][parseInt(iY/100)] == 0) {
    return false;
  }
  if(map.map[parseInt(iX/100)][parseInt(iY/100)].type == 3) {
    return false;
  }
  return true;
}

function die(unit) {
  mapData.units[unit] = {
    x: 500,
    y: 350,
    ll: true,
    right: 0,
    up: 0,
    health: 100,
    timeout: 0,
    alive: false,
    loggedIn: true
  };
}

// If all four corners are clear return true, else false
function canGo(iX, iY) {
  if(isClear(map.map[parseInt((iX+20)/100)][parseInt(iY/100)])
  && isClear(map.map[parseInt((iX+20)/100)][parseInt((iY+99)/100)])
  && isClear(map.map[parseInt((iX+80)/100)][parseInt((iY)/100)])
  && isClear(map.map[parseInt((iX+80)/100)][parseInt((iY+99)/100)])) {
    return true;
  }
  return false;
}

function isClear(tile) {
  if(tile == 0)
    return true;
  if(tile.type == 3)
    return true;
  return false;
}

function makeChar(id) {
  mapData.units[id] = {
    x: 500,
    y: 350,
    ll: true,
    right: 0,
    up: 0,
    health: 100,
    timeout: 0,
    alive: false
  }
}

function newChar(id) {
  if(mapData.units[id] != null) {
    return false;
  }
  return true;
}

function shoot(msg) {

  // first check timeout
  if(mapData.units[msg.unit.id].timeout < 1) {

    // Then look through missles
    var keys = Object.keys(msg.unit.missles);
    for(var i=0;i<keys.length;i++){
      var key = keys[i];
      // if theres a new missle
      if(msg.unit.missles[key].shooting) {
        // add the new missle to the json
        mapData.curMId++;
        let aMissle = {
          sender: msg.unit.id,
          curX: mapData.units[msg.unit.id].x + 50,
          curY: mapData.units[msg.unit.id].y + 50,
          dX: msg.unit.missles[key].dX,
          dY: msg.unit.missles[key].dY,
          dist: 0,
          type: msg.unit.missles[key].type
        };
        mapData.missles[mapData.curMId] = aMissle;
        mapData.units[msg.unit.id].timeout = 30;
      }
    }
  }
  else {
    mapData.units[msg.unit.id].timeout--;
  }
}

function build(msg) {
  map.change(msg.unit.build.type, msg.unit.build.x, msg.unit.build.y);
  console.log(msg.unit.build.type);
  mapData.builds = {type: msg.unit.build.type, x: msg.unit.build.x, y: msg.unit.build.y};
}

function validate(format, input) {
  if(input == undefined) {
    return false;
  }
  var keys = Object.keys(format);
  for(var i=0;i<keys.length;i++){
    var key = keys[i];
    if(input[key] == null) {
      return false;
    }
    else {
      if(typeof format[key] === 'object') {
        if(!validate(format[key], input[key]))
          return false;
      }
    }
  }
  return true;
}

module.exports = app;
