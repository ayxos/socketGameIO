
/**************************************************
** GAME VARIABLES
**************************************************/
var canvas,            // Canvas DOM element
	ctx,            // Canvas rendering context
	keys,           // Keyboard/touch input
	playerName,     // Player name
	localPlayer,    // Local player
	remotePlayers,  // Remote players
	isfinish,       // check if game has finish
	gameStartTs,    // ms when game started
	gameDurationMs = 120000, // 2 minutes per level
	levelNumber = 1,
	images = {},
	socket;         // Socket connection

// Preferences from splash
var gamePrefs = { name: '', speed: 4, difficulty: 'normal', mode: 'offline' };
try {
	var rawPrefs = localStorage.getItem('zombi_prefs');
	if (rawPrefs) { gamePrefs = Object.assign(gamePrefs, JSON.parse(rawPrefs) || {}); }
} catch(e) {}

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

/**************************************************
** PRE-BOOT
**************************************************/
function setInitHandlers() {
	// Declare the canvas and rendering context
	canvas = document.getElementById("gameCanvas");
	ctx = canvas.getContext("2d");
	// Maximise the canvas
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	// Initialise keyboard controls
	keys = new Keys();
	// Initialise socket connection
	if (window.__FORCE_OFFLINE__ === true || gamePrefs.mode === 'offline') {
		offlineMode = true;
		socket = createNoopSocket();
		initGame();
	} else {
		// Optional: allow specifying socket server via ?server=http://host:port
		socket = (typeof window !== 'undefined' && window.SOCKET_URL) ? io(window.SOCKET_URL) : io();
		// Socket connection successful
		socket.on && socket.on("connect", onSocketConnected);
		// Detect server not available and fall back to offline/local mode
		socket.on && socket.on("connect_error", startOfflineMode);
		socket.on && socket.on("connect_timeout", startOfflineMode);
		// Additionally, guard with a timeout in case no events fire
		try { serverConnectTimeoutId = setTimeout(function(){ if (!socket || !socket.connected) { startOfflineMode(); } }, 2500); } catch(e){}
	}
}

function startOfflineMode(){
	if (offlineMode) return;
	offlineMode = true;
	try { if (serverConnectTimeoutId) { clearTimeout(serverConnectTimeoutId); serverConnectTimeoutId = null; } } catch(e){}
	try { if (socket && typeof socket.disconnect === 'function') { socket.disconnect(); } } catch(e){}
	socket = createNoopSocket();
	initGame();
}

/**************************************************
** SOCKET EVENTS
**************************************************/
function onSocketConnected() {
	try { if (serverConnectTimeoutId) { clearTimeout(serverConnectTimeoutId); serverConnectTimeoutId = null; } } catch(e){}
	initGame();
}

function onSocketDisconnect() {
	console.log("Disconnected from socket server");
}

/**************************************************
** GAME INIT & LOOP
**************************************************/
function initGame() {
	// Name from prefs (splash)
	playerName = gamePrefs.name || ('Player-' + Math.floor(Math.random()*1000));
	// init
	init();
	animate();
	gameStartTs = Date.now();
	// Send local player data to the game server
	socket.emit && socket.emit("new player", {
		x: localPlayer.getX(),
		y: localPlayer.getY(),
		isZombie: localPlayer.getZombie(),
		name: playerName
	});
}

function init() {
	// Initialise the local player
	localPlayer = new Player(200, 150, false, playerName);
	isfinish = false;
	if (typeof localPlayer.setLives === 'function') { localPlayer.setLives(3); }
	if (typeof localPlayer.setSpeed === 'function' && gamePrefs && gamePrefs.speed){ localPlayer.setSpeed(parseInt(gamePrefs.speed, 10)); }
	// Initialise remote players array
	remotePlayers = [];
	// Start listening for events
	setEventHandlers();
	// Level
	generateLevel();
}

function setEventHandlers() {
	// Touch
	window.addEventListener("touchstart", onTouchStart, false);
	window.addEventListener("touchend", onTouchEnd, false);
	// Mouse
	window.addEventListener("mousedown", onMouseDown, false);
	window.addEventListener("mouseup", onMouseUp, false);
	// Keyboard
	window.addEventListener("keydown", onKeydown, false);
	window.addEventListener("keyup", onKeyup, false);
	// Window resize
	window.addEventListener("resize", onResize, false);
	// Socket events
	socket.on && socket.on("disconnect", onSocketDisconnect);
	socket.on && socket.on("new player", onNewPlayer);
	socket.on && socket.on("move player", onMovePlayer);
	socket.on && socket.on("remove player", onRemovePlayer);
	socket.on && socket.on("new zombie", newZombie);
	socket.on && socket.on("end", endGame);
}

