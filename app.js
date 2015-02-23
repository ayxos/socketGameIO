/**************************************************
** NODE.JS REQUIREMENTS
**************************************************/
var app 		= require('express')()
	http 		= require('http').Server(app),
	io 			= require('socket.io')(http),
	express   	= require('express'),
	redis		= require("socket.io-redis"),
	util 		= require("util"),					// Utility resources (logging, object inspection, etc)
	Player 		= require("./Player").Player 	    // Player class
	log 		= require("color-util-logs")
	port		= 8005;

// Static files
app.use(express.static(__dirname + '/public'));

/**************************************************
** GAME VARIABLES
**************************************************/
var socket,		// Socket controller
	players;	// Array of connected players

var random = [1, -1];

/**************************************************
** GAME INITIALISATION
**************************************************/
function init() {
	// Create an empty array to store players
	players = [];

	// init zombie
	initZombie();

	// Set up Socket.IO to listen on port 8000
	// socket = io.listen(8000);
	socket = io.adapter(redis({ host: 'localhost', port: 6379 }));

	// Start listening for events
	setEventHandlers();

	// setInterval(function(){
	// 	moveZombie()
	// }, 10);
};


/**************************************************
** GAME EVENT HANDLERS
**************************************************/
var setEventHandlers = function() {
	// Socket.IO
	io.on('connection', onSocketConnection);
};

var initZombie = function(){
	//init zombie
	var newPlayer = new Player(Math.round(Math.random()*(1024-5)), Math.round(Math.random()*(768-5)), true);
	newPlayer.id = 1;
	// Add new player to the players array
	players.push(newPlayer);
}; 

var moveZombie = function(){
	// console.log('movie xom');
	var movePlayer = playerById(1);
	// Update player position

	var checkLimit = function(value, limit, callback){
		var newValue = value() + Math.floor(Math.random() * random.length);
		if(newValue > limit - 1){
			checkLimit(value, limit, callback);
		}
		else {
			callback(newValue);
		}
	};

	checkLimit(movePlayer.getX, 1024, movePlayer.setX);
	checkLimit(movePlayer.getY, 1024, movePlayer.setY);

	io.emit("move player", {
		id: movePlayer.id, 
		x: movePlayer.getX(), 
		y: movePlayer.getY(),
		isZombie: movePlayer.getZombie()
	});
}; 

// New socket connection
function onSocketConnection(client) {
	currentSocket = this;

	log.notice("New player has connected: " + client.id);

	// Listen for client disconnected
	client.on("disconnect", onClientDisconnect);

	// Listen for new player message
	client.on("new player", onNewPlayer);

	// Listen for move player message
	client.on("move player", onMovePlayer);
};

// Socket client has disconnected
function onClientDisconnect() {
	log.error("Player has disconnected: " + this.id);

	var removePlayer = playerById(this.id);

	// Player not found
	if (!removePlayer) {
		util.log("Player not found: " + this.id);
		return;
	};

	// Remove player from players array
	players.splice(players.indexOf(removePlayer), 1);

	// Broadcast removed player to connected socket clients
	io.emit("remove player", {id: this.id});
};

// New player has joined
function onNewPlayer(data) {
	// console.log('data', data);
	// console.log('players', players);
	// Create a new player
	var newPlayer = new Player(data.x, data.y, data.isZombie);
	newPlayer.id = this.id;

	// Broadcast new player to connected socket clients
	this.broadcast.emit("new player", {
		id: 	newPlayer.id, 
		x: 		newPlayer.getX(), 
		y: 		newPlayer.getY(),
		isZombie: 	newPlayer.getZombie()
	});

	// Send existing players to the new player
	var i, existingPlayer;
	for (i = 0; i < players.length; i++) {
		existingPlayer = players[i];
		this.emit("new player", {
			id: 	existingPlayer.id, 
			x: 		existingPlayer.getX(), 
			y: 		existingPlayer.getY(),
			isZombie: 	existingPlayer.getZombie()
		});
	};
		
	// Add new player to the players array
	players.push(newPlayer);
};

// Player has moved
function onMovePlayer(data) {
	// Find player in array
	var movePlayer = playerById(this.id);

	// Player not found
	if (!movePlayer) {
		log.warn("Player not found: " + this.id);
		return;
	}

	checkIfZombie(data);

	// Update player position
	movePlayer.setX(data.x);
	movePlayer.setY(data.y);
	movePlayer.setZombie(checkIfZombie(data));

	// Broadcast updated position to connected socket clients, attach to id
	this.broadcast.emit("move player", {
		id: movePlayer.id, 
		x: movePlayer.getX(), 
		y: movePlayer.getY(),
		isZombie: movePlayer.getZombie()
	});
};

function checkIfZombie(player) {
	// check collision
	var zombie = player.isZombie;
	// console.log('player', player.x);
	// console.log('zombi', zombieList[i].getX());
	var zombieList = getZombiesList();
	for(var i = 0; i < zombieList.length ; i++){
		if( (player.x < zombieList[i].getX() + 50) &&  (player.x > zombieList[i].getX() - 50) ){
			// console.log('peligro');
			if( (player.y < zombieList[i].getY() + 50) &&  (player.y > zombieList[i].getY() - 50) ){
				// console.log('is zombie');
				zombie = true;
			}
		}
	}
	return zombie;
};

/**************************************************
** GAME HELPER FUNCTIONS
**************************************************/
// Find player by ID
function playerById(id) {
	var i;
	for (i = 0; i < players.length; i++) {
		if (players[i].id == id)
			return players[i];
	};
	
	return false;
};

// Return Zombies
function getZombiesList() {
	var i;
	var result = [];
	for (i = 0; i < players.length; i++) {
		if (players[i].getZombie() == true)
			result.push(players[i]);
	};
	
	return result;
};


/**************************************************
** RUN THE GAME
**************************************************/
init();


/**************************************************
** SERVER ROUTES
**************************************************/
app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/index.html');
});

/**************************************************
** SERVER RUNNER
**************************************************/
http.listen(port, function(){
  console.log('listening on ', port);
});
