
/**************************************************
** GAME VARIABLES
**************************************************/
var canvas,			// Canvas DOM element
	ctx,			// Canvas rendering context
	keys,			// Keyboard input
	playerName,     // Player name
	localPlayer,	// Local player
	remotePlayers,	// Remote players
	isfinish,		// check if game has finish
	gameStartTs,	// ms when game started
	gameDurationMs = 120000, // 2 minutes per level
	levelNumber = 1,
	images			= {},
	socket;			// Socket connection

// Offline/connection fallback state
var offlineMode = false;
var serverConnectTimeoutId = null;

function createNoopSocket(){
	var noop = function(){};
	return {
		emit: noop,
		on: noop,
		off: noop,
		removeListener: noop,
		disconnect: noop,
		connected: false
	};
}

function startOfflineMode(){
	if (offlineMode) return;
	offlineMode = true;
	try { if (serverConnectTimeoutId) { clearTimeout(serverConnectTimeoutId); serverConnectTimeoutId = null; } } catch(e){}
	try { if (socket && typeof socket.disconnect === 'function') { socket.disconnect(); } } catch(e){}
	socket = createNoopSocket();
	// Auto-start local game without waiting for server or modal input
	try { $('#name').val($('#name').val() || ('Player-' + Math.floor(Math.random()*1000))); } catch(e){}
	initGame();
}

// Level state
var obstacles = []; // array of {x,y,w,h}
var exitRect = null; // {x,y,w,h}
var weapons = []; // array of {x,y,type}
var currentWeapon = null; // {type, fireRateMs, lastShotTs}
var bullets = []; // array of {x,y,vx,vy,alive}
var lastMoveDir = {x: 1, y: 0};

/**************************************************
** GAME PRE-SET
**************************************************/
var setInitHandlers = function() {
	// Declare the canvas and rendering context
	canvas = document.getElementById("gameCanvas");
	ctx = canvas.getContext("2d");
	// Maximise the canvas
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	// Initialise keyboard controls
	keys = new Keys();
	// Initialise socket connection
	socket = (typeof window !== 'undefined' && window.SOCKET_URL) ? io(window.SOCKET_URL) : io();
	// Socket connection successful
	socket.on("connect", onSocketConnected);
	// Detect server not available and fall back to offline/local mode
	socket.on && socket.on("connect_error", function(){ startOfflineMode(); });
	socket.on && socket.on("connect_timeout", function(){ startOfflineMode(); });
	// Additionally, guard with a timeout in case no events fire
	try { serverConnectTimeoutId = setTimeout(function(){ if (!socket || !socket.connected) { startOfflineMode(); } }, 2500); } catch(e){}
};

// Socket connected
function onSocketConnected() {
	console.log("Connected to socket server");
	try { if (serverConnectTimeoutId) { clearTimeout(serverConnectTimeoutId); serverConnectTimeoutId = null; } } catch(e){}
	$('.options').hide();
	$('.name').show();
	$('.modal').modal();
};

function initGame() {
	$('.modal').modal('hide');
	$('.options').show();
	$('.name').hide();
	playerName = $('#name').val();
	$('p#playerName').text('Name: ' + playerName)
	// init
	init();
	animate();
	gameStartTs = Date.now();
	// Send local player data to the game server
	socket.emit("new player", {
		x: localPlayer.getX(),
		y: localPlayer.getY(),
		isZombie: localPlayer.getZombie(),
		name: playerName
	});
}

/**************************************************
** GAME INITIALISATION
**************************************************/
function init() {
	// Initialise the local player
	localPlayer = new Player(200, 150, false, playerName);
	isfinish = false;
	if (typeof localPlayer.setLives === 'function') { localPlayer.setLives(3); }

	// Initialise remote players array
	remotePlayers = [];

	// Start listening for events
	setEventHandlers();

	// Level
	generateLevel();
};


/**************************************************
** GAME EVENT HANDLERS
**************************************************/
var setEventHandlers = function() {
	// Touch
	window.addEventListener("touchstart", onMouseDown, false);
	window.addEventListener("touchend", onMouseUp, false);
	// Mouse
	window.addEventListener("mousedown", onMouseDown, false);
	window.addEventListener("mouseup", onMouseUp, false);
	// Keyboard
	window.addEventListener("keydown", onKeydown, false);
	window.addEventListener("keyup", onKeyup, false);

	// Window resize
	window.addEventListener("resize", onResize, false);

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
		if (e.keyCode === 32) { // space
			tryAttack();
		}
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
	e.preventDefault();
	if (localPlayer) {
		keys.onMouseDown(e, localPlayer.getX(), localPlayer.getY());
	};
};