/**************************************************
** INPUT HANDLERS
**************************************************/
function onKeydown(e) {
	if (localPlayer) {
		keys.onKeyDown(e);
		if (e.keyCode === 32) { // space
			tryAttack();
		}
	}
}

function onKeyup(e) {
	if (localPlayer) {
		keys.onKeyUp(e);
	}
}

function onMouseDown(e) {
	if (e && e.preventDefault) e.preventDefault();
	if (localPlayer) {
		keys.onMouseDown(e, localPlayer.getX(), localPlayer.getY());
	}
}

function onMouseUp(e) {
	if (e && e.preventDefault) e.preventDefault();
	if (localPlayer) {
		keys.onMouseUp();
	}
}

function onTouchStart(ev){
	try { if (ev && typeof ev.preventDefault === 'function') ev.preventDefault(); } catch(e){}
	var touch = (ev && ev.touches && ev.touches[0]) ? ev.touches[0] : ev;
	var fakeEvent = { x: touch.clientX || touch.pageX || 0, y: touch.clientY || touch.pageY || 0 };
	onMouseDown(fakeEvent);
}

function onTouchEnd(ev){
	try { if (ev && typeof ev.preventDefault === 'function') ev.preventDefault(); } catch(e){}
	onMouseUp(ev || {});
}

// GameController integration for mobile/tablet
function onPadDown(direction) { if (localPlayer && keys && typeof keys.onPadDown === 'function') { keys.onPadDown(direction); } }
function onPadUp(direction) { if (localPlayer && keys && typeof keys.onPadUp === 'function') { keys.onPadUp(direction); } }
function onControllerDown(e) { if (localPlayer && keys && typeof keys.onControllerDown === 'function') { keys.onControllerDown(e); } }
function onControllerUp() { if (localPlayer && keys && typeof keys.onMouseUp === 'function') { keys.onMouseUp(); } }

function onResize(e) {
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	generateLevel();
}

/**************************************************
** SOCKET MSG HANDLERS
**************************************************/
function onNewPlayer(data) {
	var newPlayerObj = new Player(data.x, data.y, data.isZombie, data.name);
	newPlayerObj.id = data.id;
	remotePlayers.push(newPlayerObj);
}

function onMovePlayer(data) {
	var movePlayer = playerById(data.id);
	if (!movePlayer) return;
	movePlayer.setX(data.x);
	movePlayer.setY(data.y);
	movePlayer.setZombie(data.isZombie);
	if (typeof movePlayer.setPoints === 'function' && typeof data.points !== 'undefined') { movePlayer.setPoints(0); }
	if (typeof movePlayer.setLives === 'function' && typeof data.lives !== 'undefined') { movePlayer.setLives(data.lives); }
	if (!data.isZombie){
		checkIfZombie(movePlayer, movePlayer.getX, movePlayer.getY);
	}
}

function onRemovePlayer(data) {
	var removePlayer = playerById(data.id);
	if (!removePlayer) return;
	remotePlayers.splice(remotePlayers.indexOf(removePlayer), 1);
}

function newZombie(data){
	var id = (data && data.id) ? data.id : data;
	var p = playerById(id);
	if (p) { p.setZombie(true); }
}

function endGame(data){
	if(!isfinish){
		console.log('TheEnd');
		isfinish = true;
	}
}

/**************************************************
** LEVEL, TILEMAP & DRAW
**************************************************/
var obstacles = []; // array of {x,y,w,h}
var exitRect = null; // {x,y,w,h}
var weapons = []; // array of {x,y,type}
var currentWeapon = null; // {type, fireRateMs, lastShotTs}
var bullets = []; // array of {x,y,vx,vy,alive}
var lastMoveDir = {x: 1, y: 0};
// Tilemap (Pokémon-inspired)
var tileSize = 32;
var mapCols = 0, mapRows = 0;
var tileMap = []; // rows x cols of tile codes: 'G' grass, 'R' road, 'B' bush, 'K' rock, 'H' house, 'C' cave

function generateLevel(){
	// reset state
	obstacles = [];
	weapons = [];
	exitRect = null;
	bullets = [];
	currentWeapon = null;
	// Build Pokémon-inspired tilemap and collision from tiles
	generateTileMap();
	populateObstaclesFromTiles();
	// Place exit (top area)
	exitRect = { x: randInt(canvas.width-140, canvas.width-60), y: randInt(60, 140), w: 40, h: 40 };
	for (var tries=0; tries<20; tries++){
		if (!collidesWithObstacles(exitRect)) break;
		exitRect.x = randInt(canvas.width-140, canvas.width-60);
		exitRect.y = randInt(60, 140);
	}
}

