// Game Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game States
const GAME_STATES = {
    IDLE: 'idle',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver',
    WIN: 'win'
};

// Game Variables
let gameState = GAME_STATES.IDLE;
let score = 0;
let lives = 3;
let bricksLeft = 0;

// Paddle object
const paddle = {
    width: 100,
    height: 15,
    x: canvas.width / 2 - 50,
    y: canvas.height - 30,
    speed: 7,
    dx: 0,
    baseWidth: 100
};

// Ball array - support multiple balls
let balls = [{
    x: canvas.width / 2,
    y: canvas.height / 2,
    radius: 8,
    speed: 4,
    dx: 4,
    dy: -4
}];

// Bullets array
let bullets = [];

// Power-up timers
let paddleEnlargeTimer = 0;
let paddleShrinkTimer = 0;
const PADDLE_POWER_DURATION = 300; // frames

// Bricks
let bricks = [];
const BRICK_ROWS = 4;
const BRICK_COLS = 10;
const BRICK_WIDTH = 70;
const BRICK_HEIGHT = 15;
const BRICK_PADDING = 5;

// Brick colors for each row
const BRICK_COLORS = ['#ff6b6b', '#ffd93d', '#6bcf7f', '#4d96ff'];

// Power-up types
const POWER_UP_TYPES = {
    MULTI_BALL: 'multiBall',
    ENLARGE_PADDLE: 'enlargePaddle',
    SHRINK_PADDLE: 'shrinkPaddle'
};

// Power-up brick chance (1 in 5 bricks)
const POWER_UP_CHANCE = 0.2;

// Sound generation
function generateSound(frequency, duration, type = 'sine') {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

// Play sounds
function playPaddleSound() {
    generateSound(400, 0.1);
}

function playBrickSound() {
    generateSound(600, 0.15);
}

function playPowerUpSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;
    
    for (let i = 0; i < 2; i++) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.value = 800 + i * 200;
        gain.gain.setValueAtTime(0.3, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.2);
        
        osc.start(now + i * 0.15);
        osc.stop(now + i * 0.15 + 0.2);
    }
}

function playGunSound() {
    generateSound(800, 0.08);
}

function playGameOverSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;
    
    for (let i = 0; i < 3; i++) {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.value = 300 - i * 50;
        gain.gain.setValueAtTime(0.2, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
        
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.3);
    }
}

function playWinSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioContext.currentTime;
    const frequencies = [523, 659, 784, 1047]; // C, E, G, C
    
    frequencies.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        osc.start(now);
        osc.stop(now + 0.5);
    });
}

// Initialize bricks
function initBricks() {
    bricks = [];
    const powerUpTypesList = Object.values(POWER_UP_TYPES);
    
    for (let row = 0; row < BRICK_ROWS; row++) {
        bricks[row] = [];
        for (let col = 0; col < BRICK_COLS; col++) {
            const isPowerUp = Math.random() < POWER_UP_CHANCE;
            const powerUpType = isPowerUp ? powerUpTypesList[Math.floor(Math.random() * powerUpTypesList.length)] : null;
            
            bricks[row][col] = {
                x: col * (BRICK_WIDTH + BRICK_PADDING) + BRICK_PADDING,
                y: row * (BRICK_HEIGHT + BRICK_PADDING) + 30,
                width: BRICK_WIDTH,
                height: BRICK_HEIGHT,
                active: true,
                color: BRICK_COLORS[row],
                isPowerUp: isPowerUp,
                powerUpType: powerUpType
            };
        }
    }
    bricksLeft = BRICK_ROWS * BRICK_COLS;
    document.getElementById('bricks').textContent = bricksLeft;
}

