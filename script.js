let game;

/**
 * Controller of the application
 * 
 * @see {@link Canvas}
 * @see {@link Enemy}
 * @see {@link Player}
 */
class Game {
    /**
     * @param {Canvas} canvas The {@link Canvas} of the game
     * @param {Enemy[]} enemies The {@link Enemy} array of the game 
     * @param {Player} player The {@link Player} of the game
     */
    constructor(canvas, enemies, player) {
        this.canvas = canvas;
        this.enemies = enemies;
        this.player = player;
        this.difficulty = 1;
        this.state = true;
    }

    /**
     * Starts the game
     */
    init() {
        this.canvas = new Canvas(document.getElementById("canvas"));
        this.enemies = [];
        this.player = new Player();
        addEventListener("click", mouseclick);
        // Main interval for updating the canvas
        // _this_ object reference is lost when trying
        // to directly pass the function reference to setInterval
        // Ex.: setInterval(canvas.frame, 100); -> Result: _this_ reference lost
        // Instead use an arrow function: setInterval(() => function(), delay);
        setInterval(() => this.canvas.frame(), 100);
        // Timeout for spawning enemies
        setTimeout(timeout, 1000*this.difficulty);
    }
}

/**
 * Wraps around the canvas element in order to
 * group non-native functions
 */
class Canvas {
    /**
     * @param {HTMLElement} canvas The HTML element of the canvas
     */
    constructor(canvas) {
        this.element = canvas;
        this.ctx = this.element.getContext("2d");
        this.ctx.textAlign = "center";
        this.ctx.font = "bold 20px sans-serif";
    }

    /**
     * Updates the canvas by painting a white rectangle over it
     */
    refresh() {
        this.ctx.fillStyle = "#fff";
        this.ctx.fillRect(0, 0, this.width(), this.height());
    }

    /**
     * Updates the point score
     */
    refreshPoints() {
        this.ctx.fillStyle = this.mapColor();
        this.ctx.fillText(game.player.points, this.width()/2, this.height()/2);
    }

    /**
     * Loads the Game Over screen
     */
    loadGOScreen() {
        this.ctx.fillStyle = "#f00";
        this.ctx.fillRect(this.width()/6, this.height()/6, this.width()*4/6, this.height()*4/6);
        this.ctx.fillStyle = "#000";
        this.ctx.font = "20px sans-serif";
        let string = "¡Has perdido!\nLos marcianos te han superado.\nPuntuación: " + game.player.points;
        let offset = -20;
        string.split("\n").forEach(s => {
            this.ctx.fillText(s, this.width()/2, this.height()/2+offset);
            offset += 20;
        });
        
    }

    /**
     * Executes the needed operations in a frame
     */
    frame() {
        this.refresh();
        game.enemies.forEach(enemy => {
            enemy.draw();
        });
        if(game.state)
            this.refreshPoints();
        else
            this.loadGOScreen();
    }

    /**
     * Maps a color from green to red based
     * on the amount of enemies
     */
    mapColor() {
        let r = (game.enemies.length*255/20);
        let g = ((20-game.enemies.length)*255/20);
        return "rgb(" + r + ", " + g + ", 0)";
    }

    /**
     * @returns {Number} The width of the canvas
     */
    width() {
        return this.element.width;
    }

    /**
     * @returns {Number} The height of the canvas
     */
    height() {
        return this.element.height;
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
 * Represents the player class
 */
class Player {
    constructor() {
        this.points = 0;
    }

    /**
     * Adds one point to the player score and updates the canvas border color
     */
    updateScore() {
        this.points++;
    }

    /**
     * Sets the player points to 0
     */
    reset() {
        this.points = 0;
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
    for (let i = 0; i < game.enemies.length && !collided && game.state; i++) {
        let enemy = game.enemies[i];
        const canvasxy = element_coords(game.canvas.element);
        const xy = {
            x: e.clientX-canvasxy.x,
            y: e.clientY-canvasxy.y
        }
        
        if (enemy.rect.hasCollided(xy)) {
            game.enemies.splice(find_first(game.enemies, enemy), 1);
            game.player.updateScore();
            game.canvas.element.style.borderColor = game.canvas.mapColor();
            collided = true;
        }
    }
}

function timeout() {
    const rect = new Rect({
        x: Math.random()*(game.canvas.width()-50),
        y: Math.random()*(game.canvas.height()-50)
    },
    {
        w: 50,
        h: 50
    });
    game.enemies.push(Enemy.of(canvas.ctx, rect, "img/enemy.png"));
    if (1000*game.difficulty*0.98 > 100)
        game.difficulty *= 0.98;
    if (game.enemies.length < 20) {
        game.canvas.element.style.borderColor = game.canvas.mapColor();
        setTimeout(timeout, 1000*game.difficulty);
    } else
        game.state = false;
}

game = new Game(new Canvas(document.getElementById("canvas")),
                [],
                new Player());
window.onload = game.init;