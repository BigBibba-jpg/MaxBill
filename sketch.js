let player;
let bullets = [];
let enemies = [];
let particles = [];
let rain = [];
let bossBullets = [];

let score = 0;
let gameOver = false;
let victory = false;

let bossActive = false;
let bossHealth = 30;
let bossY = -200;

let trailLength = 8;

let big404 = [
"██   ██  ██████   ██   ██",
"██   ██ ██  ██   ██   ██",
"███████ ██  ██   ███████",
"     ██ ██  ██        ██",
"     ██  ██████        ██"
];

/* ---------- SETUP ---------- */
function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont("monospace");
  textAlign(CENTER, CENTER);
  player = new Player();

  for (let i = 0; i < width / 20; i++) {
    rain.push(new RainDrop(i * 20));
  }
}

/* ---------- DRAW ---------- */
function draw() {
  background(0, 140);

  // matrix rain
  for (let r of rain) {
    r.update();
    r.show();
  }

  if (victory) {
    showVictory();
    return;
  }

  if (gameOver) {
    showGameOver();
    return;
  }

  // trigger boss
  if (score >= 15 && !bossActive) {
    bossActive = true;
    enemies = [];
  }

  player.update();
  player.show();

  // bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    bullets[i].show();
    if (bullets[i].offscreen()) bullets.splice(i, 1);
  }

  /* ---------- NORMAL ENEMIES ---------- */
  if (!bossActive) {
    if (frameCount % 50 === 0) enemies.push(new Enemy());

    for (let i = enemies.length - 1; i >= 0; i--) {
      enemies[i].update();
      enemies[i].show();

      if (dist(enemies[i].x, enemies[i].y, player.x, player.y) < 20) {
        gameOver = true;
      }

      for (let j = bullets.length - 1; j >= 0; j--) {
        if (dist(bullets[j].x, bullets[j].y, enemies[i].x, enemies[i].y) < 15) {
          explode(enemies[i].x, enemies[i].y);
          enemies.splice(i, 1);
          bullets.splice(j, 1);
          score++;
          break;
        }
      }
    }
  }

  /* ---------- PARTICLES ---------- */
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
    if (particles[i].life <= 0) particles.splice(i, 1);
  }

  /* ---------- BOSS ---------- */
  if (bossActive) {
    updateBoss();
    drawBoss();
  }

  drawUI();
}

/* ---------- MATRIX RAIN ---------- */
class RainDrop {
  constructor(x) {
    this.x = x;
    this.y = random(-500, 0);
    this.speed = random(2, 6);
    this.chars = "01@#$%&";
  }

  update() {
    this.y += this.speed;
    if (this.y > height) this.y = random(-200, 0);
  }

  show() {
    fill(0, 255, 100, 120);
    textSize(16);
    let c = this.chars.charAt(floor(random(this.chars.length)));
    text(c, this.x, this.y);
  }
}

/* ---------- PLAYER ---------- */
class Player {
  constructor() {
    this.x = width / 2;
    this.y = height - 40;
    this.speed = 6;
  }

  update() {
    if (keyIsDown(LEFT_ARROW)) this.x -= this.speed;
    if (keyIsDown(RIGHT_ARROW)) this.x += this.speed;
    this.x = constrain(this.x, 20, width - 20);
  }

  show() {
    fill(0, 255, 255);
    textSize(20);
    text("^", this.x, this.y);
  }
}

/* ---------- BULLET ---------- */
class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  update() {
    this.y -= 8;
  }

  show() {
    fill(255, 255, 0);
    text("|", this.x, this.y);
  }

  offscreen() {
    return this.y < 0;
  }
}

/* ---------- ENEMY ---------- */
class Enemy {
  constructor() {
    this.x = random(width);
    this.y = -20;
    this.speed = random(2, 5);
    this.angle = random(360);
    this.spin = random(-5, 5);
    this.history = [];
  }

  update() {
    this.y += this.speed;
    this.angle += this.spin;

    this.history.push({ x: this.x, y: this.y });
    if (this.history.length > trailLength) this.history.shift();
  }

  show() {
    for (let i = 0; i < this.history.length; i++) {
      let p = this.history[i];
      fill(0, 255, 100, map(i, 0, this.history.length, 20, 150));
      text("@", p.x, p.y);
    }

    push();
    translate(this.x, this.y);
    rotate(this.angle);
    fill(0, 255, 150);
    text("@", 0, 0);
    pop();
  }
}

