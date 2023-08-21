let canShoot = true;

addEventListener('click', (event) => {
    //event.stopPropagation();
    const playerPosition = {
        x: frontEndPlayers[socket.id].x,
        y: frontEndPlayers[socket.id].y
    }

    const angle = Math.atan2(
        event.clientY - playerPosition.y,
        event.clientX - playerPosition.x
    )
    if (!canShoot) return;
    canShoot = false;
    socket.emit('shoot', {
        x: playerPosition.x,
        y: playerPosition.y,
        angle: angle
    });
    setTimeout(() => {
        canShoot = true;
    }, 100);
    /* frontEndProjectiles.push(
        new Projectile({
            x: playerPosition.x,
            y: playerPosition.y,
            radius: 5,
            color: 'white',
            velocity: velocity
        })
    ); */
    //console.log(frontEndProjectiles);
});

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    c.scale(window.devicePixelRatio, window.devicePixelRatio);
    //socket.emit('initCanvas', {
    //    widht: canvas.width,
    //    height: canvas.height
    //});
});


function showJoystick() {
    let containerJoystick = document.getElementById("containerJoystick");
    // Verificar si tiene la clase hidden
    if (containerJoystick.classList.contains("hidden")) {
        containerJoystick.classList.remove("hidden");
    } else {
        containerJoystick.classList.add("hidden");
    }
}