// Mouse up
function onMouseUp(e) {
	e.preventDefault();
	if (localPlayer) {
		keys.onMouseUp();
	};
};

// Browser window resize
function onResize(e) {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	generateLevel();
};

// Socket disconnected
function onSocketDisconnect() {
	console.log("Disconnected from socket server");
};

// New player
function onNewPlayer(data) {
	console.log("New player connected:", data.id);
	var newPlayer = new Player(data.x, data.y, data.isZombie, data.name);
	newPlayer.id = data.id;
	remotePlayers.push(newPlayer);
};

// Move player
function onMovePlayer(data) {
	var movePlayer = playerById(data.id);
	if (!movePlayer) {
		console.log("Player not found:", data.id);
		return;
	};
	movePlayer.setX(data.x);
	movePlayer.setY(data.y);
	movePlayer.setZombie(data.isZombie);
	movePlayer.setPoints(data.points);
	if (typeof movePlayer.setLives === 'function' && typeof data.lives !== 'undefined') {
		movePlayer.setLives(data.lives);
	}
	if(!data.isZombie){
		checkIfZombie(movePlayer, movePlayer.getX, movePlayer.getY);
	}
};

// Remove player
function onRemovePlayer(data) {
	var removePlayer = playerById(data.id);
	if (!removePlayer) {
		console.log("Player not found:", data.id);
		return;
	};
	remotePlayers.splice(remotePlayers.indexOf(removePlayer), 1);
};

function newZombie(data){
	var id = (data && data.id) ? data.id : data;
	var PlayerInstance = playerById(id);
	if (PlayerInstance) { PlayerInstance.setZombie(true); }
};

// End Game
function endGame(data){
	if(!isfinish){
		console.log('TheEnd');
		$('.options').hide();
		$('.end').show();
		$('.modal').modal();
		isfinish = true;
		if (Array.isArray(data)) {
			for(var i = 0; i < data.length; i++){
				$('.modal-body').append('<p>' + data[i].name + ' points: ' + data[i].points + ' </p>');
			}
		}
	}
};


/**************************************************
** GAME ANIMATION LOOP
**************************************************/
function animate() {
	update();
	draw();
	window.requestAnimFrame(animate);
};


/**************************************************
** GAME UPDATE
**************************************************/
function update() {
	updateLocalMovement();
	updatePlayers();
	updateTimer();
	updateBullets();
	checkWeaponPickup();
	checkExitReached();
};

function updateLocalMovement(){
	if (!localPlayer) { return; }
	var dx = 0, dy = 0;
	if (keys.up) { dy -= 4; }
	if (keys.down) { dy += 4; }
	if (keys.left) { dx -= 4; }
	if (keys.right) { dx += 4; }
	if (dx !== 0 || dy !== 0) {
		var len = Math.sqrt(dx*dx + dy*dy) || 1;
		dx = (dx/len) * 4;
		dy = (dy/len) * 4;
		lastMoveDir = { x: Math.sign(dx) || 0, y: Math.sign(dy) || 0 };
		tryMove(localPlayer, dx, dy);
	}
}

function tryMove(player, dx, dy){
	var nextX = player.getX() + dx;
	var nextY = player.getY() + dy;
	var bounds = { x: nextX - 16, y: nextY - 16, w: 32, h: 32 };
	if (!collidesWithObstacles(bounds)) {
		player.setX(nextX);
		player.setY(nextY);
	}
}

function collidesWithObstacles(rect){
	for (var i=0;i<obstacles.length;i++){
		var o = obstacles[i];
		if (rectsOverlap(rect, o)) return true;
	}
	return false;
}

function rectsOverlap(a,b){
	return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function updatePlayers(){
	// check new zombies
	checkZombies();

	if(localPlayer.getZombie() === false){
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
		points: localPlayer.getPoints(),
		lives: (typeof localPlayer.getLives === 'function') ? localPlayer.getLives() : undefined
	});

	// check if game is over
	checkIfEnd();
};

function checkIfZombie(player, Fx, Fy) { // only local Player
	var result = false;
	var zombie = player.getZombie();
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
				if (player === localPlayer && typeof localPlayer.decrementLife === 'function') {
					localPlayer.decrementLife();
				}
				result = true;
			}
		}
	}
	return result;
};

function checkZombies(){ // rest of players
	var humans = getHumansList();
	for(var i = 0; i < humans.length; i++){
		checkIfZombie(humans[i], humans[i].getX, humans[i].getY);
	};
};

