/**************************************************
** GAME VARIABLES
**************************************************/
var canvas,			// Canvas DOM element
	ctx,			// Canvas rendering context
	keys,			// Keyboard input
	localPlayer,	// Local player
	remotePlayers,	// Remote players
	isfinish,		// check if game has finish
	socket;			// Socket connection


/**************************************************
** GAME INITIALISATION
**************************************************/
function init() {
	// Declare the canvas and rendering context
	canvas = document.getElementById("gameCanvas");
	ctx = canvas.getContext("2d");

	// Maximise the canvas
	// canvas.width = 1024;
	// canvas.height = 768;
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	// Initialise keyboard controls
	keys = new Keys();

	// Calculate a random start position for the local player
	// The minus 5 (half a player size) stops the player being
	// placed right on the egde of the screen
	var startX = Math.round(Math.random()*(canvas.width-5)),
		startY = Math.round(Math.random()*(canvas.height-5));

	// Initialise the local player
	localPlayer = new Player(startX, startY);

	// Initialise socket connection
	socket = io();

	// Initialise remote players array
	remotePlayers = [];

	// Start listening for events
	setEventHandlers();
};


/**************************************************
** GAME EVENT HANDLERS
**************************************************/
var setEventHandlers = function() {
	// Mouse
	window.addEventListener("mousedown", onMouseDown, false);
	window.addEventListener("mouseup", onMouseUp, false);
	// Keyboard
	window.addEventListener("keydown", onKeydown, false);
	window.addEventListener("keyup", onKeyup, false);

	// Window resize
	window.addEventListener("resize", onResize, false);

	// Socket connection successful
	socket.on("connect", onSocketConnected);

	// Socket disconnection
	socket.on("disconnect", onSocketDisconnect);

	// New player message received
	socket.on("new player", onNewPlayer);

	// Player move message received
	socket.on("move player", onMovePlayer);

	// Player removed message received
	socket.on("remove player", onRemovePlayer);

	// Player removed message received
	socket.on("new zombie", newZombie);

	// Player removed message received
	socket.on("end", endGame);
};

// Keyboard key down
function onKeydown(e) {
	if (localPlayer) {
		keys.onKeyDown(e);
	};
};

// Keyboard key up
function onKeyup(e) {
	if (localPlayer) {
		keys.onKeyUp(e);
	};
};

// Mouse down
function onMouseDown(e) {
	if (localPlayer) {
		keys.onMouseDown(e, localPlayer.getX(), localPlayer.getY());
	};
};

// Mouse up
function onMouseUp(e) {
	if (localPlayer) {
		keys.onMouseUp();
	};
};

// Browser window resize
function onResize(e) {
	// Maximise the canvas
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
};

// Socket connected
function onSocketConnected() {
	console.log("Connected to socket server");

	// Send local player data to the game server
	socket.emit("new player", {
		x: localPlayer.getX(), 
		y: localPlayer.getY(),
		isZombie: localPlayer.getZombie()
	});
};

// Socket disconnected
function onSocketDisconnect() {
	console.log("Disconnected from socket server");
};

// New player
function onNewPlayer(data) {
	console.log("New player connected:", data.id);

	// Initialise the new player
	var newPlayer = new Player(data.x, data.y, data.isZombie);
	newPlayer.id = data.id;

	// Add new player to the remote players array
	remotePlayers.push(newPlayer);
};

// Move player
function onMovePlayer(data) {
	var movePlayer = playerById(data.id);

	// Player not found
	if (!movePlayer) {
		console.log("Player not found:", data.id);
		return;
	};

	// Update player position
	movePlayer.setX(data.x);
	movePlayer.setY(data.y);
	movePlayer.setZombie(data.isZombie);
	movePlayer.setPoints(data.points);
	// check if is zombie
	if(!data.isZombie){
		checkIfZombie(movePlayer, movePlayer.getX, movePlayer.getY);
	}

};

// Remove player
function onRemovePlayer(data) {
	var removePlayer = playerById(data.id);

	// Player not found
	if (!removePlayer) {
		console.log("Player not found:", data.id);
		return;
	};

	// Remove player from array
	remotePlayers.splice(remotePlayers.indexOf(removePlayer), 1);
};

function newZombie(){
	var Player = playerById(data.id);
	Player.setZombie(true);
};

