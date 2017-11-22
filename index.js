var express = require('express');
var app = express();
var server = app.listen(3000, function() {
    console.log("server started on port 3000");
});
var io = require('socket.io').listen(server);
var session = require('express-session')
var cookieParser = require('cookie-parser')

var numConnected = 0;
var mapData = {
  curId: 0,
  units: {}
};

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    mapData.units[msg.id] = msg;
    io.emit('chat message', mapData);
  });
  numConnected++;
  socket.on('disconnect', function(){
    numConnected--;
  });
});

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
