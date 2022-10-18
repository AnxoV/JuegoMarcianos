let canvas;
let enemies;

/**
 * Wraps around the canvas element in order to
 * group non-native functions
 */
class Canvas {
    /**
     * @param {HTMLElement} canvas The HTML element of the canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = this.canvas.getContext("2d");
    }

    /**
     * Refreshes the canvas by painting a white rectangle over it
     */
    refresh() {
        this.ctx.fillStyle = "#fff";
        this.ctx.fillRect(0, 0, this.width(), this.height());
    }

    /**
     * @returns {Number} The width of the canvas
     */
    width() {
        return this.canvas.width;
    }

    /**
     * @returns {Number} The height of the canvas
     */
    height() {
        return this.canvas.height;
    }

    /**
     * Executes the needed operations in a frame
     */
    frame() {
        this.refresh();
        enemies.forEach(enemy => {
            enemy.draw();
        });
    }
}

/**
 * Simple representation of a rectangle
 */
class Rect {
    /**
     * @param {{x: Int, y: Int}} xy The coordinate of the rectangle
     * @param {{w: Int, h: Int}} wh The dimensions of the rectangle
     */
    constructor(xy, wh) {
        this.xy = xy;
        this.wh = wh;
    }

    /**
     * @param {{x: Int, y: Int}} xy The coordinate of the point
     * @returns True if the point is inside the rectangle, false otherwise
     */
    hasCollided(xy) {
        if (xy.x >= this.xy.x && xy.x <= this.xy.x+this.wh.w
            && xy.y >= this.xy.y && xy.y <= this.xy.y+this.wh.h)
            return true;
        return false;
    }
}

/**
 * Represents the enemy class
 * @see {@link Rect}
 */
class Enemy {
    /**
     * @param {CanvasRenderingContext2D} ctx The context of the canvas
     * @param {Rect} rect The {@link rect} of the enemy
     * @param {String} img The src of the enemy image splash
     */
    constructor(ctx, rect, img) {
        this.ctx = ctx;
        this.rect = rect;
        this.img = img;
    }

    /**
     * Draws the enemy onto the canvas
     */
    draw() {
        let image = new Image();
        image.src = this.img;
        this.ctx.drawImage(image,
                            this.rect.xy.x, this.rect.xy.y,
                            this.rect.wh.w, this.rect.wh.h);
    }

    /**
     * @static
     * @param {CanvasRenderingContext2D} ctx The context of the canvas
     * @param {Rect} rect The {@link rect} of the enemy
     * @param {String} img The src of the enemy image splash
     * @returns {Enemy} An {@link Enemy} object
     */
    static of(ctx, rect, img) {
        return new Enemy(ctx, rect, img);
    }
}

/**
 * Helper function to determine the absolute position
 * of an element in the canvas by iterating backwards
 * through the DOM hierarchy from the element.
 * @param {HTMLElement} element The HTML element
 * @returns {{x: Int, y: Int}} The absolute position of the element
 */
function element_coords(element) {
    let x = 0, y = 0;
    while (element.offsetParent) {
        x += element.offsetLeft;
        y += element.offsetTop;
        element = element.offsetParent;
    }
    return {x: x, y: y};
}

/**
 * Helper function to find the index of the first
 * matching element of the array
 * @param {Object[]} array The array
 * @param {Object} element The element to match
 */
function find_first(array, element) {
    return array.findIndex(e => e == element);
}

/**
 * Triggers when a mouseclick event is fired
 * and removes only the enemy the player clicked
 * @param {Event} e The triggered event
 */
 function mouseclick(e) {
    let collided = false;
    for (let i = 0; i < enemies.length && !collided; i++) {
        const canvasxy = element_coords(canvas.canvas);
        const xy = {
            x: e.clientX-canvasxy.x,
            y: e.clientY-canvasxy.y
        };
        
        if (enemies[i].rect.hasCollided(xy)) {
            enemies.splice(find_first(enemies, enemies[i]), 1);
            collided = true;
        }
    }
}

/**
 * Initializes the game
 */
function initGame() {
    canvas = new Canvas(document.getElementById("canvas"));
    enemies = [];
    addEventListener("click", mouseclick);
    // Main interval for updating the canvas
    // _this_ object reference is lost when trying
    // to directly pass the function reference to setInterval
    // Ex.: setInterval(canvas.frame, 100); -> Result: _this_ reference lost
    // Instead use an arrow function: setInterval(() => function(), delay);
    setInterval(() => canvas.frame(), 100);
    // Interval for spawning enemies
    setInterval(function() {
        const rect = new Rect({
                                x: Math.random()*(canvas.width()-50),
                                y: Math.random()*(canvas.height()-50)
                            },
                            {
                                w: 50,
                                h: 50
                            });
        enemies.push(Enemy.of(canvas.ctx, rect, "img/enemy.png"));
    }, 1000);
}

window.onload = initGame;