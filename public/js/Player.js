/**************************************************
** GAME PLAYER CLASS
**************************************************/
var Player = function(startX, startY, isZombie, name) {
	console.log('new player', isZombie, name);
	var id,
		name 			= name,
		x 				= startX,
		y 				= startY,
		moveAmount 		= 4, // speed!
		isRight			= true,
		points 			= 0,
		lives			= 3,
		zombie			= isZombie ? true : false;

	var prepareImg = function() {
		preparePlayer(zombie);
	}();
	
	// Getters and setters
	var getX = function() {
		return x;
	};

	var getY = function() {
		return y;
	};

	var setX = function(newX) {
		x = newX;
	};

	var setY = function(newY) {
		y = newY;
	};

	var getZombie = function() {
		return zombie;
	};

	var setZombie = function(zombi) {
		zombie = zombi;
	};

	var getPoints = function() {
		return points;
	};

	var setPoints = function(extraPoints) {
		points += extraPoints;
	};

	var getLives = function() {
		return lives;
	};

	var setLives = function(newLives) {
		lives = newLives;
	};

	var decrementLife = function() {
		if (lives > 0) {
			lives -= 1;
		}
		return lives;
	};

	// Update player position
	var update = function(keys) {
		// Previous position
		var prevX = x,
			prevY = y;

		// Up key takes priority over down
		if (keys.up) {
			y -= moveAmount;
		} else if (keys.down) {
			y += moveAmount;
		};

		// Left key takes priority over right
		if (keys.left) {
			isRight = false;
			x -= moveAmount;
		} else if (keys.right) {
			isRight = true;
			x += moveAmount;
		};

		if(x > window.innerWidth || y > window.innerHeight){
			x = prevX;
			y = prevY;
		} 
			
		return (prevX != x || prevY != y) ? true : false;
		
	};

	// Draw player
	var draw = function(ctx, isHandy) {
		if(isHandy){
			// console.log(isHandy);
			showCharacter(ctx, isHandy.x, isHandy.y, getZombie(), name);
		}
		else{
			showCharacter(ctx, x, y, getZombie(), name);
		}
	};

	// Define which variables and methods can be accessed
	return {
		getX: 		getX,
		getY: 		getY,
		setX: 		setX,
		setY: 		setY,
		update: 	update,
		draw: 		draw,
		getZombie: 	getZombie,
		setZombie: 	setZombie,
		getPoints:  getPoints,
		setPoints:  setPoints,
		getLives:  getLives,
		setLives:  setLives,
		decrementLife: decrementLife
	}
};