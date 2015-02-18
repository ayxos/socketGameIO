var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var express        = require('express');

app.use(express.static(__dirname + '/'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/game.html');
});

io.on('connection', function(socket){
  socket.on('newPlayer', function(player){
  	console.log('new player', player);
  	io.emit('new player', player);
  });
  socket.on('updatePosition', function(pos){
  	console.log('new position', pos);
  	io.emit('new player', pos);
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
