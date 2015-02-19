/**************************************************
** NODE.JS REQUIREMENTS
**************************************************/
var app 		= require('express')()
	http 		= require('http').Server(app),
	io 			= require('socket.io')(http),
	express   	= require('express'),
	util 		= require("util"),					// Utility resources (logging, object inspection, etc)
	Player 		= require("./Player").Player 	    // Player class
	log 		= require("color-util-logs");

// Static files
app.use(express.static(__dirname + '/public'));

/**************************************************
** GAME VARIABLES
**************************************************/
var socket,		// Socket controller
	players;	// Array of connected players


/**************************************************
** GAME INITIALISATION
**************************************************/
function init() {
	// Create an empty array to store players
	players = [];

	// Set up Socket.IO to listen on port 8000
	socket = io.listen(8000);

	// Start listening for events
	setEventHandlers();
};


/**************************************************
** GAME EVENT HANDLERS
**************************************************/
var setEventHandlers = function() {
	// Socket.IO
	io.on('connection', onSocketConnection);
};

// New socket connection
function onSocketConnection(client) {
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
	this.broadcast.emit("remove player", {id: this.id});
};

// New player has joined
function onNewPlayer(data) {
	// Create a new player
	var newPlayer = new Player(data.x, data.y, data.color);
	newPlayer.id = this.id;

	// Broadcast new player to connected socket clients
	this.broadcast.emit("new player", {
		id: 	newPlayer.id, 
		x: 		newPlayer.getX(), 
		y: 		newPlayer.getY(),
		color: 	newPlayer.getColor()
	});

	// Send existing players to the new player
	var i, existingPlayer;
	for (i = 0; i < players.length; i++) {
		existingPlayer = players[i];
		this.emit("new player", {
			id: 	existingPlayer.id, 
			x: 		existingPlayer.getX(), 
			y: 		existingPlayer.getY(),
			color: 	existingPlayer.getColor()
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
	};

	// Update player position
	movePlayer.setX(data.x);
	movePlayer.setY(data.y);

	// Broadcast updated position to connected socket clients, i dont need color, attach to id
	this.broadcast.emit("move player", {
		id: movePlayer.id, 
		x: movePlayer.getX(), 
		y: movePlayer.getY()
	});
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
http.listen(3000, function(){
  console.log('listening on *:3000');
});