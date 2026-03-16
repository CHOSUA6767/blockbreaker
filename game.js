(function () {
  'use strict';

  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  const PADDLE_WIDTH = 120;
  const PADDLE_HEIGHT = 16;
  const PADDLE_SPEED = 8;
  const BALL_RADIUS = 8;
  const BALL_SPEED = 5;
  const BRICK_ROWS = 6;
  const BRICK_COLS = 10;
  const BRICK_PADDING = 4;
  const BRICK_OFFSET_TOP = 60;
  const BRICK_OFFSET_LEFT = 20;

  const BRICK_COLORS = ['#ff6b6b', '#4ecdc4', '#ffe66d', '#95e1d3', '#dda0dd', '#98d8c8'];

  let gameState = 'start'; // start | playing | paused | gameover | win
  let score = 0;
  let lives = 3;
  let level = 1;

  let paddle = {
    x: canvas.width / 2 - PADDLE_WIDTH / 2,
    y: canvas.height - 40,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    dx: 0
  };

  let ball = {
    x: canvas.width / 2,
    y: canvas.height - 60,
    radius: BALL_RADIUS,
    dx: 0,
    dy: 0,
    speed: BALL_SPEED
  };

  let bricks = [];
  let keys = {};
  let mouseX = canvas.width / 2;

  function createBricks() {
    bricks = [];
    const brickWidth = (canvas.width - BRICK_OFFSET_LEFT * 2 - BRICK_PADDING * (BRICK_COLS - 1)) / BRICK_COLS;
    const brickHeight = 22;

    for (let row = 0; row < BRICK_ROWS; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        bricks.push({
          x: BRICK_OFFSET_LEFT + col * (brickWidth + BRICK_PADDING),
          y: BRICK_OFFSET_TOP + row * (brickHeight + BRICK_PADDING),
          width: brickWidth,
          height: brickHeight,
          color: BRICK_COLORS[row % BRICK_COLORS.length],
          visible: true
        });
      }
    }
  }

  function resetBall() {
    ball.x = canvas.width / 2;
    ball.y = canvas.height - 60;
    const angle = (Math.random() * 0.6 - 0.3) * Math.PI; // -0.3 to 0.3 rad
    ball.dx = ball.speed * Math.sin(angle);
    ball.dy = -ball.speed * Math.cos(angle);
  }

  function resetPaddle() {
    paddle.x = canvas.width / 2 - PADDLE_WIDTH / 2;
  }

  function drawPaddle() {
    const gradient = ctx.createLinearGradient(paddle.x, 0, paddle.x + paddle.width, 0);
    gradient.addColorStop(0, '#00f5d4');
    gradient.addColorStop(0.5, '#00b4a0');
    gradient.addColorStop(1, '#00f5d4');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    const r = 8;
    ctx.moveTo(paddle.x + r, paddle.y);
    ctx.lineTo(paddle.x + paddle.width - r, paddle.y);
    ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y, paddle.x + paddle.width, paddle.y + r);
    ctx.lineTo(paddle.x + paddle.width, paddle.y + paddle.height - r);
    ctx.quadraticCurveTo(paddle.x + paddle.width, paddle.y + paddle.height, paddle.x + paddle.width - r, paddle.y + paddle.height);
    ctx.lineTo(paddle.x + r, paddle.y + paddle.height);
    ctx.quadraticCurveTo(paddle.x, paddle.y + paddle.height, paddle.x, paddle.y + paddle.height - r);
    ctx.lineTo(paddle.x, paddle.y + r);
    ctx.quadraticCurveTo(paddle.x, paddle.y, paddle.x + r, paddle.y);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawBall() {
    const gradient = ctx.createRadialGradient(
      ball.x - 3, ball.y - 3, 0,
      ball.x, ball.y, ball.radius
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#00f5d4');
    gradient.addColorStop(1, '#00b4a0');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  function drawBricks() {
    bricks.forEach(function (brick) {
      if (!brick.visible) return;

      ctx.fillStyle = brick.color;
      ctx.fillRect(brick.x, brick.y, brick.width, brick.height);

      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 1;
      ctx.strokeRect(brick.x, brick.y, brick.width, brick.height);

      // 하이라이트
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(brick.x + 2, brick.y + 2, brick.width - 4, 4);
    });
  }

  function drawUI() {
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.font = '14px "Orbitron", sans-serif';
    ctx.fillText('점수: ' + score, 20, 25);
    ctx.fillText('생명: ' + lives, canvas.width - 80, 25);
    ctx.fillText('레벨 ' + level, canvas.width / 2 - 30, 25);
  }

  function updatePaddle() {
    if (keys['ArrowLeft']) paddle.dx = -PADDLE_SPEED;
    else if (keys['ArrowRight']) paddle.dx = PADDLE_SPEED;
    else paddle.dx = 0;

    paddle.x += paddle.dx;
    if (paddle.x < 0) paddle.x = 0;
    if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
  }

  function updateBall() {
    ball.x += ball.dx;
    ball.y += ball.dy;

    // 벽
    if (ball.x - ball.radius < 0) {
      ball.x = ball.radius;
      ball.dx = -ball.dx;
    }
    if (ball.x + ball.radius > canvas.width) {
      ball.x = canvas.width - ball.radius;
      ball.dx = -ball.dx;
    }
    if (ball.y - ball.radius < 0) {
      ball.y = ball.radius;
      ball.dy = -ball.dy;
    }

    // 바닥 (생명 감소)
    if (ball.y + ball.radius > canvas.height) {
      lives--;
      document.getElementById('lives').textContent = lives;
      if (lives <= 0) {
        gameState = 'gameover';
        document.getElementById('finalScore').textContent = score;
        document.getElementById('gameOverScreen').classList.remove('hidden');
        return;
      }
      resetBall();
      resetPaddle();
      return;
    }

    // 패들
    if (
      ball.y + ball.radius >= paddle.y &&
      ball.y - ball.radius <= paddle.y + paddle.height &&
      ball.x >= paddle.x &&
      ball.x <= paddle.x + paddle.width
    ) {
      const hitPos = (ball.x - paddle.x) / paddle.width;
      const angle = (hitPos - 0.5) * 1.2;
      ball.dx = ball.speed * Math.sin(angle);
      ball.dy = -ball.speed * Math.cos(angle);
      ball.y = paddle.y - ball.radius;
    }

    // 벽돌
    bricks.forEach(function (brick) {
      if (!brick.visible) return;

      if (
        ball.x + ball.radius > brick.x &&
        ball.x - ball.radius < brick.x + brick.width &&
        ball.y + ball.radius > brick.y &&
        ball.y - ball.radius < brick.y + brick.height
      ) {
        brick.visible = false;
        score += 10;
        document.getElementById('score').textContent = score;

        const overlapLeft = ball.x + ball.radius - brick.x;
        const overlapRight = brick.x + brick.width - (ball.x - ball.radius);
        const overlapTop = ball.y + ball.radius - brick.y;
        const overlapBottom = brick.y + brick.height - (ball.y - ball.radius);

        const minOverlap = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
        if (minOverlap === overlapLeft || minOverlap === overlapRight) ball.dx = -ball.dx;
        if (minOverlap === overlapTop || minOverlap === overlapBottom) ball.dy = -ball.dy;
      }
    });

    const allBroken = bricks.every(function (b) { return !b.visible; });
    if (allBroken) {
      gameState = 'win';
      document.getElementById('winScore').textContent = score;
      document.getElementById('winScreen').classList.remove('hidden');
    }
  }

  function gameLoop() {
    ctx.fillStyle = '#12121a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawBricks();
    drawPaddle();
    drawBall();
    drawUI();

    if (gameState === 'playing') {
      updatePaddle();
      updateBall();
    }

    requestAnimationFrame(gameLoop);
  }

  function startGame() {
    gameState = 'playing';
    score = 0;
    lives = 3;
    level = 1;
    document.getElementById('score').textContent = score;
    document.getElementById('lives').textContent = lives;
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('winScreen').classList.add('hidden');
    createBricks();
    resetBall();
    resetPaddle();
  }

  function nextLevel() {
    level++;
    gameState = 'playing';
    document.getElementById('winScreen').classList.add('hidden');
    ball.speed = Math.min(BALL_SPEED + level * 0.5, 10);
    createBricks();
    resetBall();
    resetPaddle();
  }

  canvas.addEventListener('mousemove', function (e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    mouseX = (e.clientX - rect.left) * scaleX;
    if (gameState === 'playing') {
      paddle.x = mouseX - paddle.width / 2;
      if (paddle.x < 0) paddle.x = 0;
      if (paddle.x + paddle.width > canvas.width) paddle.x = canvas.width - paddle.width;
    }
  });

  document.addEventListener('keydown', function (e) {
    keys[e.key] = true;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') e.preventDefault();
  });

  document.addEventListener('keyup', function (e) {
    keys[e.key] = false;
  });

  document.getElementById('startBtn').addEventListener('click', startGame);
  document.getElementById('restartBtn').addEventListener('click', startGame);
  document.getElementById('nextLevelBtn').addEventListener('click', nextLevel);

  createBricks();
  gameLoop();
})();
