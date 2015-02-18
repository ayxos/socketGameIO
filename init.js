var socket = io();

var mouseDown = function(action){
  socket.emit('updatePosition', {'action':action});
};

var mouseUp = function(event){
  socket.emit('updatePosition', {'action':'wait'});
};


socket.on('newPlayer', function(player){
  console.log('new player', player);
  players.push({
    x: 0,
    y: 0,
    sizeX: 30,
    sizeY: 30
  });
});

// CANVAS DRAW

window.onload = function() {

    socket.emit('newPlayer', {'color':'blue'});

    window.requestAnimFrame = (function(callback) {
      return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame ||
      function(callback) {
        window.setTimeout(callback, 1000 / 60);
      };
    })();

    // Create the canvas
    var mainContainer = $('main');
    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");
    canvas.width = $( window ).width();;
    canvas.height = $( window ).height();;
    mainContainer.append(canvas);

    // The player's state
    var players = []
    players.push({
        x: 0,
        y: 0,
        sizeX: 30,
        sizeY: 30
    });

    // Don't run the game when the tab isn't visible
    window.addEventListener('focus', function() {
        unpause();
    });

    window.addEventListener('blur', function() {
        pause();
    });

    // Let's play this game!
    reset();
    var then = Date.now();
    var running = true;
    main();


    // Functions ---


    // Reset game to original state
    function reset() {
        players[0].x = 0;
        players[0].y = 0;
    }

    // Pause and unpause
    function pause() {
        running = false;
    }

    function unpause() {
        running = true;
        then = Date.now();
        main();
    }

    // Update game objects.
    // We'll use GameInput to detect which keys are down.
    // If you look at the bottom of index.html, we load GameInput
    // from js/input.js right before app.js
    function update(dt) {
      console.log('update');
        // Speed in pixels per second
        var playerSpeed = 100;

        if(GameInput.isDown('DOWN')) {
            // dt is the number of seconds passed, so multiplying by
            // the speed gives you the number of pixels to move
            players[0].y += playerSpeed * dt;
        }

        if(GameInput.isDown('UP')) {
            players[0].y -= playerSpeed * dt;
        }

        if(GameInput.isDown('LEFT')) {
            players[0].x -= playerSpeed * dt;
        }

        if(GameInput.isDown('RIGHT')) {
            players[0].x += playerSpeed * dt;
        }

        // You can pass any letter to `isDown`, in addition to DOWN,
        // UP, LEFT, RIGHT, and SPACE:
        // if(GameInput.isDown('a')) { ... }
    }

    // Draw everything
    function render() {
      console.log('render');
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = 'green';
        ctx.fillRect(players[0].x, players[0].y, players[0].sizeX, players[0].sizeY);

        // ctx.fillStyle = 'blue';
        // ctx.fillRect(player.x, player.y, player.sizeX, player.sizeY);
    }

    // The main game loop
    function main() {
        if(!running) {
            return;
        }

        var now = Date.now();
        var dt = (now - then) / 1000.0;

        update(dt);
        render();

        then = now;
        requestAnimFrame(main);
    }


};

// CANVAS MOVE
var GameInput = (function() {

  var pressedKeys = {};

  function setKey(event, status) {
    var code = event.keyCode;
    var key;

    switch(code) {
      case 32:
        key = 'SPACE';
        break;
      case 37:
        key = 'LEFT'; 
        break;
      case 38:
        key = 'UP'; 
        break;
      case 39:
        key = 'RIGHT'; 
        break;
      case 40:
        key = 'DOWN'; 
        break;
      default:
        // Convert ASCII codes to letters
        key = String.fromCharCode(event.keyCode);
    }

    pressedKeys[key] = status;

    return key;
  }

  document.addEventListener('keydown', function(e) {
    // console.log('keyDown');
    var key = setKey(e, true);
    mouseDown(key);
  });

  document.addEventListener('keyup', function(e) {
    // console.log('keyUp');
    setKey(e, false);
  });

  // $('#right').click(function(e){
  //   console.log('lalal');
  //   key = 'RIGHT';
  //   isDown(true);
  // });

  // $('#left').click(function(e){
  //   key = 'LEFT';
  //   isDown(true);
  // });


  window.addEventListener('blur', function() {
    pressedKeys = {};
  });


  function isDown(key) {
    return pressedKeys[key];
  }


  return {
    isDown: isDown
  };

})();
