# socketGameIO
a massive multiplayer game using Javascript & Websockets (socket.io)

project: https://zombi.herokuapp.com/

Features:

* Play everywhere!
* multiple devices supported (PC, mobile)
* Responsive (using media queries)

Technologies:

* **Node.js** - cross-platform runtime environment for server-side
* **Socket.io** - amazing lib to enable websockets
* **pm2**     - production process manager for NodeJS applications
* **Jade**    - Template engine
* **jquery**  - JavaScript Library
* **Keymetrics** - Realtime monitoring and Application management for NodeJS

# Main screen (PC)
The system provides an initial zombie and places one character per player
{<1>}![ScreenShot](http://i60.tinypic.com/2ivh0fo.png)


project : http://ayxos.com/zombi/

## Run locally

```
npm start
```

Open http://localhost:8006 in a browser.

## GitHub Pages

The client can be hosted on GitHub Pages via the static file at `public/index.html`. It connects to your running socket server. Provide a `server` query parameter to point it at your backend:

```
https://<your-username>.github.io/<repo-name>/?server=https://your-socket-server.example.com
```

If omitted, it tries to connect to the same origin.