function randInt(min,max){
	return Math.floor(Math.random()*(max-min+1))+min;
}

function generateTileMap(){
	mapCols = Math.ceil(canvas.width / tileSize);
	mapRows = Math.ceil(canvas.height / tileSize);
	tileMap = new Array(mapRows);
	for (var r=0; r<mapRows; r++){
		tileMap[r] = new Array(mapCols);
		for (var c=0; c<mapCols; c++){
			// Base grass
			var code = 'G';
			// Simple per-row roads
			if (r % 8 === 4) { code = 'R'; }
			// Scatter bushes
			if (Math.random() < 0.06) { code = 'B'; }
			// Scatter rocks
			if (Math.random() < 0.03) { code = 'K'; }
			tileMap[r][c] = code;
		}
	}
	// Place a house area
	var hx = randInt(3, Math.max(3, mapCols-8));
	var hy = randInt(3, Math.max(3, mapRows-8));
	for (var rr=hy; rr<hy+4 && rr<mapRows; rr++){
		for (var cc=hx; cc<hx+5 && cc<mapCols; cc++){
			tileMap[rr][cc] = 'H';
		}
	}
	// Place a cave entrance region
	var cx = randInt(2, Math.max(2, mapCols-6));
	var cy = randInt(2, Math.max(2, mapRows-6));
	for (var rr2=cy; rr2<cy+3 && rr2<mapRows; rr2++){
		for (var cc2=cx; cc2<cx+4 && cc2<mapCols; cc2++){
			tileMap[rr2][cc2] = 'C';
		}
	}
}

function populateObstaclesFromTiles(){
	// Impassable: bushes (B), rocks (K), houses (H), caves (C)
	obstacles = [];
	for (var r=0; r<mapRows; r++){
		for (var c=0; c<mapCols; c++){
			var t = tileMap[r][c];
			if (t === 'B' || t === 'K' || t === 'H' || t === 'C'){
				obstacles.push({ x: c*tileSize, y: r*tileSize, w: tileSize, h: tileSize });
			}
		}
	}
}

function drawTileMap(){
	for (var r=0; r<mapRows; r++){
		for (var c=0; c<mapCols; c++){
			var x = c*tileSize, y = r*tileSize;
			var t = tileMap[r][c];
			// Base grass
			if (t === 'G' || t === 'B' || t === 'K' || t === 'H' || t === 'C'){
				// subtle grass variation
				var shade = 135 + ((r+c) % 4) * 6;
				ctx.fillStyle = 'rgb(' + (shade-20) + ', ' + (shade+60) + ', ' + (shade-10) + ')';
				ctx.fillRect(x, y, tileSize, tileSize);
			}
			if (t === 'R'){
				// road: light brown with darker edges
				ctx.fillStyle = '#c8a676';
				ctx.fillRect(x, y, tileSize, tileSize);
				ctx.fillStyle = '#a98856';
				ctx.fillRect(x, y, tileSize, 3);
				ctx.fillRect(x, y+tileSize-3, tileSize, 3);
			}
			if (t === 'B'){
				// bush clumps
				ctx.fillStyle = '#2a7b3f';
				ctx.beginPath();
				ctx.arc(x+10, y+18, 8, 0, Math.PI*2);
				ctx.arc(x+18, y+14, 7, 0, Math.PI*2);
				ctx.arc(x+22, y+20, 9, 0, Math.PI*2);
				ctx.fill();
			}
			if (t === 'K'){
				// rock
				ctx.fillStyle = '#7c7c7c';
				ctx.beginPath();
				ctx.moveTo(x+6,y+24);
				ctx.lineTo(x+12,y+10);
				ctx.lineTo(x+24,y+14);
				ctx.lineTo(x+26,y+24);
				ctx.closePath();
				ctx.fill();
				ctx.fillStyle = 'rgba(255,255,255,0.2)';
				ctx.fillRect(x+14,y+14,4,3);
			}
			if (t === 'H'){
				// house tile: roof + walls
				ctx.fillStyle = '#b23b3b';
				ctx.fillRect(x, y, tileSize, tileSize/2);
				ctx.fillStyle = '#e6d5b8';
				ctx.fillRect(x+3, y+tileSize/2, tileSize-6, tileSize/2-2);
				ctx.fillStyle = '#6b5844';
				ctx.fillRect(x+tileSize/2-3, y+tileSize-12, 6, 10);
			}
			if (t === 'C'){
				// cave: dark opening with rocky rim
				ctx.fillStyle = '#5a4a3a';
				ctx.fillRect(x, y, tileSize, tileSize);
				ctx.fillStyle = '#1f1b18';
				ctx.beginPath();
				ctx.arc(x+tileSize/2, y+tileSize/2+4, 10, 0, Math.PI*2);
				ctx.fill();
			}
		}
	}
}

