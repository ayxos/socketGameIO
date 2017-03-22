/**************************************************
** NODE.JS REQUIREMENTS
**************************************************/
var app 		= require('express')()
	http 		= require('http').Server(app),
	// http 		= require('http').createServer({
	// 				key: fs.readFileSync('./cert/key.key'),
	// 				cert: fs.readFileSync('./cert/cert.crt'),
	// 				requestCert: false,
	// 				rejectUnauthorized: false
	// 			}, app),
	io 			= require('socket.io')(http),
	express   	= require('express'),
	util 		= require("util"),					// Utility resources (logging, object inspection, etc)
	Player 		= require("./Player").Player 	    // Player class
	log 		= require("color-util-logs"),
	device		= require('express-device'),
	port		= process.env.PORT || 8006,
	socket_port = process.env.PORT - 1 || 8005;



// app.set('view options', { layout: false });
// app.set('views', __dirname + '/public');

app.use(device.capture());
device.enableViewRouting(app);



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

	// Set up Socket.IO to listen on port 9000
	socket = io.listen(socket_port);

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
		isZombie: movePlayer.getZombie(),
		points: movePlayer.getPoints()
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

	// Listen for new player message
	client.on("new viewer", onNewViewer);

	// Listen for move player message
	client.on("move player", onMovePlayer);

	// Listen for new zombies transformation
	client.on("new zombie", onNewZombie);

	// End Game
	client.on("end", endGame);
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
		isZombie: 	newPlayer.getZombie(),
		points: newPlayer.getPoints()
	});

	// Send existing players to the new player
	var i, existingPlayer;
	for (i = 0; i < players.length; i++) {
		existingPlayer = players[i];
		this.emit("new player", {
			id: 	existingPlayer.id, 
			x: 		existingPlayer.getX(), 
			y: 		existingPlayer.getY(),
			isZombie: 	existingPlayer.getZombie(),
			points: existingPlayer.getPoints()
		});
	};
		
	// Add new player to the players array
	players.push(newPlayer);
};

// New viewer has joined
function onNewViewer(data) {
	// Send existing players to the new player
	var i, existingPlayer;
	for (i = 0; i < players.length; i++) {
		existingPlayer = players[i];
		this.emit("new player", {
			id: 	existingPlayer.id, 
			x: 		existingPlayer.getX(), 
			y: 		existingPlayer.getY(),
			isZombie: 	existingPlayer.getZombie(),
			points: existingPlayer.getPoints()
		});
	};
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

	// Update player position
	movePlayer.setX(data.x);
	movePlayer.setY(data.y);
	movePlayer.setZombie(data.isZombie);
	movePlayer.setPoints(data.points);
	// check
	if(!data.isZombie){
		checkIfZombie(movePlayer);
	}

	// Broadcast updated position to connected socket clients, attach to id
	this.broadcast.emit("move player", {
		id: movePlayer.id, 
		x: movePlayer.getX(), 
		y: movePlayer.getY(),
		isZombie: movePlayer.getZombie(),
		points: movePlayer.getPoints()
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
				player.setZombie(zombie);
			}
		}
	}
	return zombie;
};

function onNewZombie(){
	var movePlayer = playerById(this.id);
	movePlayer.setZombie(true);
	log.warn('new zombie', this.id);
	this.broadcast.emit("new zombie", this.id);
};

// End Game
function endGame(){
	// console.log('TheEnd');
	io.emit("end", getFinalList());
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

// Return Zombies
function getFinalList() {
	var i,
		aux = [],
		result = [];

	for (i = 0; i < players.length; i++) {
		log.warn(players[i].getPoints());
		if (players[i].getZombie() == true && players[i].id != 1){
			aux.push({
				name: players[i].id,
				points: players[i].getPoints()
			});
		}
		else {
			log.warn("Something wrong checking end Game with humans still alive");
		}
	};

	aux.sort(function(a, b){
		return b.points - a.points
	});
	
	return aux;
};


/**************************************************
** RUN THE GAME
**************************************************/
init();


/**************************************************
** SERVER ROUTES
**************************************************/
app.get('/', function(req, res){
	log.warn(req.device);
	switch(req.device.type){
		case 'phone':
			res.sendFile(__dirname + '/public/handy.html');
			break;
		default:
			res.sendFile(__dirname + '/public/index.html');
			break;
	}
});

app.get('/view', function(req, res){
	log.warn(req.device);
	res.sendFile(__dirname + '/public/viewer.html');
});

// Static files
app.use(express.static(__dirname + '/public'));

/**************************************************
** SERVER RUNNER
**************************************************/
http.listen(port, function(){
  console.log('listening on', port);
});
