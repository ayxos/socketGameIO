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

## Run statically (no Node server)

- Simply open `public/index.html` in a browser, or serve the `public/` folder with any static server.
- If your socket server is hosted elsewhere, append `?server=` to point the client at it:

```
public/index.html?server=https://your-socket-server.example.com
```

- Mobile/handheld layout: `public/handy.html`
- Viewer-only layout: `public/view.html`

## Run with Node (optional API/socket server)

```
npm start
```

Open http://localhost:8006 in a browser. Static pages are served from `public/` and sockets listen on `SOCKET_PORT` (default `PORT-1`).

## GitHub Pages

The client can be hosted on GitHub Pages via the static file at `public/index.html`. It connects to your running socket server. Provide a `server` query parameter to point it at your backend:

```
https://<your-username>.github.io/<repo-name>/?server=https://your-socket-server.example.com
```

If omitted, it tries to connect to the same origin.