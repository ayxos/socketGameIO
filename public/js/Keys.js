/**************************************************
** GAME KEYBOARD CLASS
**************************************************/
var Keys = function(up, left, right, down) {
	var up 		= up 	|| false,
		left 	= left 	|| false,
		right 	= right || false,
		down 	= down 	|| false;
		
	var onKeyDown = function(e) {
		var that = this,
			c = e.keyCode;
		switch (c) {
			// Controls
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

	return {
		up: 		up,
		left: 		left,
		right: 		right,
		down: 		down,
		onKeyDown: 	onKeyDown,
		onKeyUp: 	onKeyUp,
		onMouseDown: onMouseDown,
		onMouseUp: onMouseUp
	};
};