// Handle keyboard input
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    // Start game with Enter
    if (e.key === 'Enter' && gameState === GAME_STATES.IDLE) {
        startGame();
    }

    // Restart game with Enter
    if ((e.key === 'Enter' && (gameState === GAME_STATES.GAME_OVER || gameState === GAME_STATES.WIN)) || e.key === 'r' || e.key === 'R') {
        resetGame();
    }

    // Fire gun with Space
    if (e.key === ' ' && gameState === GAME_STATES.PLAYING) {
        e.preventDefault();
        fireGun();
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

// Fire gun
function fireGun() {
    const bulletCount = 3;
    const spreadAngle = 30 * (Math.PI / 180); // 30 degrees in radians
    const bulletSpeed = 8;

    for (let i = 0; i < bulletCount; i++) {
        const angle = -Math.PI / 2 + (i - 1) * spreadAngle; // Spread bullets
        bullets.push({
            x: paddle.x + paddle.width / 2,
            y: paddle.y,
            radius: 4,
            vx: Math.cos(angle) * bulletSpeed,
            vy: Math.sin(angle) * bulletSpeed
        });
    }

    playGunSound();
}

// Apply power-up effect
function applyPowerUp(powerUpType) {
    switch (powerUpType) {
        case POWER_UP_TYPES.MULTI_BALL:
            // Multiply balls to 3
            const newBalls = [];
            for (let b of balls) {
                newBalls.push({
                    x: b.x,
                    y: b.y,
                    radius: b.radius,
                    speed: b.speed,
                    dx: b.dx + 2,
                    dy: b.dy
                });
                newBalls.push({
                    x: b.x,
                    y: b.y,
                    radius: b.radius,
                    speed: b.speed,
                    dx: b.dx - 2,
                    dy: b.dy
                });
            }
            balls = balls.concat(newBalls);
            break;

        case POWER_UP_TYPES.ENLARGE_PADDLE:
            paddle.width = paddle.baseWidth * 1.5;
            paddleEnlargeTimer = PADDLE_POWER_DURATION;
            break;

        case POWER_UP_TYPES.SHRINK_PADDLE:
            paddle.width = paddle.baseWidth * 0.6;
            paddleShrinkTimer = PADDLE_POWER_DURATION;
            break;
    }
}

// Start game
function startGame() {
    gameState = GAME_STATES.PLAYING;
    document.getElementById('startMessage').style.display = 'none';
    document.getElementById('gameStatus').textContent = '';
    resetBall();
    initBricks();
    gameLoop();
}

// Reset game
function resetGame() {
    gameState = GAME_STATES.IDLE;
    score = 0;
    lives = 3;
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('startMessage').style.display = 'block';
    document.getElementById('gameStatus').textContent = '';
    paddle.x = canvas.width / 2 - 50;
    paddle.width = paddle.baseWidth;
    paddleEnlargeTimer = 0;
    paddleShrinkTimer = 0;
    bullets = [];
    resetBall();
    initBricks();
}

// Reset ball
function resetBall() {
    balls = [{
        x: canvas.width / 2,
        y: canvas.height / 2,
        radius: 8,
        speed: 4,
        dx: 4,
        dy: -4
    }];
    bullets = [];
}

// Update game state
function update() {
    if (gameState !== GAME_STATES.PLAYING) return;

    // Update paddle power-up timers
    if (paddleEnlargeTimer > 0) {
        paddleEnlargeTimer--;
        if (paddleEnlargeTimer === 0) {
            paddle.width = paddle.baseWidth;
        }
    }

    if (paddleShrinkTimer > 0) {
        paddleShrinkTimer--;
        if (paddleShrinkTimer === 0) {
            paddle.width = paddle.baseWidth;
        }
    }

    // Paddle movement
    if (keys['ArrowLeft'] && paddle.x > 0) {
        paddle.x -= paddle.speed;
    }
    if (keys['ArrowRight'] && paddle.x + paddle.width < canvas.width) {
        paddle.x += paddle.speed;
    }

    // Update bullets
    let bulletsToRemove = [];
    for (let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        // Remove bullets that go off screen
        if (bullet.y < 0) {
            bulletsToRemove.push(i);
            continue;
        }

        // Bullet collision with bricks
        for (let row = 0; row < BRICK_ROWS; row++) {
            for (let col = 0; col < BRICK_COLS; col++) {
                const brick = bricks[row][col];
                if (!brick.active) continue;

                if (
                    bullet.x + bullet.radius > brick.x &&
                    bullet.x - bullet.radius < brick.x + brick.width &&
                    bullet.y + bullet.radius > brick.y &&
                    bullet.y - bullet.radius < brick.y + brick.height
                ) {
                    brick.active = false;
                    bricksLeft--;
                    score += 15; // More points for bullets
                    document.getElementById('score').textContent = score;
                    document.getElementById('bricks').textContent = bricksLeft;

                    playBrickSound();

                    // Apply power-up if brick had one
                    if (brick.isPowerUp) {
                        playPowerUpSound();
                        applyPowerUp(brick.powerUpType);
                    }

                    bulletsToRemove.push(i);

                    // Check win condition
                    if (bricksLeft === 0) {
                        gameState = GAME_STATES.WIN;
                        document.getElementById('gameStatus').textContent = `🏆 YOU WIN! Final Score: ${score}`;
                        document.getElementById('gameStatus').className = 'game-status-win';
                        playWinSound();
                        return;
                    }
                    break;
                }
            }
        }
    }

    // Remove bullets
    for (let i = bulletsToRemove.length - 1; i >= 0; i--) {
        bullets.splice(bulletsToRemove[i], 1);
    }

    // Update each ball
    let ballsToRemove = [];
    
    for (let ballIndex = 0; ballIndex < balls.length; ballIndex++) {
        let ball = balls[ballIndex];
        
        // Ball movement
        ball.x += ball.dx;
        ball.y += ball.dy;

        // Ball collision with walls
        if (ball.x - ball.radius < 0 || ball.x + ball.radius > canvas.width) {
            ball.dx *= -1;
            ball.x = ball.x - ball.radius < 0 ? ball.radius : canvas.width - ball.radius;
        }

        if (ball.y - ball.radius < 0) {
            ball.dy *= -1;
            ball.y = ball.radius;
        }

        // Ball collision with paddle
        if (
            ball.y + ball.radius > paddle.y &&
            ball.y - ball.radius < paddle.y + paddle.height &&
            ball.x > paddle.x &&
            ball.x < paddle.x + paddle.width
        ) {
            ball.dy = -Math.abs(ball.dy);
            ball.y = paddle.y - ball.radius;
            
            // Add spin based on where ball hits paddle
            const hitPos = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2);
            ball.dx += hitPos * 3;
            
            playPaddleSound();
        }

        // Ball out of bounds
        if (ball.y - ball.radius > canvas.height) {
            ballsToRemove.push(ballIndex);
            continue;
        }

        // Collision with bricks
        for (let row = 0; row < BRICK_ROWS; row++) {
            for (let col = 0; col < BRICK_COLS; col++) {
                const brick = bricks[row][col];
                
                if (!brick.active) continue;

                if (
                    ball.x + ball.radius > brick.x &&
                    ball.x - ball.radius < brick.x + brick.width &&
                    ball.y + ball.radius > brick.y &&
                    ball.y - ball.radius < brick.y + brick.height
                ) {
                    // Determine collision side
                    const overlapLeft = (ball.x + ball.radius) - brick.x;
                    const overlapRight = (brick.x + brick.width) - (ball.x - ball.radius);
                    const overlapTop = (ball.y + ball.radius) - brick.y;
                    const overlapBottom = (brick.y + brick.height) - (ball.y - ball.radius);
                    
                    const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
                    
                    if (minOverlap === overlapLeft || minOverlap === overlapRight) {
                        ball.dx *= -1;
                    } else {
                        ball.dy *= -1;
                    }

                    // Deactivate brick
                    brick.active = false;
                    bricksLeft--;
                    score += 10;
                    
                    document.getElementById('score').textContent = score;
                    document.getElementById('bricks').textContent = bricksLeft;
                    
                    // Play sound for brick break
                    playBrickSound();
                    
                    // Check if power-up brick
                    if (brick.isPowerUp) {
                        playPowerUpSound();
                        applyPowerUp(brick.powerUpType);
                    }
                    
                    // Check win condition
                    if (bricksLeft === 0) {
                        gameState = GAME_STATES.WIN;
                        document.getElementById('gameStatus').textContent = `🏆 YOU WIN! Final Score: ${score}`;
                        document.getElementById('gameStatus').className = 'game-status-win';
                        playWinSound();
                        return;
                    }
                }
            }
        }
    }

    // Remove balls that went out of bounds
    for (let i = ballsToRemove.length - 1; i >= 0; i--) {
        balls.splice(ballsToRemove[i], 1);
    }

    // Check if all balls are lost
    if (balls.length === 0) {
        lives--;
        document.getElementById('lives').textContent = lives;
        
        if (lives <= 0) {
            gameState = GAME_STATES.GAME_OVER;
            document.getElementById('gameStatus').textContent = `🎮 GAME OVER! Final Score: ${score}`;
            document.getElementById('gameStatus').className = 'game-status-lose';
            playGameOverSound();
            return;
        }
        
        resetBall();
    }
}

