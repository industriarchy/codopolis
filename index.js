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
//  curId: int    -> specifies the next id to be created by new player
//  units: {
//   id: {        -> id of the units
//      x: int    -> x-coord of unit
//      y: int    -> y-coord of unit
//    },
//  },
//  missles: {
//    id:  {      -> id of missle
//      ownId: int -> id of owner
//      curX: int -> current x-coord
//      curY: int -> current y-coord
//      tarX: int -> target x-coord
//      tarY: int -> target y-coord
//      type: string -> projectile type
//    },
//  }
//  ----------------------------------------------------------

var mapData = {
  curId: 0,
  units: {},
  missles: {}
};

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    mapData.units[msg.id] = msg;
    // io.emit('chat message', mapData);
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
      if(numConnected > 0)
        io.emit('chat message', mapData);
    }, 30);
    alreadySending = true;
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
