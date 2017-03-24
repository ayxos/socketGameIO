/**************************************************
** NODE.JS REQUIREMENTS
**************************************************/
var app 		= require('express')(),
	http 		= require('http').Server(app),
	express   	= require('express'),	    // Player class
	socket_ops  = require("./game/socket_ops").Init,
	log 		= require("color-util-logs"),
	device		= require('express-device'),
	path		= require('path'),
	port		= process.env.PORT || 8006,
	socket_port = process.env.PORT - 1 || 8005,
	players		= [];	// Array of connected players 

app.use(device.capture());
device.enableViewRouting(app);

app.use(express.static(path.join(process.cwd(), 'public')));
app.set('view engine', 'pug')

/**************************************************
** RUN THE GAME
**************************************************/
socket_ops(socket_port, http, players);

/**************************************************
** SERVER ROUTES
**************************************************/
app.get('/', function(req, res){
	console.log('device', req.device);
	switch(req.device.type){
		case 'phone':
			res.render('handy', { version: 3 })
			break;
		default:
			res.render('index', { version: 3 })
			break;
	}
});

app.get('/view', function(req, res){
	res.render('viewer', { version: 3 })
});

/**************************************************
** SERVER RUNNER
**************************************************/
http.listen(port, function(){
  console.log('listening on', port);
});
