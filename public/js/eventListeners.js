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
    }, 300);

});

window.addEventListener('resize', () => {
    canvas.width = 1024 * devicePixelRatio;
    canvas.height = 576 * devicePixelRatio;
    canvas.style.width = '1024px';
    canvas.style.height = '576px';
    c.scale(devicePixelRatio, devicePixelRatio);
});