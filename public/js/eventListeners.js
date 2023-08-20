let canShoot = true;

addEventListener('click', (event) => {
    event.stopPropagation();
    const playerPosition = {
        x: frontEndPlayers[socket.id].x,
        y: frontEndPlayers[socket.id].y
    }

    const angle = Math.atan2(
        event.clientY * window.devicePixelRatio - playerPosition.y,
        event.clientX * window.devicePixelRatio - playerPosition.x
    )
    /* const velocity = {
        x: Math.cos(angle) * 5,
        y: Math.sin(angle) * 5
    } */
    if (!canShoot) return;
    canShoot = false;
    socket.emit('shoot', {
        x: playerPosition.x,
        y: playerPosition.y,
        angle: angle
    });
    setTimeout(() => {
        canShoot = true;
    }, 300);
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

// Rezise canvas
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    socket.emit('initCanvas', {
        widht: canvas.width,
        height: canvas.height
    });
});