/* ---------- PARTICLES (SAFE ASCII) ---------- */
function explode(x, y) {
  let chars = "@#$%01";
  for (let i = 0; i < 15; i++) {
    let c = chars.charAt(floor(random(chars.length)));
    particles.push(new Particle(x, y, c));
  }
}

class Particle {
  constructor(x, y, c) {
    this.x = x;
    this.y = y;
    this.vx = random(-2, 2);
    this.vy = random(-2, 2);
    this.life = 60;
    this.char = c;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
  }

  show() {
    fill(0, 255, 100, this.life * 4);
    text(this.char, this.x, this.y);
  }
}

/* ---------- BOSS ---------- */
class BossBullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = random(3, 6);
  }

  update() {
    this.y += this.speed;
  }

  show() {
    fill(0, 255, 100);
    text("#", this.x, this.y);
  }

  offscreen() {
    return this.y > height;
  }
}

function drawBoss() {
  fill(0, 255, 100);
  textSize(20);
  textAlign(CENTER, CENTER);

  let lineHeight = 30;
  let totalHeight = big404.length * lineHeight;
  let startY = bossY - totalHeight / 2;

  for (let i = 0; i < big404.length; i++) {
    text(big404[i], width / 2, startY + i * lineHeight);
  }

  // HP display centered above boss
  textSize(14);
  text("BOSS HP: " + bossHealth, width / 2, startY - 30);
}

function updateBoss() {
  if (bossY < 150) bossY += 1;

  // boss shoots
  if (frameCount % 25 === 0) {
    bossBullets.push(
      new BossBullet(random(width / 2 - 160, width / 2 + 160), bossY + 60)
    );
  }

  // bullets update
  for (let i = bossBullets.length - 1; i >= 0; i--) {
    bossBullets[i].update();
    bossBullets[i].show();

    if (dist(bossBullets[i].x, bossBullets[i].y, player.x, player.y) < 15) {
      gameOver = true;
    }

    if (bossBullets[i].offscreen()) {
      bossBullets.splice(i, 1);
    }
  }

  // damage boss
  for (let i = bullets.length - 1; i >= 0; i--) {
    if (bullets[i].y < bossY + 120 && bullets[i].y > bossY) {
      bossHealth--;
      bullets.splice(i, 1);
    }
  }

  if (bossHealth <= 0) {
    victory = true;
  }
}

/* ---------- UI ---------- */
function drawUI() {
  fill(0, 255, 100);
  textAlign(LEFT);
  textSize(16);
  text("Score: " + score, 10, 20);
}

/* ---------- SCREENS ---------- */
function showGameOver() {
  fill(255, 0, 0);
  textSize(30);
  textAlign(CENTER);
  text("YOU WERE FOUND", width / 2, height / 2 - 40);

  drawRestartButton();
}

function showVictory() {
  fill(0, 255, 100);
  textAlign(CENTER, CENTER);

  textSize(32);
  text("SYSTEM RESTORED", width / 2, height / 2 - 80);

  drawRestartButton();
}

/* ---------- BUTTON ---------- */
function drawRestartButton() {
  let bx = width / 2;
  let by = height / 2 + 20;

  rectMode(CENTER);

  fill(20);
  rect(bx, by, 240, 55);

  fill(0, 255, 100);
  textAlign(CENTER, CENTER);
  textSize(16);
  text("RETURN / RESTART", bx, by);
}

function mousePressed() {
  if (gameOver || victory) {
    let bx = width / 2;
    let by = height / 2 + 20;

    if (
      mouseX > bx - 120 &&
      mouseX < bx + 120 &&
      mouseY > by - 27 &&
      mouseY < by + 27
    ) {
      resetGame();
    }
  }

}

/* ---------- RESET ---------- */
function resetGame() {
  score = 0;
  enemies = [];
  bullets = [];
  particles = [];
  bossBullets = [];

  gameOver = false;
  victory = false;
  bossActive = false;

  bossHealth = 30;
  bossY = -200;
}

/* ---------- INPUT ---------- */
function keyPressed() {
  if (key === " ") {
    bullets.push(new Bullet(player.x, player.y - 10));
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}