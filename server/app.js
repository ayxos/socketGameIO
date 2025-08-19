/**************************************************
** NODE.JS REQUIREMENTS
**************************************************/
var app 		= require('express')(),
	http 		= require('http').Server(app),
	express   	= require('express'),
	socket_ops  = require("./game/socket_ops").Init,
	log 		= require("color-util-logs"),
	device		= require('express-device'),
	path		= require('path'),
	port		= process.env.PORT || 8006,
	socket_port = process.env.SOCKET_PORT || (process.env.PORT ? (Number(process.env.PORT) - 1) : 8005),
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
	res.sendFile(path.join(process.cwd(), 'public', 'index.html'))
});

app.get('/handy', function(req, res){
	res.sendFile(path.join(process.cwd(), 'public', 'handy.html'))
});

app.get('/view', function(req, res){
	res.sendFile(path.join(process.cwd(), 'public', 'view.html'))
});

/**************************************************
** SERVER RUNNER
**************************************************/
http.listen(port, function(){
  console.log('listening on', port);
});