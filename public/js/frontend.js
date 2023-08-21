const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

// Get username from local storage
const username = localStorage.getItem('username');
// Add username to the form
document.querySelector('#usernameInput').value = username;

const socket = io();

const devicePixelRatio = window.devicePixelRatio || 1;

canvas.width = innerWidth * devicePixelRatio;
canvas.height = innerHeight * devicePixelRatio;
c.scale(devicePixelRatio, devicePixelRatio);

const x = canvas.width / 2;
const y = canvas.height / 2;

const frontEndPlayers = {}
const frontEndProjectiles = {}

socket.on('connect', () => {
  console.log('Connected to server');
  socket.emit('joinGame', {});
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
      document.querySelector(
        '#playerLabels'
      ).innerHTML += `<div data-id="${id}" data-score="${backEndPlayer.score}">
                              <span style="color: ${backEndPlayer.color}">${backEndPlayer.username}</span>: ${backEndPlayer.score}
                      </div>`;
    } else {

      const player_id = document.querySelector(`#playerLabels div[data-id="${id}"]`);
      if (player_id) {
        player_id.innerHTML = `<span style="color: ${backEndPlayer.color}">${backEndPlayer.username}</span>: ${backEndPlayer.score}`;
      }
      player_id.setAttribute('data-score', backEndPlayer.score);

      // Sort the player labels by score
      const parenDiv = document.querySelector('#playerLabels');
      const childDivs = Array.from(parenDiv.querySelectorAll('div'));

      childDivs.sort((a, b) => {
        const scoreA = Number(a.getAttribute('data-score'));
        const scoreB = Number(b.getAttribute('data-score'));
        return scoreB - scoreA;
      });

      childDivs.forEach((div) => {
        parenDiv.removeChild(div);
      });

      childDivs.forEach((div) => {
        parenDiv.appendChild(div);
      });

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
      // Obtener el elemento por su data-id en el Leaderboard
      const player_id = document.querySelector(`#playerLabels div[data-id="${id}"]`);
      // Verificar si el elemento existe antes de intentar eliminarlo
      if (player_id) {
        player_id.parentNode.removeChild(player_id);
      }

      if (id === socket.id) {
        // If the player is dead, show the form again
        document.querySelector('#formContainer').style.display = 'flex';
      }

      delete frontEndPlayers[id];
    }
  }

});
//const enemies = []
//
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
//  }, 5000)
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

document.querySelector('#usernameForm').addEventListener('submit', (event) => {
  event.preventDefault();
  const username = document.querySelector('#usernameInput').value;
  //Save username in local storage
  localStorage.setItem('username', username);

  // Hide the form
  document.querySelector('#formContainer').style.display = 'none';

  socket.emit('initGame', {
    color: `hsl(${Math.random() * 360}, 50%, 50%)`,
    username,
    width: canvas.width,
    height: canvas.height,
    devicePixelRatio
  });
  //Remove the display none from the canvas
  document.querySelector('#game').removeAttribute('style');

});


// Onload
function showJoystick() {
  let containerJoystick = document.getElementById("containerJoystick");
  // Verificar si tiene la clase hidden
  if (containerJoystick.classList.contains("hidden")) {
      containerJoystick.classList.remove("hidden");
  } else {
      containerJoystick.classList.add("hidden");
  }
}