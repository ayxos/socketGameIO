/**************************************************
** GAME PLAYER CLASS
**************************************************/
var Player = function(startX, startY, isZombie) {
	var id,
		x 				= startX,
		y 				= startY,
		moveAmount 		= 2,
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

	var setZombie = function(isZombie) {
		zombie = isZombie;
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
			x -= moveAmount;
		} else if (keys.right) {
			x += moveAmount;
		};

		return (prevX != x || prevY != y) ? true : false;
	};

	// Draw player
	var draw = function(ctx) {
		// console.log('draw');
		showCharacter(ctx, x, y, getZombie());
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
		setZombie: 	setZombie
	}
};