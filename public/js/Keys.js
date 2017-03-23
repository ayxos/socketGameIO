/**************************************************
** GAME KEYBOARD CLASS
**************************************************/
var Keys = function(up, left, right, down, space) {
	var up 		= up 	|| false,
		left 	= left 	|| false,
		right 	= right || false,
		down 	= down 	|| false;
		space 	= space || false;
		
	var onKeyDown = function(e) {
		var that = this,
			c = e.keyCode;
		switch (c) {
			// Controls
			case 32: // space
				that.space = true;
				break;
			case 37: // Left
				that.left = true;
				break;
			case 38: // Up
				that.up = true;
				break;
			case 39: // Right
				that.right = true; // Will take priority over the left key
				break;
			case 40: // Down
				that.down = true;
				break;
		};
	};
	
	var onKeyUp = function(e) {
		var that = this,
			c = e.keyCode;
		switch (c) {
			case 32: // space
				that.space = false;
				break;
			case 37: // Left
				that.left = false;
				break;
			case 38: // Up
				that.up = false;
				break;
			case 39: // Right
				that.right = false;
				break;
			case 40: // Down
				that.down = false;
				break;
		};
	};

	var onMouseDown = function(e, x, y) {
		var that = this;
		console.log('coords: ' + x + ' ' + y, e);
		// giving a safeArea of 100px
		if( (e.x > x + 100 && e.x > x - 100) && (e.y > y + 100 && e.y > y- 100)) {
			console.log('case 1');
			that.down = true;
			that.right = true;
		}
		if( (e.x < x + 100 && e.x < x - 100) && (e.y > y + 100 && e.y > y- 100)) {
			console.log('case 2');
			that.down = true;
			that.left = true;
		}
		if( (e.x < x + 100 && e.x < x - 100) && (e.y < y + 100 && e.y < y- 100)) {
			console.log('case 3');
			that.up = true;
			that.left = true;
		}
		if( (e.x > x + 100 && e.x > x - 100) && (e.y < y + 100 && e.y < y- 100)) {
			console.log('case 4');
			that.up = true;
			that.right = true;
		}
		// one way move Y
		if(e.x < x + 100 && e.x > x - 100 && e.y > y){
			that.down = true;
		}
		if(e.x < x + 100 && e.x > x - 100 && e.y < y){
			that.up = true;
		}
		// one way move X
		if(e.y < y + 100 && e.y > y - 100 && e.x > x){
			that.right = true;
		}
		if(e.y < y + 100 && e.y > y - 100 && e.x < x){
			that.left = true;
		}
	};

	var onMouseUp = function() {
		var that = this;
		that.left = false;
		that.up = false;
		that.right = false;
		that.down = false;
	};

	// D-pad
	var onPadDown = function(direction) {
		var that = this;
		switch (direction) {
			// Controls
			case 'left': // Left
				that.left = true;
				break;
			case 'up': // Up
				that.up = true;
				break;
			case 'right': // Right
				that.right = true; // Will take priority over the left key
				break;
			case "down": // Down
				that.down = true;
				break;
		};
	};
	
	var onPadUp = function(direction) {
		var that = this;
		switch (direction) {
			case 'left': // Left
				that.left = false;
				break;
			case 'up': // Up
				that.up = false;
				break;
			case 'right': // Right
				that.right = false;
				break;
			case "down": // Down
				that.down = false;
				break;
		};
	};

	// joystick
	var onControllerDown = function(e) {
		var that = this;
		console.log('coords: ' + x + ' ' + y, e);
		// giving a safeArea of 100px
		if(e.dx > 10 && e.dy > 10) {
			console.log('case NE');
			that.up = true;
			that.right = true;
		}
		// giving a safeArea of 100px
		if(e.dx < -10 && e.dy > 10) {
			console.log('case NW');
			that.up = true;
			that.left = true;
		}
		// giving a safeArea of 100px
		if(e.dx < -10 && e.dy < -10) {
			console.log('case SE');
			that.down = true;
			that.left = true;
		}
		// giving a safeArea of 100px
		if(e.dx > 10 && e.dy < -10) {
			console.log('case SW');
			that.down = true;
			that.right = true;
		}
		// giving a safeArea of 100px
		if(e.dx > -10 && e.dx < 10 && e.dy < 0) {
			console.log('case S');
			that.down = true;
		}
		// giving a safeArea of 100px
		if(e.dx > -10 && e.dx < 10 && e.dy > 0) {
			console.log('case N');
			that.up = true;
		}
		// giving a safeArea of 100px
		if(e.dy > -10 && e.dy < 10 && e.dx > 0) {
			console.log('case E');
			that.right = true;
		}
		// giving a safeArea of 100px
		if(e.dy > -10 && e.dy < 10 && e.dx < 0) {
			console.log('case W');
			that.left = true;
		}

	};

	return {
		space:      space,
		up: 		up,
		left: 		left,
		right: 		right,
		down: 		down,
		onKeyDown: 	onKeyDown,
		onKeyUp: 	onKeyUp,
		onMouseDown: onMouseDown,
		onMouseUp: onMouseUp,
		onPadUp: onPadUp,
		onPadDown: onPadDown,
		onControllerDown: onControllerDown
	};
};