function checkIfEnd() {
	var zombieList = getZombiesList();
	var timeExpired = (Date.now() - (gameStartTs || Date.now())) >= gameDurationMs;
	if((localPlayer.getZombie()) && (zombieList.length == remotePlayers.length) && (!isfinish) ){
		socket.emit("end");
	}
	if (timeExpired && !isfinish) {
		isfinish = true;
		$('.options').hide();
		$('.end').show();
		$('.modal').modal();
	}
};

function updateTimer() {
	if (isfinish) { return; }
	var elapsed = Date.now() - (gameStartTs || Date.now());
	if (elapsed >= gameDurationMs) {
		socket.emit("end");
	}
}

function updateBullets(){
	// move bullets
	for (var i=bullets.length-1; i>=0; i--){
		var b = bullets[i];
		if (!b.alive) { bullets.splice(i,1); continue; }
		b.x += b.vx;
		b.y += b.vy;
		if (b.x < 0 || b.y < 0 || b.x > canvas.width || b.y > canvas.height) { b.alive = false; bullets.splice(i,1); continue; }
		// collide with obstacles
		var br = {x:b.x-4, y:b.y-4, w:8, h:8};
		if (collidesWithObstacles(br)) { b.alive = false; bullets.splice(i,1); continue; }
		// collide with zombies
		for (var j=0;j<remotePlayers.length;j++){
			var rp = remotePlayers[j];
			if (rp.getZombie() === true){
				var zr = {x: rp.getX()-16, y: rp.getY()-16, w:32, h:32};
				if (rectsOverlap(br, zr)){
					localPlayer.setPoints(5);
					b.alive = false;
					bullets.splice(i,1);
					break;
				}
			}
		}
	}

}

function tryAttack(){
	if (!currentWeapon) { return; }
	var now = Date.now();
	if (!currentWeapon.lastShotTs || (now - currentWeapon.lastShotTs) >= (currentWeapon.fireRateMs || currentWeapon.cooldownMs)){
		currentWeapon.lastShotTs = now;
		if (currentWeapon.isMelee){
			performMeleeHit(currentWeapon);
		} else {
			var speed = 10;
			var dir = normalizeVector(lastMoveDir.x, lastMoveDir.y);
			if (dir.x === 0 && dir.y === 0) { dir = {x:1,y:0}; }
			bullets.push({ x: localPlayer.getX(), y: localPlayer.getY(), vx: dir.x*speed, vy: dir.y*speed, alive: true });
		}
	}
}

function normalizeVector(x,y){
	var m = Math.sqrt(x*x+y*y) || 1;
	return {x: x/m, y: y/m};
}

function checkWeaponPickup(){
	if (!localPlayer) return;
	var pr = {x: localPlayer.getX()-16, y: localPlayer.getY()-16, w:32, h:32};
	for (var i=weapons.length-1;i>=0;i--){
		var w = weapons[i];
		var wr = {x:w.x-12,y:w.y-12,w:24,h:24};
		if (rectsOverlap(pr, wr)){
			currentWeapon = weaponStats(w.type);
			weapons.splice(i,1);
		}
	}
}

function weaponStats(type){
	switch(type){
		case 'pistol': return { type:'pistol', fireRateMs: 300, lastShotTs: 0 };
		case 'rifle': return { type:'rifle', fireRateMs: 120, lastShotTs: 0 };
		case 'shotgun': return { type:'shotgun', fireRateMs: 500, lastShotTs: 0 };
		case 'knife': return { type:'knife', isMelee: true, range: 38, cooldownMs: 250, lastShotTs: 0 };
		case 'sword': return { type:'sword', isMelee: true, range: 56, cooldownMs: 350, lastShotTs: 0 };
		default: return { type:'pistol', fireRateMs: 300, lastShotTs: 0 };
	}
}

function performMeleeHit(weapon){
	var px = localPlayer.getX();
	var py = localPlayer.getY();
	var range = weapon.range || 40;
	for (var j=0;j<remotePlayers.length;j++){
		var rp = remotePlayers[j];
		if (rp.getZombie() !== true) { continue; }
		var dx = rp.getX() - px;
		var dy = rp.getY() - py;
		var dist2 = dx*dx + dy*dy;
		if (dist2 <= range*range){
			// award points higher for melee
			var pts = weapon.type === 'sword' ? 15 : 8;
			localPlayer.setPoints(pts);
		}
	}
}

function checkExitReached(){
	if (!exitRect || !localPlayer) return;
	var pr = {x: localPlayer.getX()-16, y: localPlayer.getY()-16, w:32, h:32};
	if (rectsOverlap(pr, exitRect) && localPlayer.getZombie() === false){
		nextLevel();
	}
}

function nextLevel(){
	levelNumber += 1;
	generateLevel();
	gameStartTs = Date.now();
}

