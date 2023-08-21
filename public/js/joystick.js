class JoystickElement {
    constructor(selector) {
        this.element = document.querySelector(selector);
        this.rect = this.calculateRect();
        this.current = this.original;

        // Recalculate the rect on resizing
        window.onresize = () => {
            this.rect = this.calculateRect();
        };
    }

    get original() {
        return {
            vector: {
                x: 0,
                y: 0
            },

            angle: 0,
            percentage: 0
        };

    }

    calculateRect() {
        let rect = this.element.getBoundingClientRect();

        return Object.assign(
            rect, {
                center: {
                    x: rect.left + rect.width / 2,
                    y: rect.top + rect.height / 2
                },

                radius: rect.width / 2 // Improve this
            });

    }
}


class JoystickShaft extends JoystickElement {
    clamp(x, y, boundary) {
        // Trigonometry time!
        // - Who says what you learn in school won't become useful :D
        let diff = {
            x: x - this.rect.center.x,
            y: y - this.rect.center.y
        };


        // Get the distance between the cursor and the center
        let distance = Math.sqrt(
            Math.pow(diff.x, 2) + Math.pow(diff.y, 2));


        // Get the angle of the line
        let angle = Math.atan2(diff.x, diff.y);
        // Convert into degrees!
        this.current.angle = 180 - angle * 180 / Math.PI;

        // If the cursor is distance from the center is
        // less than the boundary, then return the diff
        //
        // Note: Boundary = radius
        if (distance < boundary) {
            this.current.percentage = distance / boundary * 100;
            return this.current.vector = diff;
        }

        // If it's a longer distance, clamp it!
        this.current.percentage = 100;

        return this.current.vector = {
            x: Math.sin(angle) * boundary,
            y: Math.cos(angle) * boundary
        };

    }

    move(from, to, duration, callback) {
        // If the duration is 0, then don't animate
        if (duration === 0) {
            this.element.style.transform = `translate(${to.x}px, ${to.y}px)`;
            return callback();
        }

        // Otherwise, animate!
        let start = null;

        let step = (timestamp) => {
            if (!start) {
                start = timestamp;
            }

            let progress = timestamp - start;

            // If we're done, then set the final position
            if (progress >= duration) {
                this.element.style.transform = `translate(${to.x}px, ${to.y}px)`;
                return callback();
            }

            // Otherwise, keep going!
            let delta = {
                x: to.x - from.x,
                y: to.y - from.y
            };

            let ease = (x) => {
                return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
            }

            this.element.style.transform = `translate(${from.x + delta.x * ease(progress / duration)}px, ${from.y + delta.y * ease(progress / duration)}px)`;

            window.requestAnimationFrame(step);
        };

        window.requestAnimationFrame(step);

        return this;
    }
    
}


class Joystick {
    constructor(base, shaft) {
        this.state = 'inactive';
        this.base = new JoystickElement(base);
        this.shaft = new JoystickShaft(shaft);
        this.boundary = this.base.rect.radius * 0.75;

        this.onactivate = function () {};
        this.ondeactivate = function () {};
        this.ondrag = function () {};

        this.activate = this.activate.bind(this);
        this.deactivate = this.deactivate.bind(this);
        this.drag = this.drag.bind(this);
    }

    static get ANIMATION_TIME() {
        return 100;
    }

    attachEvents() {
        this.base.element.addEventListener('pointerdown', this.activate, false);
        document.addEventListener('pointerup', this.deactivate, false);
        document.addEventListener('pointermove', this.drag, false);

        return this;
    }

    detachEvents() {
        this.base.element.removeEventListener('pointerdown', this.activate, false);
        document.removeEventListener('pointerup', this.deactivate, false);
        document.removeEventListener('pointermove', this.drag, false);

        this.deactivate();

        return this;
    }

    activate() {
        this.state = 'active';
        this.base.element.classList.add('active');

        if (typeof this.onactivate === 'function') {
            this.onactivate();
        }

        return this;
    }

    deactivate() {
        this.state = 'inactive';
        this.base.element.classList.remove('active');

        this.shaft.move(
            this.shaft.current.vector,
            this.shaft.original.vector,
            this.constructor.ANIMATION_TIME,
            () => {
                this.shaft.element.removeAttribute('style');
                this.shaft.current = this.shaft.original;

                if (typeof this.ondeactivate === 'function') {
                    this.ondeactivate();
                }
            });


        return this;
    }

    drag(e) {
        if (this.state !== 'active') {
            return this;
        }

        this.shaft.move(
            this.shaft.original.vector,
            this.shaft.clamp(e.clientX, e.clientY, this.boundary),
            0,
            () => {
                if (typeof this.ondrag === 'function') {
                    this.ondrag();
                }
            });


        return this;
    }
}

// Al cargar la página, se crea el joystick
window.addEventListener('load', () => {
    // Setup the Joystick
    const joystick = new Joystick('.joystick-base', '.joystick-shaft');

    // Attach the events for the joystick
    // Can also detach events with the detachEvents function
    joystick.attachEvents();



    // Lets animate the background colour around using hsl to show the degree of control this has!
    // Puns are funny.
    joystick.ondeactivate = function () {
        //document.body.removeAttribute('style');

        //Detener al jugador
        keys.w.pressed = false;
        keys.s.pressed = false;
        keys.d.pressed = false;
        keys.a.pressed = false;

    };

    joystick.ondrag = function () {
        //document.body.style.background = `hsl(${this.shaft.current.angle}, ${this.shaft.current.percentage}%, 50%)`;

        //Mostrar los valores de la posición del joystick en consola
        //console.log(this.shaft.current.vector.x);
        //console.log(this.shaft.current.vector.y);

        // Si el valor de x es mayor que el de y, mover al jugador solo en x
        if (Math.abs(this.shaft.current.vector.x) > Math.abs(this.shaft.current.vector.y)) {
            // Si el valor de x es positivo, mover al jugador a la derecha
            if (this.shaft.current.vector.x > 0) {
                keys.d.pressed = true;
                keys.a.pressed = false;
            }
            // Si el valor de x es negativo, mover al jugador a la izquierda
            else {
                keys.a.pressed = true;
                keys.d.pressed = false;
            }
            keys.w.pressed = false;
            keys.s.pressed = false;
        }
        // Si el valor de y es mayor que el de x, mover al jugador solo en y
        else {
            // Si el valor de y es positivo, mover al jugador hacia abajo
            if (this.shaft.current.vector.y > 0) {
                keys.s.pressed = true;
                keys.w.pressed = false;
            }
            // Si el valor de y es negativo, mover al jugador hacia arriba
            else {
                keys.w.pressed = true;
                keys.s.pressed = false;
            }
            keys.a.pressed = false;
            keys.d.pressed = false;
        }
        

    };
});