function rectsOverlap(a,b){ return !(a.x > b.x+b.w || a.x+a.w < b.x || a.y > b.y+b.h || a.y+a.h < b.y); }
function collidesWithObstacles(rect){ for (var i=0;i<obstacles.length;i++){ if (rectsOverlap(rect, obstacles[i])) return true; } return false; }

function draw() {
	// Wipe the canvas clean
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	// Background base
	ctx.fillStyle = '#8dd27b';
	ctx.fillRect(0,0,canvas.width,canvas.height);
	// Draw tile map
	drawTileMap();
	// Exit (emoji)
	if (exitRect){ ctx.font = '28px sans-serif'; ctx.fillText('🚪', exitRect.x, exitRect.y + 28); }
	// Draw the local player
	localPlayer.draw(ctx);
	// Draw the remote players
	for (var i = 0; i < remotePlayers.length; i++) { remotePlayers[i].draw(ctx); }
	// HUD
	ctx.fillStyle = 'white';
	ctx.font = "20px Georgia";
	ctx.fillText("🧑‍🤝‍🧑 Players: " + remotePlayers.length, 10, 40);
	ctx.fillText("⭐ Points: " + (localPlayer.getPoints()), 10, 70);
	if (typeof localPlayer.getLives === 'function') { ctx.fillText("❤️ Lives: " + localPlayer.getLives(), 10, 100); }
	var remainingMs = Math.max(0, gameDurationMs - (Date.now() - (gameStartTs || Date.now())));
	var seconds = Math.ceil(remainingMs / 1000);
	ctx.fillText("⏱️ Time: " + seconds + 's', 10, 130);
	ctx.fillText("🗺️ Level: " + levelNumber, 10, 160);
}

/**************************************************
** GAME LOOP & MOVE BROADCAST
**************************************************/
var lastSent = { x: null, y: null, ts: 0 };
function animate() {
	update();
	draw();
	window.requestAnimationFrame(animate);
}

function update(){
	// Update local player position
	if (!localPlayer) return;
	if (localPlayer.update(keys)){
		// Check collisions against impassable tiles
		var pr = { x: localPlayer.getX()-16, y: localPlayer.getY()-16, w: 32, h: 32 };
		if (collidesWithObstacles(pr)){
			// simple revert by nudging back
			if (keys.left) localPlayer.setX(localPlayer.getX()+localPlayer.moveAmount || 4);
			if (keys.right) localPlayer.setX(localPlayer.getX()-localPlayer.moveAmount || 4);
			if (keys.up) localPlayer.setY(localPlayer.getY()+localPlayer.moveAmount || 4);
			if (keys.down) localPlayer.setY(localPlayer.getY()-localPlayer.moveAmount || 4);
		}
	}
	// Broadcast movement (throttled)
	var now = Date.now();
	var lx = localPlayer.getX(), ly = localPlayer.getY();
	if ((lx !== lastSent.x || ly !== lastSent.y) && (now - lastSent.ts > 40)){
		lastSent = { x: lx, y: ly, ts: now };
		socket.emit && socket.emit("move player", {
			x: localPlayer.getX(),
			y: localPlayer.getY(),
			isZombie: localPlayer.getZombie(),
			points: localPlayer.getPoints(),
			lives: (typeof localPlayer.getLives === 'function') ? localPlayer.getLives() : undefined
		});
	}
}

/**************************************************
** COMBAT PLACEHOLDERS (SPACE to attack)
**************************************************/
function tryAttack(){ /* extend with weapons if desired */ }

/**************************************************
** HELPERS
**************************************************/
function playerById(id) {
	for (var i = 0; i < remotePlayers.length; i++) {
		if (remotePlayers[i].id == id) return remotePlayers[i];
	}
	return false;
}

function getZombiesList() {
	var result = [];
	for (var i = 0; i < remotePlayers.length; i++) {
		if (remotePlayers[i].getZombie() == true) result.push(remotePlayers[i]);
	}
	return result;
}