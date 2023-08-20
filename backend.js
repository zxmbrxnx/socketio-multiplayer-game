const express = require('express');
const app = express();

const http = require('http');
const server = http.createServer(app);
const {
    Server
} = require("socket.io");
const io = new Server(server, {
    pingInterval: 2000,
    pingTimeout: 5000
});
const port = 3000;

const SPEED = 5;
let projectileId = 0;
const RADIUS = 10;
const PROJECTILE_RADIUS = 5;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html')
});

const backEndPlayers = {};
const backEndProjectiles = {};

io.on('connection', (socket) => {

    //backEndPlayers[socket.id] = {
    //    x: 100 * Math.random(),
    //    y: 100 * Math.random(),
    //    color: `hsl(${Math.random() * 360}, 100%, 50%)`,
    //    sequenceNumber: 0
    //}
    socket.on('createPlayer', ({ x, y, color }) => {
        backEndPlayers[socket.id] = {
            x: x + (10 * Math.random()),
            y: y + (10 * Math.random()),
            color: color,
            sequenceNumber: 0
        };
    });

    //console.log(backEndPlayers);
    io.emit('updatePlayers', backEndPlayers);

    socket.on('initCanvas', ({width, height, devicePixelRatio}) => {
        if(!backEndPlayers[socket.id]) return;
        backEndPlayers[socket.id].canvas = {
            width: width,
            height: height, 
        }

        if (devicePixelRatio > 1){
            backEndPlayers[socket.id].radius = 5 * RADIUS;
        } else {
            backEndPlayers[socket.id].radius = RADIUS;
        }
    });

    socket.on('shoot', ({
        x,
        y,
        angle
    }) => {
        canShoot = false;
        projectileId++;

        const velocity = {
            x: Math.cos(angle) * 20,
            y: Math.sin(angle) * 20
        }
        backEndProjectiles[projectileId] = {
            x: x,
            y: y,
            velocity: velocity,
            playerId: socket.id
        }
    });

    socket.on('disconnect', (reason) => {
        //console.log('user disconnected: '+socket.id);
        //console.log(reason);
        delete backEndPlayers[socket.id];
        io.emit('updatePlayers', backEndPlayers);
    });

    socket.on('keydown', ({
        keycode,
        sequenceNumber
    }) => {
        backEndPlayers[socket.id].sequenceNumber = sequenceNumber;
        switch (keycode) {
            case 'KeyW':
                backEndPlayers[socket.id].y -= SPEED;
                break;
            case 'KeyA':
                backEndPlayers[socket.id].x += -SPEED;
                break;
            case 'KeyS':
                backEndPlayers[socket.id].y += SPEED;
                break;
            case 'KeyD':
                backEndPlayers[socket.id].x += SPEED;
                break;
        }
    });

    socket.on('joystick', ({
        x,
        y,
        sequenceNumber
    }) => {
        backEndPlayers[socket.id].sequenceNumber = sequenceNumber;
        
        //Mover al jugador solo en direccion de x o y (no diagonal)
        if (Math.abs(x) > Math.abs(y)) {
            backEndPlayers[socket.id].x += SPEED * x;
        } else {
            backEndPlayers[socket.id].y += SPEED * y;
        }

    });
});

// Backend ticker
setInterval(() => {
    //Update projectiles
    for (const id in backEndProjectiles) {
        backEndProjectiles[id].x += backEndProjectiles[id].velocity.x; 
        backEndProjectiles[id].y += backEndProjectiles[id].velocity.y;

        //Check if projectile is out of bounds
        if (
            backEndProjectiles[id].x - PROJECTILE_RADIUS >= 
            backEndPlayers[backEndProjectiles[id].playerId]?.canvas?.width ||
            backEndProjectiles[id].x + PROJECTILE_RADIUS <= 0 ||
            backEndProjectiles[id].y - PROJECTILE_RADIUS >= 
            backEndPlayers[backEndProjectiles[id].playerId]?.canvas?.height ||
            backEndProjectiles[id].y + PROJECTILE_RADIUS <= 0
        ) {
            delete backEndProjectiles[id];
            continue;
        }
        for (const playerId in backEndPlayers) {
            const backEndPlayer = backEndPlayers[playerId];

            const DISTANCE = Math.hypot(
                backEndProjectiles[id].x - backEndPlayer.x,
                backEndProjectiles[id].y - backEndPlayer.y
            );

            if (
                DISTANCE < PROJECTILE_RADIUS + backEndPlayer.radius && 
                backEndProjectiles[id].playerId !== playerId
            ) {
                if (backEndProjectiles[id].playerId !== playerId) {
                    delete backEndProjectiles[id];
                    delete backEndPlayers[playerId];
                    break;
                }
            }

        }
    }
    io.emit('updateProjectiles', backEndProjectiles);
    io.emit('updatePlayers', backEndPlayers);

}, 15);

server.listen(port, () => {
    //console.log(`Example app listening on port ${port}`)
});

//console.log('server is running');