// Draw functions
function drawPaddle() {
    ctx.fillStyle = '#667eea';
    ctx.shadowColor = 'rgba(102, 126, 234, 0.8)';
    ctx.shadowBlur = 10;
    ctx.fillRect(paddle.x, paddle.y, paddle.width, paddle.height);
    ctx.shadowColor = 'transparent';
}

function drawBall() {
    for (let ball of balls) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#00ff88';
        ctx.shadowColor = 'rgba(0, 255, 136, 0.8)';
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.shadowColor = 'transparent';
    }
}

function drawBricks() {
    for (let row = 0; row < BRICK_ROWS; row++) {
        for (let col = 0; col < BRICK_COLS; col++) {
            const brick = bricks[row][col];
            if (!brick.active) continue;

            ctx.fillStyle = brick.color;
            ctx.shadowColor = brick.color;
            ctx.shadowBlur = 8;
            ctx.fillRect(brick.x, brick.y, brick.width, brick.height);
            
            // Draw power-up indicator
            if (brick.isPowerUp) {
                const centerX = brick.x + brick.width / 2;
                const centerY = brick.y + brick.height / 2;
                
                switch (brick.powerUpType) {
                    case POWER_UP_TYPES.MULTI_BALL:
                        // Yellow star for multi-ball
                        ctx.fillStyle = '#ffff00';
                        ctx.shadowColor = 'rgba(255, 255, 0, 0.8)';
                        ctx.shadowBlur = 10;
                        ctx.beginPath();
                        for (let i = 0; i < 5; i++) {
                            const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
                            const radius = i % 2 === 0 ? 4 : 2;
                            const x = centerX + radius * Math.cos(angle);
                            const y = centerY + radius * Math.sin(angle);
                            if (i === 0) ctx.moveTo(x, y);
                            else ctx.lineTo(x, y);
                        }
                        ctx.closePath();
                        ctx.fill();
                        break;

                    case POWER_UP_TYPES.ENLARGE_PADDLE:
                        // Green plus for enlarge
                        ctx.fillStyle = '#00ff88';
                        ctx.shadowColor = 'rgba(0, 255, 136, 0.8)';
                        ctx.shadowBlur = 10;
                        ctx.fillRect(centerX - 5, centerY - 1, 10, 2);
                        ctx.fillRect(centerX - 1, centerY - 5, 2, 10);
                        break;

                    case POWER_UP_TYPES.SHRINK_PADDLE:
                        // Red minus for shrink
                        ctx.fillStyle = '#ff6b6b';
                        ctx.shadowColor = 'rgba(255, 107, 107, 0.8)';
                        ctx.shadowBlur = 10;
                        ctx.fillRect(centerX - 5, centerY - 1, 10, 2);
                        break;
                }
            }
            
            ctx.shadowColor = 'transparent';
        }
    }
}

function drawBullets() {
    for (let bullet of bullets) {
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#ff00ff';
        ctx.shadowColor = 'rgba(255, 0, 255, 0.8)';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowColor = 'transparent';
    }
}

function draw() {
    // Clear canvas
    ctx.fillStyle = 'rgba(26, 26, 46, 0.1)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw game objects
    drawPaddle();
    drawBall();
    drawBricks();
    drawBullets();
}

// Main game loop
function gameLoop() {
    update();
    draw();

    if (gameState === GAME_STATES.PLAYING) {
        requestAnimationFrame(gameLoop);
    } else if (gameState === GAME_STATES.GAME_OVER || gameState === GAME_STATES.WIN) {
        // Show restart message
        document.getElementById('gameStatus').textContent += '\n\nPress ENTER to restart';
    }
}

// Initialize game
document.getElementById('gameStatus').textContent = '';
initBricks();
draw();
