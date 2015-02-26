/**************************************************
** GAME PLAYER CLASS
**************************************************/
var Player = function(startX, startY, isZombie) {
	var id, 
		x 				= startX,
		y 				= startY,
		points			= 0,
		zombie			= isZombie ? true : false;

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
		getZombie: getZombie,
		setZombie: setZombie,
		getPoints: getPoints,
		setPoints: setPoints,
		id: id
	}
};

// Export the Player class so you can use it in
// other files by using require("Player").Player
exports.Player = Player;