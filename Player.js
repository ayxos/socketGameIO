/**************************************************
** GAME PLAYER CLASS
**************************************************/
var Player = function(startX, startY, playerColor) {
	var x = startX,
		y = startY,
		color = playerColor,
		id;

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
		return color;
	};

	// Future feature
	// var setColor = function() {
	// 	return y;
	// };

	// Define which variables and methods can be accessed
	return {
		getX: getX,
		getY: getY,
		setX: setX,
		setY: setY,
		getColor: getColor,
		id: id
	}
};

// Export the Player class so you can use it in
// other files by using require("Player").Player
exports.Player = Player;