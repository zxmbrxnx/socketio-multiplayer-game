const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const socket = io();

const scoreEl = document.querySelector('#scoreEl');

const devicePixelRatio = window.devicePixelRatio || 1;

canvas.width = innerWidth * devicePixelRatio;
canvas.height = innerHeight * devicePixelRatio;

const x = canvas.width / 2;
const y = canvas.height / 2;

const frontEndPlayers = {}
const frontEndProjectiles = {}

socket.on('connect', () => {

  socket.emit('createPlayer', { 
    x: canvas.width / 2,
    y: canvas.height / 2,
    color: `hsl(${Math.random() * 360}, 50%, 50%)`
  });

  socket.emit('initCanvas', {
    width: canvas.width, 
    height: canvas.height,
    devicePixelRatio
  });
});

socket.on('updateProjectiles', (backEndProjectiles) => {
  for (const id in backEndProjectiles) {
    const backEndProjectile = backEndProjectiles[id];
    if (!frontEndProjectiles[id]) {
      frontEndProjectiles[id] = new Projectile({
        x: backEndProjectile.x,
        y: backEndProjectile.y,
        radius: 5,
        color: frontEndPlayers[backEndProjectile.playerId]?.color,
        velocity: backEndProjectile.velocity
      });
    } else {
      frontEndProjectiles[id].x += backEndProjectiles[id].velocity.x;
      frontEndProjectiles[id].y += backEndProjectiles[id].velocity.y;
    }
  }
  for (const id in frontEndProjectiles) {
    if (!backEndProjectiles[id]) {
      delete frontEndProjectiles[id];
    }
  }
});

socket.on('updatePlayers', (backEndPlayers) => {
  for (const id in backEndPlayers) {
    const backEndPlayer = backEndPlayers[id];
    if (!frontEndPlayers[id]) {
      frontEndPlayers[id] = new Player({
        x: backEndPlayer.x,
        y: backEndPlayer.y,
        radius: 20,
        color: backEndPlayer.color
      });
    } else {
      if (id === socket.id) {
        // If a player is already in frontEndPlayers, update its position
        frontEndPlayers[id].x = backEndPlayer.x;
        frontEndPlayers[id].y = backEndPlayer.y;

        const lastBackEndInputIndex = playerInputs.findIndex((input) => {
          return backEndPlayer.sequenceNumber === input.sequenceNumber;
        });
        // If the player has caught up to the last input, remove all inputs before it
        if (lastBackEndInputIndex > -1) {
          playerInputs.splice(0, lastBackEndInputIndex + 1);
        }

        // Apply all inputs that have not been applied yet
        playerInputs.forEach((input) => {
          frontEndPlayers[id].x += input.dx;
          frontEndPlayers[id].y += input.dy;
        });
      } else {
        // For all other players, just update their position

        gsap.to(frontEndPlayers[id], {
          x: backEndPlayer.x,
          y: backEndPlayer.y,
          duration: 0.015,
          ease: 'linear'
        });
      }
    }
  }
  for (const id in frontEndPlayers) {
    if (!backEndPlayers[id]) {
      delete frontEndPlayers[id];
    }
  }

});

//function spawnEnemies() {
//  setInterval(() => {
//    const radius = Math.random() * (30 - 4) + 4
//
//    let x
//    let y
//
//    if (Math.random() < 0.5) {
//      x = Math.random() < 0.5 ? 0 - radius : canvas.width + radius
//      y = Math.random() * canvas.height
//    } else {
//      x = Math.random() * canvas.width
//      y = Math.random() < 0.5 ? 0 - radius : canvas.height + radius
//    }
//
//    const color = `hsl(${Math.random() * 360}, 50%, 50%)`
//
//    const angle = Math.atan2(canvas.height / 2 - y, canvas.width / 2 - x)
//
//    const velocity = {
//      x: Math.cos(angle),
//      y: Math.sin(angle)
//    }
//
//    enemies.push(new Enemy(x, y, radius, color, velocity))
//  }, SPEED00)
//}

let animationId

function animate() {
  animationId = requestAnimationFrame(animate)
  c.fillStyle = 'rgba(0, 0, 0, 0.2)'
  c.fillRect(0, 0, canvas.width, canvas.height)


  for (const id in frontEndPlayers) {
    const player = frontEndPlayers[id];
    player.draw();
  }
  for (const id in frontEndProjectiles) {
    const frontEndProjectile = frontEndProjectiles[id];
    frontEndProjectile.draw();
  }

  //for (let i = frontEndProjectiles.length - 1; i >= 0; i--) {
  //  const frontEndProjectile = frontEndProjectiles[i];
  //  frontEndProjectile.update();
  //}



}

animate()
//spawnEnemies()

const keys = {
  w: {
    pressed: false,
  },
  a: {
    pressed: false,
  },
  s: {
    pressed: false,
  },
  d: {
    pressed: false,
  }
}

const SPEED = 5;
const playerInputs = [];
let sequenceNumber = 0;

setInterval(() => {
  if (keys.w.pressed) {
    sequenceNumber++;
    playerInputs.push({
      sequenceNumber,
      dx: 0,
      dy: -SPEED
    });
    frontEndPlayers[socket.id].y -= SPEED;
    socket.emit('keydown', {
      keycode: 'KeyW',
      sequenceNumber
    });
  } else if (keys.a.pressed) {
    sequenceNumber++;
    playerInputs.push({
      sequenceNumber,
      dx: -SPEED,
      dy: 0
    });
    frontEndPlayers[socket.id].x -= SPEED;
    socket.emit('keydown', {
      keycode: 'KeyA',
      sequenceNumber
    });
  } else if (keys.s.pressed) {
    sequenceNumber++;
    playerInputs.push({
      sequenceNumber,
      dx: 0,
      dy: SPEED
    });
    frontEndPlayers[socket.id].y += SPEED;
    socket.emit('keydown', {
      keycode: 'KeyS',
      sequenceNumber
    });
  } else if (keys.d.pressed) {
    sequenceNumber++;
    playerInputs.push({
      sequenceNumber,
      dx: SPEED,
      dy: 0
    });
    frontEndPlayers[socket.id].x += SPEED;
    socket.emit('keydown', {
      keycode: 'KeyD',
      sequenceNumber
    });
  }
}, 15);

window.addEventListener('keydown', (event) => {
  if (!frontEndPlayers[socket.id]) {
    return;
  }
  switch (event.code) {
    case 'KeyW':
      keys.w.pressed = true;
      break;
    case 'KeyA':
      keys.a.pressed = true;
      break;
    case 'KeyS':
      keys.s.pressed = true;
      break;
    case 'KeyD':
      keys.d.pressed = true;
      break;
  }
});

window.addEventListener('keyup', (event) => {
  if (!frontEndPlayers[socket.id]) {
    return;
  }
  switch (event.code) {
    case 'KeyW':
      keys.w.pressed = false;
      break;
    case 'KeyA':
      keys.a.pressed = false;
      break;
    case 'KeyS':
      keys.s.pressed = false;
      break;
    case 'KeyD':
      keys.d.pressed = false;
      break;
  }
});