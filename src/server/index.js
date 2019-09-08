const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const crypto = require('crypto');
const cors = require('cors');
const path = require('path');

const server = app.listen(3000, function() {
    console.log("server started on port 3000");
});

//Database Stuff
const mongo = require('mongodb');
const monk = require('monk');
const db = monk('localhost:27017/codopolis');
db.on('error', function (err) { console.error(err); });
db.on('open', function () { console.log('open'); });
db.then(() => {
  console.log('Connected correctly to server');
})

// include a few things
const io = require('socket.io').listen(server);
const session = require('express-session');
const cookieParser = require('cookie-parser');
const RedisStore = require("connect-redis")(session);
const map = require('./map.js');
const users = require('./users');
const utils = require('./utility.js');
const controller = require('./controller.js');
const CONSTANTS = require('../shared/constants.js');
// const rooms = require('./rooms.js');

// let newRoom = new rooms.Room(["player A"], "map");
// console.log("players", newRoom.players);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

var sessionMiddleware = session({
    secret: 'samwise',
    resave: false,
    saveUninitialized: true
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
app.use('/users', users.router);

// Global Variables
let numConnected = 0;
let alreadySending = false;
let sAddresses = {};
let charsLoaded = false;
let aiMade = false;
let win = {won: false, user: "", reset: CONSTANTS.RESETINTERVAL};

app.use(cookieParser());

// set up static file serving from the public directory
console.log("Dirname to serve public", path.resolve( './src/public'));
app.use('/static', express.static(path.resolve( './src/public')));

map.readMap().then( () => {
  map.insertDBMap(db);
});
map.readDBMap(db, 'game');
map.readMap("game");

// load characters
loadChars();

// load AIs
loadAIs();

// Setup Routing for main page
app.get('/', function(req, res){
  if(!req.session.user) {
    req.session.user = 1;
    console.log("cookie", JSON.stringify(req.cookies));
    // Show Login
    // res.sendFile(__dirname + '/public/html/login.html');
    res.send({data: "no session"});
  }
  else {
    req.session.user++;
    console.log("session", req.session.user);
    res.send({data: "session here"});
    // res.cookie('userId', req.session.user);
    // res.cookie('MAP', map.map);
    // if (!charLoaded(req.session.user)) {
    //   console.log("loading character");
    //   users.loadChar(req.session.user, db).then( () => {
    //     res.sendFile(__dirname + '/public/html/index.html');
    //   });
    // }
    // else {
    //   res.sendFile(__dirname + '/public/html/index.html');
    // }
  }
});
//
// app.get('/rooms', function(req, res) {
//   res.sendFile(__dirname + '/public/html/rooms.html');
// })

io.on('connection', function(socket){
  let newClient = {socket: socket.id};
  pushIfNew(newClient);
  // socket.on('ai', function(data) {
  //   ai.send(data);
  // })

  socket.on('appData', function(msg){
    // Set idle timeout
    if(sAddresses[socket.id]) {
      sAddresses[socket.id].idle = 0;
      if(msg.unit.id) {
        sAddresses[socket.id].unit = msg.unit.id;
      }

      if(msg.mapSet) {
        sAddresses[socket.id].data.setMap = false;
        delete sAddresses[socket.id].data.map;
      }
    }

    // Need to validate data structure here for incoming data (msg)
    if(msg.unit.alive == true) {
      if(map.mapData.units[msg.unit.id] != null) {
        map.mapData.units[msg.unit.id].alive = true;
      }
    }

    if(msg.unit && map.mapData.units[msg.unit.id]) {
      map.mapData.units[msg.unit.id].newX = msg.unit.newX;
      map.mapData.units[msg.unit.id].newY = msg.unit.newY;
      map.mapData.units[msg.unit.id].ll = msg.unit.ll;
      map.mapData.units[msg.unit.id].loggedIn = true;
      map.mapData.units[msg.unit.id].drainFlag = msg.unit.drainFlag;
    }

    // Add a missle if there
    if(msg.unit.missles == undefined) {
      map.mapData.units[msg.unit.id].missles = {};
    }
    else {
      controller.shoot(msg);
    }

    // if building add a wall
    if(msg.unit.build && msg.unit.build.type != 0) {
      controller.build(msg);
    }

    if(msg.ai) {
      msg.ai.forEach( ai => {
        if(map.mapData.ai[ai.id]) {
          map.mapData.ai[ai.id].newX = ai.newX;
          map.mapData.ai[ai.id].newY = ai.newY;
          map.mapData.ai[ai.id].ll = ai.ll;
          map.mapData.ai[ai.id].loggedIn = true;
          if(ai.missles == undefined) {
            // console.log("missles undefined");
            map.mapData.ai[ai.id].missles = {};
          }
          else {
            // console.log("missles", ai.missles);
            controller.aiShoot(ai);
          }
        }
      });
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

function checkWinCondition() {
  let leadUsers = {};
  let leadUser = "";
  let leadingAmount = 0;
  map.mapData.flags.map( (flag, i) => {
    if (flag.owner != null && flag.owner != "") {
      if (leadUsers[flag.owner]) {
        leadUsers[flag.owner]++;
      }
      else {
        leadUsers[flag.owner] = 1;
      }
      if (leadUsers[flag.owner] > leadingAmount) {
        leadingAmount = leadUsers[flag.owner];
        leadUser = flag.owner;
      }
    }
  });
  if(leadingAmount > (map.mapData.flags.length * CONSTANTS.WINPERCENTAGE)) {
    win.won = true;
    win.user = leadUser;
  }
};

// Should try to see if map is different before sending as well to avoid extra emits
// Also should try to send different data depending on the person
function batchSend(socket) {
  let count = 0;
  pushIfNew(socket.id);
  if(!alreadySending) {
    setInterval(() => {
      // console.log("units", map.mapData.units);
      if(numConnected > 0) {
        count++;
        if(count >= CONSTANTS.SAVEINTERVAL) {
          count = 0;
          saveActive();
        }
        // Process data once per iteration
        controller.processData();
        // Check win conditions once per iteration
        checkWinCondition();

        if(win.won) {
          if(win.reset > 0) {
            win.reset--;
          }
          else {
            reset();
          }
        }
        // JSON method
        var keys = Object.keys(sAddresses);
        for(let j=0;j<keys.length;j++) {
          var key = keys[j];
          sAddresses[key].data.win = win;
          if (win.won) {
            sAddresses[key].idle = 0;
            io.to(key).emit('appData', sAddresses[key].data);
          }
          else {
            sAddresses[key].idle++;
            sAddresses[key].data.units = map.mapData.units;
            sAddresses[key].data.ai = map.mapData.ai;
            sAddresses[key].data.missles = map.mapData.missles;
            sAddresses[key].data.builds = map.mapData.builds;
            sAddresses[key].data.idle = sAddresses[key].idle;
            sAddresses[key].data.flags = map.mapData.flags;
            io.to(key).emit('appData', sAddresses[key].data);
            delete sAddresses[key].data.builds;
            if(sAddresses[key] != null) {
              if(sAddresses[key].idle > 30) { // Need to determine good logout timeperiod
                // delete map.mapData.units[sAddresses[key].unit];
                delete sAddresses[key];
              }
            }
          }
        }
      };
    }, CONSTANTS.SPEED);
    alreadySending = true;
  }
}

function pushIfNew(socket) {
  if(sAddresses[socket] == null)
    sAddresses[socket] = {data: {map: map.map, setMap: true}, idle: 0};
}

function charLoaded(id) {
  if(map.mapData.units[id] == null) {
    return false;
  }
  return true;
}

function lookupChar(id) {
  var collection = db.get('userlist');
  collection.find({id: id}, function(err, result){
  });
}

function loadChars() {
  return new Promise( function(resolve, reject) {
    charsLoaded = true;
    var collection = db.get('userlist');
    collection.find({} , function(err, result){
      result.map((unit) => {
        map.mapData.units[unit.username] = unit.char;
      });
      resolve(map.mapData.units);
    });
  });
}

function loadAIs() {
  return new Promise( function(resolve, reject) {
    aiLoaded = true;
    var collection = db.get('ai');
    collection.find({} , function(err, result){
      result.map((ai) => {
        console.log("Loading AI", ai);
        map.mapData.ai[ai._id] = ai;
      });
      resolve(map.mapData.ai);
    });
  });
}

function saveActive() {
  var collection = db.get('userlist');
  var keys = Object.keys(map.mapData.units);
  for(let i=0; i<keys.length; i++) {
    let key = keys[i];
    collection.update( {username: key}, { $set: { char: map.mapData.units[key] } } );
  }
}

function spawn(user) {

};

function reset() {
  controller.resetUnits();
  map.readMap("game").then( () => {
    win = {won: false, user: "", reset: CONSTANTS.RESETINTERVAL};
  });
};