// End Game
function endGame(data){
	if(!isfinish){
		console.log('TheEnd');
		$('.options').hide();
		$('.end').show();
		$('.modal').modal();
		isfinish = true;
		// append result
		for(var i = 0; i < data.length; i++){
			$('.modal-body').append('<p>' + data[i].name + ' points: ' + data[i].points + ' </p>');
		}
	}
};


/**************************************************
** GAME ANIMATION LOOP
**************************************************/
function animate() {
	update();
	draw();

	// Request a new animation frame using Paul Irish's shim
	window.requestAnimFrame(animate);
};


/**************************************************
** GAME UPDATE
**************************************************/
function update() {
	// Update local player and check for change
	if (localPlayer.update(keys)) {
		updatePlayers();
	} else {
		updatePlayers();
	}
};

function updatePlayers(){
	// check new zombies
	checkZombies();

	if(localPlayer.getZombie() === false){
		// check if is zombie
		var amIZombie = checkIfZombie(localPlayer, localPlayer.getX, localPlayer.getY);
		if(amIZombie){
			socket.emit("new zombie");
		}
	}

	// Send local player data to the game server
	socket.emit("move player", {
		x: localPlayer.getX(), 
		y: localPlayer.getY(),
		isZombie: localPlayer.getZombie(),
		points: localPlayer.getPoints()
	});

	// check if game is over
	checkIfEnd();
};

function checkIfZombie(player, Fx, Fy) { // only local Player
	var result = false;
	// check collision
	var zombie = player.getZombie();
	// get zombie list
	var zombieList = getZombiesList();

	if(localPlayer.getZombie()){
		zombieList.push(localPlayer);
	}

	for(var i = 0; i < zombieList.length ; i++){
		if( (Fx() < zombieList[i].getX() + 50) &&  (Fx() > zombieList[i].getX() - 50) ){
			if( (Fy() < zombieList[i].getY() + 50) &&  (Fy() > zombieList[i].getY() - 50) ){
				if(player.getZombie() === false && player !== localPlayer && zombieList[i] === localPlayer){
					localPlayer.setPoints(10);
				}
				player.setZombie(true);
				result = true;
			}
		}
	}

	return result;

};

function checkZombies(){ // rest of players
	var humans = getHumansList();
	for(var i = 0; i < humans.length; i++){
		// check if is zombie
		checkIfZombie(humans[i], humans[i].getX, humans[i].getY);
	};
};

function checkIfEnd() {
	// get zombie list
	var zombieList = getZombiesList();
	if((localPlayer.getZombie()) && (zombieList.length == remotePlayers.length) && (!isfinish) ){
		socket.emit("end");
	}
};


/**************************************************
** GAME DRAW
**************************************************/
function draw() {
	// Wipe the canvas clean
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	//life setters
	ctx.fillStyle = 'white';
	ctx.font = "20px Georgia";
	// + 1 server zombie -> TO REMOVE, + 1 localplayer 
	ctx.fillText("Players: " + (remotePlayers.length + 1 - 1),10,40);
	ctx.fillText("Points: " + (localPlayer.getPoints()),10,70);

	// Draw the local player
	localPlayer.draw(ctx);

	// Draw the remote players
	var i;
	for (i = 0; i < remotePlayers.length; i++) {
		remotePlayers[i].draw(ctx);
	};
};


/**************************************************
** GAME HELPER FUNCTIONS
**************************************************/
// Find player by ID
function playerById(id) {
	var i;
	for (i = 0; i < remotePlayers.length; i++) {
		if (remotePlayers[i].id == id)
			return remotePlayers[i];
	};
	
	return false;
};

// Return Zombies (localPlayer not included)
function getZombiesList() {
	var i;
	var result = [];
	for (i = 0; i < remotePlayers.length; i++) {
		if (remotePlayers[i].getZombie() == true){
			result.push(remotePlayers[i]);
		}
	};
	return result;
};

// Return Humans (localPlayer not included)
function getHumansList() {
	var i;
	var result = [];
	for (i = 0; i < remotePlayers.length; i++) {
		if (remotePlayers[i].getZombie() != true){
			result.push(remotePlayers[i]);
		}
	};
	return result;
};

function restartGame() {
	console.log('restart');
	location.reload();
};