function generateLevel(){
	// reset state
	obstacles = [];
	weapons = [];
	exitRect = null;
	bullets = [];
	currentWeapon = null;
	// Create random dungeon-like obstacles
	var numRects = 20 + Math.min(levelNumber*5, 60);
	for (var i=0;i<numRects;i++){
		var w = randInt(80, 200);
		var h = randInt(80, 200);
		var x = randInt(50, Math.max(60, canvas.width - w - 50));
		var y = randInt(50, Math.max(60, canvas.height - h - 50));
		var rect = {x:x,y:y,w:w,h:h};
		// avoid spawning over player start
		var startRect = {x:200-40,y:150-40,w:80,h:80};
		if (!rectsOverlap(rect, startRect)){
			obstacles.push(rect);
		}
	}
	// Place exit
	exitRect = { x: randInt(canvas.width-140, canvas.width-60), y: randInt(60, 140), w: 40, h: 40 };
	// Ensure not overlapping obstacles
	for (var tries=0; tries<20; tries++){
		if (!collidesWithObstacles(exitRect)) break;
		exitRect.x = randInt(canvas.width-140, canvas.width-60);
		exitRect.y = randInt(60, 140);
	}
	// Drop weapons
	var weaponCount = 3 + Math.min(levelNumber, 5);
	var types = ['pistol','rifle','shotgun','knife','sword'];
	for (var j=0;j<weaponCount;j++){
		var wx = randInt(60, canvas.width-60);
		var wy = randInt(60, canvas.height-60);
		var item = {x: wx, y: wy, type: types[randInt(0, types.length-1)]};
		var wr = {x:item.x-12,y:item.y-12,w:24,h:24};
		if (!collidesWithObstacles(wr)){
			weapons.push(item);
		}
	}
}

function randInt(min,max){
	return Math.floor(Math.random()*(max-min+1))+min;
}

/**************************************************
** GAME DRAW
**************************************************/
function draw() {
	// Wipe the canvas clean
	ctx.clearRect(0, 0, canvas.width, canvas.height);

	// Background
	ctx.fillStyle = '#1b1b1b';
	ctx.fillRect(0,0,canvas.width,canvas.height);

	// Obstacles
	ctx.fillStyle = '#2f2f2f';
	for (var i=0;i<obstacles.length;i++){
		var o = obstacles[i];
		ctx.fillRect(o.x, o.y, o.w, o.h);
	}

	// Exit (emoji)
	if (exitRect){
		ctx.font = '28px sans-serif';
		ctx.fillText('🚪', exitRect.x, exitRect.y + 28);
	}

	// Weapons (emoji)
	for (var w=0; w<weapons.length; w++){
		var it = weapons[w];
		ctx.font = '22px sans-serif';
		var emoji = '🔫';
		if (it.type === 'rifle') emoji = '🎯';
		if (it.type === 'shotgun') emoji = '💥';
		if (it.type === 'knife') emoji = '🔪';
		if (it.type === 'sword') emoji = '🗡️';
		ctx.fillText(emoji, it.x-11, it.y+8);
	}

	// Bullets (emoji)
	ctx.font = '18px sans-serif';
	for (var b=0;b<bullets.length;b++){
		var bl = bullets[b];
		ctx.fillText('•', bl.x-3, bl.y+4);
	}

	// HUD
	ctx.fillStyle = 'white';
	ctx.font = "20px Georgia";
	ctx.fillText("🧑‍🤝‍🧑 Players: " + remotePlayers.length, 10, 40);
	ctx.fillText("⭐ Points: " + (localPlayer.getPoints()), 10, 70);
	if (typeof localPlayer.getLives === 'function') {
		ctx.fillText("❤️ Lives: " + localPlayer.getLives(), 10, 100);
	}
	var remainingMs = Math.max(0, gameDurationMs - (Date.now() - (gameStartTs || Date.now())));
	var seconds = Math.ceil(remainingMs / 1000);
	ctx.fillText("⏱️ Time: " + seconds + 's', 10, 130);
	ctx.fillText("🗺️ Level: " + levelNumber, 10, 160);
	var weaponName = currentWeapon ? currentWeapon.type : 'none';
	var weaponEmoji = '🔫';
	if (weaponName === 'rifle') weaponEmoji = '🎯';
	if (weaponName === 'shotgun') weaponEmoji = '💥';
	if (weaponName === 'knife') weaponEmoji = '🔪';
	if (weaponName === 'sword') weaponEmoji = '🗡️';
	ctx.fillText("⚒️ Weapon: " + weaponEmoji + ' ' + weaponName, 10, 190);

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

function getList() {
	console.log(localPlayer, remotePlayers);
}

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