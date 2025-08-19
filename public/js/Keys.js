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
		// Reset previous directions
		that.left = that.right = that.up = that.down = false;
		// Determine dominant axis and move only along that axis (RPG-style 4-dir)
		var dx = (e.x - x);
		var dy = (e.y - y);
		if (Math.abs(dx) > Math.abs(dy)) {
			if (dx > 0) { that.right = true; } else { that.left = true; }
		} else {
			if (dy > 0) { that.down = true; } else { that.up = true; }
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
		// Reset previous directions
		that.left = that.right = that.up = that.down = false;
		var threshold = 10;
		var dx = e.dx || 0;
		var dy = e.dy || 0; // dy positive means up in our joystick impl
		if (Math.abs(dx) > Math.abs(dy)) {
			if (Math.abs(dx) > threshold) {
				that.right = dx > 0;
				that.left = dx < 0;
			}
		} else {
			if (Math.abs(dy) > threshold) {
				that.up = dy > 0;
				that.down = dy < 0;
			}
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

