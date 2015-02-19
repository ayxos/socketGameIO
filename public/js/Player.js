/**************************************************
** GAME PLAYER CLASS
**************************************************/
var Player = function(startX, startY) {
	var id,
		x 				= startX,
		y 				= startY,
		moveAmount 		= 2,
		colorsArray 	= ['red', 'green', 'blue', 'orange', 'yellow'],
		playerColor 	= colorsArray[Math.floor(Math.random() * colorsArray.length)],
		zombi			= [true, false],
		isZombii		= zombi[Math.floor(Math.random() * zombi.length)];

	var prepareImg = function() {
		preparePlayer(isZombii);
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

	var getColor = function() {
		return playerColor;
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
		console.log('draw');
		showCharacter(ctx, x, y, isZombii);
	};

	// Define which variables and methods can be accessed
	return {
		getX: 	getX,
		getY: 	getY,
		setX: 	setX,
		setY: 	setY,
		update: update,
		draw: 	draw,
		getColor:  getColor
	}
};