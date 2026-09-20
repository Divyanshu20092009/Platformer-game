const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gravity = 0.5;
const moveSpeed = 5;
const jumpPower = 10;
const image = src => {
  const img = new Image();
  img.src = src;
  img.onerror = () => console.warn("Missing the image assets", src);
  const rawDrawImage = ctx.drawImage.bind(ctx);
  ctx.drawImage = (img, ...rest) => {
    if (!img || !img.complete || img.naturalWidth === 0) return;
    rawDrawImage(img, ...rest);
  }
  return img;
};

const playerImage = image("p/p1_walk01.png");
const platformImage = image("item/grassHalfMid.png");
const enemyImage = image("enemies/fishSwim1.png");
const slimeImage = image("enemies/slimeWalk1.png");
const snailImage = image("enemies/snailWalk1.png")
const flyImage = image("enemies/flyFly1.png");
const gemImages = { blue: image("collection/gemBlue.png"), green: image("collection/gemGreen.png"), red: image("collection/gemRed.png"), yellow: image("collection/gemYellow.png") };
const keyImage = image("collection/keyYellow.png");
const checkpointImage = image("collection/flagGreen.png");
let muted = false;

const player = {
  x: 100,
  y: 300,
  width: 40,
  height: 60,
  dx: 0,
  dy: 0,
  jumping: false,
  grounded: false,
  spawnX: 100,
  spawnY: 300,
  animationTick: 0,
  invulnerable: 0,
  standingPlatform: null
};
let platforms = [{ x: 0, y: 400, width: 1000, height: 20 }];
let enemies = [];
// let obstacle = { x: 600, y: 360, width: 30, height: 40 };
let coins = [];
let gems = [];
let levelKey = null;
let checkpoint = null;
let goal = { x: 950, y: 118, width: 30, height: 60 };
let isGameRunning = false;
let gamePaused = false;
let frameId = 0;
let score = 0;
let lives = 3;
let currentLevel = 0;
let levelFrames = 0;
const levels = [];
const keys = {};
let setupWorld = () => resetPlayer();
let handleFall = () => resetPlayer();
let updatePlatforms = () => { };
let updateEnemies = () => { };
let updateCollections = () => { };
let updateCheckpoint = () => { };
let updateGoal = () => { };
let drawEnemies = () => { };
// let drawObstacle = () => { };
let drawCoins = () => { };
let drawExtras = () => { };
let drawCheckpoint = () => { };
let drawGoal = () => { };
let drawHud = () => { };
function resetPlayer() {
  player.x = player.spawnX;
  player.y = player.spawnY;
  player.dx = 0;
  player.dy = 0;
  player.jumping = false;
  player.grounded = false;
  player.standingPlatform = null;
}
function drawPlatforms() {
  platforms.forEach(platform => {
    for (let x = 0; x < platform.width; x += 50) {
      ctx.drawImage(platformImage, platform.x + x, platform.y, 50, 20);
    }
  });
}
function drawPlayer() {
  ctx.drawImage(playerImage, player.x, player.y, player.width, player.height);
}

function movePlayer() {
  if ((keys.ArrowUp || keys[" "]) && player.grounded) {
    player.dy = -jumpPower;
    player.jumping = true;
    player.grounded = false;
  }
  player.dx = keys.ArrowLeft && !keys.ArrowRight ? -moveSpeed : keys.ArrowRight && !keys.ArrowLeft ? moveSpeed : 0;
}

function updatePlayer() {
  const oldBottom = player.y + player.height;
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x + player.dx)); player.y += player.dy;
  player.dy += gravity;
  player.grounded = false;
  platforms.forEach(p => { const bottom = player.y + player.height, inside = player.x < p.x + p.width && player.x + player.width > p.x; if (inside && oldBottom <= p.y && bottom >= p.y && player.dy >= 0) {
    player.y = p.y - player.height;
    player.dy = 0;
    player.jumping = false;
    player.grounded = true;
    player.standingPlatform = p;} });
  if (player.y > canvas.height + 80 && player.invulnerable <= 0) handleFall();
}

function gameLoop() { if (!isGameRunning || gamePaused) return; ctx.clearRect(0, 0, canvas.width, canvas.height); levelFrames++; movePlayer(); updatePlatforms(); updatePlayer(); updateEnemies(); updateCollections(); updateCheckpoint(); updateGoal(); drawPlatforms(); drawEnemies(); drawObstacle(); drawCoins(); drawExtras(); drawCheckpoint(); drawGoal(); drawPlayer(); drawHud(); frameId = requestAnimationFrame(gameLoop); }
function startGame() { document.getElementById("start-screen").classList.add("hidden"); setupWorld(); isGameRunning = true; cancelAnimationFrame(frameId); gameLoop(); }
function restartGame() { score = 0; lives = 3; currentLevel = 0; setupWorld(); document.getElementById("game-over-screen").classList.add("hidden"); isGameRunning = true; cancelAnimationFrame(frameId); gameLoop(); }
function mainAction() { restartGame(); }

function exitGame() {
  window.close();
  setTimeout(() => {
    isGameRunning = false;
    cancelAnimationFrame(frameId);
    document.getElementById("game-over-screen").classList.add("hidden");
    document.getElementById("pause-screen").classList.add("hidden");
    document.getElementById("start-screen").classList.remove("hidden");
    showStatus("Thanks for playing the GAME - close the tab to EXIT")
  }, 150);
};

document.addEventListener("keydown", e => {
  if (["ArrowLeft", "ArrowRight", "ArrowUp", " "].includes(e.key)) {
    e.preventDefault();
  }
  keys[e.key] = true;
});
document.addEventListener("keyup", e => { keys[e.key] = false; });
const coinSound = document.getElementById("coinSound");
const jumpSound = document.getElementById("jumpSound");
const winSound = document.getElementById("winSound");
const loseSound = document.getElementById("loseSound");
const coinImage = image("collection/coinGold.png");
const treeImage = image("item/cactus.png");
const flagImage = image("item/flagYellow.png");
let highScore = Number(localStorage.getItem("platformerHighScore")) || 0;
let statusText = "";
let statusFrames = 0;
function touches(item) {
  return player.x < item.x + item.width &&
    player.x + player.width > item.x &&
    player.y < item.y + item.height &&
    player.y + player.height > item.y;
}
function showStatus(text) { statusText = text; statusFrames = 90; }
function saveHighScore() { if (score > highScore) { highScore = score; localStorage.setItem("platformerHighScore", highScore); } }
function collectedCoinCount() { return coins.filter(c => c.collected).length; }
coins = [
  { x: 100, y: 360, width: 20, height: 20, collected: false },
  { x: 200, y: 360, width: 20, height: 20, collected: false },
  { x: 500, y: 220, width: 20, height: 20, collected: false }
];
drawCoins = () => coins.forEach(c => { if (!c.collected) ctx.drawImage(coinImage, c.x, c.y, c.width, c.height); });
drawGoal = () => {
  ctx.drawImage(flagImage, goal.x, goal.y, goal.width, goal.height);
};
updateCollections = () => coins.forEach(c => {
  if (!c.collected && touches(c)) {
    c.collected = true;
    score += 10;
    coinSound.currentTime = 0;
    coinSound.play();
  }
});
updateGoal = () => {
  if (!touches(goal)) return;
  isGameRunning = false;
  score += 25;
  saveHighScore();
  winSound.currentTime = 0;
  winSound.play();
  document.getElementById("game-over-message").innerText = "You Win!";
  document.getElementById("mainActionBtn").innerText = "Restart";
  document.getElementById("game-over-screen").classList.remove("hidden");
};
drawHud = () => {
  ctx.fillStyle = "black"; ctx.font = "20px Arial";
  ctx.fillText("Score: " + score, 10, 20);
  ctx.fillText("High Score: " + highScore, 10, 40);
  ctx.fillText("Coins: " + collectedCoinCount() + "/" + coins.length, 10, 60);
  if (statusFrames > 0) {
    ctx.font = "18px Arial";
    ctx.textAlign = "center";
    ctx.fillText(statusText, canvas.width / 2, 35);
    ctx.textAlign = "left";
    statusFrames--;
  }
};
const oldMovePlayer = movePlayer;
movePlayer = function () {
  const wasGrounded = player.grounded;
  oldMovePlayer();

  if ((keys.ArrowUp || keys[" "]) && wasGrounded && player.dy < 0) {
    jumpSound.currentTime = 0;
    jumpSound.play();
  }
};

function loseLife() {
  lives--; loseSound.currentTime = 0;
  loseSound.play();
  if (lives <= 0) {
    isGameRunning = false;
    document.getElementById("game-over-message").innerText = "Game Over!";
    document.getElementById("mainActionBtn").innerText = "Restart";
    document.getElementById("game-over-screen").classList.remove("hidden");
    saveHighScore();
    return;
  }
  resetPlayer(); player.invulnerable = 90;
  showStatus("Lives left: " + lives);
}

const P = (x, y, width, height = 20, extra = {}) => ({ x, y, width, height, ...extra });
const C = (x, y) => ({ x, y, width: 20, height: 20 });
const G = (x, y, color) => ({ x, y, width: 22, height: 22, color });
const E = (x, y, dx, minX, maxX, type = "fish") => ({ x, y, width: 30, height: 30, dx, minX, maxX, type });
levels.push({
  name: "First Steps", par: 35, start: { x: 100, y: 300 },
  platforms: [P(0, 400, 1000), P(300, 300, 100), P(500, 250, 100), P(700, 200, 100), P(850, 150, 100)],
  enemies: [E(300, 370, 2, 250, 400)], obstacle: P(600, 360, 30, 40),
  checkpoint: { x: 520, y: 210, width: 24, height: 40, spawnX: 500, spawnY: 170 },
  coins: [C(200, 360), C(500, 220), C(650, 100), C(300, 240), C(800, 120), C(100, 360), C(400, 270), C(600, 180)],
  gems: [G(545, 205, "blue"), G(875, 105, "green")], key: null,
  goal: P(950, 118, 30, 60)
});
levels.push({
  name: "Long Way Up", par: 45, start: { x: 60, y: 320 },
  platforms: [P(0, 400, 240), P(280, 350, 140), P(470, 300, 120), P(650, 250, 110), P(810, 205, 160), P(620, 130, 120), P(420, 100, 130)],
  enemies: [E(305, 320, 1.8, 280, 420), E(825, 175, 1.4, 810, 970, "slime")],
  checkpoint: { x: 650, y: 90, width: 24, height: 40, spawnX: 640, spawnY: 50 },
  coins: [C(120, 350), C(330, 310), C(500, 260), C(680, 210), C(850, 165), C(915, 165), C(660, 90), C(460, 60)],
  gems: [G(700, 90, "red"), G(430, 60, "yellow")], key: null, goal: P(500, 40, 30, 60)
});
function copyItems(items, flag) { return items.map(item => ({ ...item, [flag]: false })); }
function loadLevel(index) {
  const level = levels[index]; currentLevel = index; levelFrames = 0;
  platforms = level.platforms.map(p => ({ ...p }));
  enemies = copyItems(level.enemies, "defeated");
  checkpoint = level.checkpoint ? { ...level.checkpoint, active: false } : null;
  coins = copyItems(level.coins, "collected");
  gems = copyItems(level.gems || [], "collected");
  levelKey = level.key ? { ...level.key, collected: false } : null;
  goal = { ...level.goal };
  player.spawnX = level.start.x;
  player.spawnY = level.start.y;
  resetPlayer();
}
function currentLevelName() { return levels[currentLevel] ? levels[currentLevel].name : ""; }
setupWorld = () => loadLevel(currentLevel);
startGame = function () {
  document.getElementById("start-screen").classList.add("hidden");
  document.getElementById("pause-screen").classList.add("hidden");
  gamePaused = false; lives = 3; loadLevel(currentLevel); isGameRunning = true;
  cancelAnimationFrame(frameId); gameLoop();
};
restartGame = function () { score = 0; lives = 3; gamePaused = false; document.getElementById("pause-screen").classList.add("hidden"); loadLevel(0); document.getElementById("game-over-screen").classList.add("hidden"); isGameRunning = true; cancelAnimationFrame(frameId); gameLoop(); };
levels.push({
  name: "Broken Bridge", par: 50, start: { x: 40, y: 320 },
  platforms: [P(0, 400, 180), P(230, 360, 120), P(400, 315, 130), P(590, 355, 110), P(760, 300, 190), P(610, 210, 120), P(410, 165, 120), P(210, 115, 130)],
  enemies: [E(250, 330, 1.6, 230, 350, "snail"), E(800, 270, 2.1, 760, 950, "slime"), { x: 560, y: 120, width: 30, height: 30, dy: 1.3, minY: 90, maxY: 220, type: "fly", axis: "y" }],
  obstacle: P(650, 315, 30, 40), checkpoint: { x: 430, y: 125, width: 24, height: 40, spawnX: 420, spawnY: 85 },
  coins: [C(90, 350), C(270, 320), C(445, 275), C(615, 315), C(805, 260), C(675, 170), C(455, 125), C(260, 75)],
  gems: [G(475, 120, "green"), G(235, 70, "red"), G(890, 255, "blue")],
  key: { x: 635, y: 165, width: 24, height: 24 }, goal: P(300, 55, 30, 60)
});
levels.push({
  name: "Moving Ground", par: 55, start: { x: 40, y: 320 },
  platforms: [P(0, 400, 190), P(230, 340, 120, 20, { dx: 1.2, minX: 210, maxX: 390 }), P(450, 300, 120), P(650, 260, 110, 20, { dy: 1, minY: 210, maxY: 330 }), P(820, 210, 140), P(620, 130, 120, 20, { dx: 1.4, minX: 550, maxX: 760 }), P(380, 90, 140)],
  enemies: [E(470, 270, 1.9, 450, 570, "snail"), E(845, 180, 2.3, 820, 960, "slime"), { x: 575, y: 100, width: 30, height: 30, dy: 1.6, minY: 70, maxY: 210, type: "fly", axis: "y" }],
  obstacle: P(710, 220, 30, 40), checkpoint: { x: 835, y: 170, width: 24, height: 40, spawnX: 825, spawnY: 130 },
  coins: [C(95, 350), C(270, 300), C(490, 260), C(680, 220), C(880, 170), C(665, 90), C(430, 50)],
  gems: [G(330, 295, "yellow"), G(735, 90, "blue"), G(500, 50, "red")], key: null, goal: P(455, 30, 30, 60)
});
levels.push({
  name: "Final Climb", par: 65, start: { x: 45, y: 320 },
  platforms: [P(0, 400, 160), P(205, 345, 110, 20, { dx: 1.5, minX: 190, maxX: 370 }), P(420, 300, 110), P(620, 350, 115, 20, { dy: 1.2, minY: 250, maxY: 370 }), P(820, 285, 150), P(660, 205, 115, 20, { dx: 1.7, minX: 590, maxX: 800 }), P(430, 160, 120), P(210, 115, 120, 20, { dy: 1, minY: 70, maxY: 180 }), P(40, 65, 125)],
  enemies: [E(440, 270, 2.2, 420, 530, "snail"), E(850, 255, 2.5, 820, 970, "slime"), { x: 570, y: 125, width: 30, height: 30, dy: 1.8, minY: 90, maxY: 240, type: "fly", axis: "y" }, E(235, 85, 1.8, 210, 330)],
  obstacle: P(690, 310, 30, 40), checkpoint: { x: 445, y: 120, width: 24, height: 40, spawnX: 430, spawnY: 80 },
  coins: [C(90, 350), C(240, 305), C(455, 260), C(655, 310), C(865, 245), C(705, 165), C(465, 120), C(250, 75), C(85, 25)],
  gems: [G(315, 300, "green"), G(920, 240, "yellow"), G(520, 115, "red"), G(120, 20, "blue")],
  key: { x: 725, y: 165, width: 24, height: 24 }, goal: P(70, 5, 30, 60)
});
function hasMoreLevels() { return currentLevel < levels.length - 1; }

function levelPar() { return levels[currentLevel].par; }

function finishLevel() {
  score += 25; const seconds = Math.floor(levelFrames / 60);
  if (seconds <= levelPar()) { score += 35; showStatus("Fast finish +35"); }
  if (gems.length && gems.every(g => g.collected)) { score += 50; showStatus("All gems bonus +50"); }
  saveHighScore(); isGameRunning = false; winSound.currentTime = 0; winSound.play();
  const more = hasMoreLevels();
  document.getElementById("game-over-message").innerText = more ? "Level Complete!" : "Adventure Complete!";
  document.getElementById("mainActionBtn").innerText = more ? "Next Level" : "Play Again";
  document.getElementById("game-over-screen").classList.remove("hidden");
}
updateGoal = () => { if (levelKey && !levelKey.collected) return; if (touches(goal)) finishLevel(); };
mainAction = function () { if (currentLevel < levels.length - 1 && !isGameRunning) { document.getElementById("game-over-screen").classList.add("hidden"); loadLevel(currentLevel + 1); isGameRunning = true; cancelAnimationFrame(frameId); gameLoop(); return; } restartGame(); };

updatePlatforms = () => platforms.forEach(p => {
  if (p.dx !== undefined) {
    const prevX = p.x; p.x += p.dx;
    if (p.x < p.minX || p.x > p.maxX) p.dx *= -1;
    if (player.standingPlatform === p) player.x += p.x - prevX;
  }
  if (p.dy !== undefined) {
    const prevY = p.y; p.y += p.dy;
    if (p.y < p.minY || p.y > p.maxY) p.dy *= -1;
    if (player.standingPlatform === p) player.y += p.y - prevY;
  }
});

updateEnemies = () => enemies.forEach(e => {
  if (e.defeated) return;
  if (e.axis === "y") { e.y += e.dy; if (e.y < e.minY || e.y + e.height > e.maxY) e.dy *= -1; }
  else { e.x += e.dx; if (e.x < e.minX || e.x + e.width > e.maxX) e.dx *= -1; }
  if (!touches(e) || player.invulnerable > 0) return;
  if (player.dy > 1 && player.y + player.height < e.y + 18) { e.defeated = true; player.dy = -7; score += 15; coinSound.currentTime = 0; coinSound.play(); }
  else loseLife();
});

drawEnemies = () => enemies.forEach(e => {
  if (e.defeated) return;
  const img = e.type === "slime" ? slimeImage : e.type === "snail" ? snailImage : e.type === "fly" ? flyImage : enemyImage;
  ctx.drawImage(img, e.x, e.y, e.width, e.height);
});

updateCheckpoint = () => {
  if (player.invulnerable > 0) player.invulnerable--;
  if (!checkpoint || checkpoint.active || !touches(checkpoint)) return;
  checkpoint.active = true; player.spawnX = checkpoint.spawnX; player.spawnY = checkpoint.spawnY;
  showStatus("checkpoint reached");
};

drawCheckpoint = () => { if (checkpoint) ctx.drawImage(checkpointImage, checkpoint.x, checkpoint.y, checkpoint.width, checkpoint.height); };

drawExtras = () => {
  gems.forEach(g => { if (!g.collected) ctx.drawImage(gemImages[g.color], g.x, g.y, g.width, g.height); });
  if (levelKey && !levelKey.collected) ctx.drawImage(keyImage, levelKey.x, levelKey.y, levelKey.width, levelKey.height);
}

const oldUpdateCollections = updateCollections;
updateCollections = () => {
  oldUpdateCollections();
  gems.forEach(g => { if (!g.collected && touches(g)) { g.collected = true; score += 15; coinSound.currentTime = 0; coinSound.play(); } });
  if (levelKey && !levelKey.collected && touches(levelKey)) { levelKey.collected = true; showStatus("key collected"); coinSound.currentTime = 0; coinSound.play(); }
};
handleFall = () => loseLife();

const oldDrawHud = drawHud;
drawHud = () => { oldDrawHud(); ctx.font = "20px Arial"; ctx.fillText("Lives: " + lives, 10, 80); };

document.addEventListener("keydown", e => {
  if (e.key.toLowerCase() === "m") {
    muted = !muted;
    [coinSound, jumpSound, winSound, loseSound].forEach(s => s.muted = muted);
    showStatus(muted ? "sound off" : "sound on");
  }
});

// function bindHoldButton(id, onDown, onUp) {
//   const btn = document.getElementById(id);
//   const press = e => { e.preventDefault(); onDown(); };
//   const release = e => { e.preventDefault(); onUp(); };
//   btn.addEventListener("touchstart", press);
//   btn.addEventListener("touchend", release);
//   btn.addEventListener("mousedown", press);
//   btn.addEventListener("mouseup", release);
//   btn.addEventListener("mouseleave", release);
// }
bindHoldButton("leftBtn", () => keys["ArrowLeft"] = true, () => keys["ArrowLeft"] = false);
bindHoldButton("rightBtn", () => keys["ArrowRight"] = true, () => keys["ArrowRight"] = false);
bindHoldButton("jumpBtn", () => keys[" "] = true, () => keys[" "] = false);
const walkFrames = [
  image("p/p1_walk01.png"), image("p/p1_walk02.png"), image("p/p1_walk03.png"), image("p/p1_walk04.png"),
  image("p/p1_walk05.png"), image("p/p1_walk06.png"), image("p/p1_walk07.png"), image("p/p1_walk08.png")
];
const jumpFrame = image("p/p1_jump.png");
const hurtFrame = image("p/p1_hurt.png");
let playerFacing = 1;
let playerState = "idle";
let playerFrame = 0;
let playerFrameTick = 0;
let lockedGoalNotice = 0;

function goalIsLocked() {
  return !!(levelKey && !levelKey.collected);
}

updateGoal = () => {
  if (!touches(goal)) return;
  if (goalIsLocked()) {
    if (lockedGoalNotice <= 0) {
      showStatus("find the key first...")
      lockedGoalNotice = 90;
    }
    return;
  }
  finishLevel();
};

function bindHoldButton(id, onDown, onUp) {
  const btn = document.getElementById(id);
  const press = event => {
    event.preventDefault();
    onDown();
  };
  const release = event => {
    event.preventDefault();
    onUp();
  };
  btn.addEventListener("pointerdown", press);
  btn.addEventListener("pointerup", release);
  btn.addEventListener("pointercancel", release);
  btn.addEventListener("pointerleave", release);
}

function updatePlayerAnimation() {
  if (player.invulnerable > 65) playerState = "hurt";
  else if (!player.grounded) playerState = "jump";
  else if (Math.abs(player.dx) > 0.1) playerState = "walk";
  else playerState = "idle";
  if (player.dx < 0) playerFacing = -1;
  if (player.dx > 0) playerFacing = 1;
  if (playerState === "walk") {
    playerFrameTick++;
    if (playerFrameTick >= 6) {
      playerFrame = (playerFrame + 1) % walkFrames.length;
      playerFrameTick = 0;
    }
  } else {
    playerFrame = 0;
    playerFrameTick = 0;
  }
}

drawPlayer = () => {
  updatePlayerAnimation();
  const frame = playerState === "hurt" ? hurtFrame : playerState === "jump" ? jumpFrame : walkFrames[playerFrame];
  ctx.save();
  if (playerFacing < 0) {
    ctx.translate(player.x + player.width, player.y);
    ctx.scale(-1, 1);
    ctx.drawImage(frame, 0, 0, player.width, player.height);
  } else {
    ctx.drawImage(frame, player.x, player.y, player.width, player.height);
  }
  ctx.restore();
};

let jumpBufferFrames = 0;
let coyoteFrames = 0;
let jumpHeld = false;

function queueJump() {
  jumpBufferFrames = 8;
}

function useBufferedJump() {
  if (jumpBufferFrames <= 0) return false;
  if (!player.grounded && coyoteFrames <= 0) return false;
  player.dy = -jumpPower;
  player.jumping = true;
  player.grounded = false;
  coyoteFrames = 0;
  jumpBufferFrames = 0;
  jumpSound.currentTime = 0;
  jumpSound.play();
  return true;
}

movePlayer = () => {
  const jumpDown = !!(keys.ArrowUp || keys[" "]);
  if (jumpDown && !jumpHeld) queueJump();
  jumpHeld = jumpDown;
  if (jumpBufferFrames > 0) jumpBufferFrames--;
  useBufferedJump();
  player.dx = keys.ArrowLeft && !keys.ArrowRight ? -moveSpeed : keys.ArrowRight && !keys.ArrowLeft ? moveSpeed : 0;
};

const updatePlayerWithCoyote = updatePlayer;
updatePlayer = () => {
  const wasGrounded = player.grounded;
  updatePlayerWithCoyote();
  if (player.grounded) coyoteFrames = 7;
  else if (wasGrounded || coyoteFrames > 0) coyoteFrames--;
  if (!jumpHeld && player.dy < -3) player.dy *= 0.82;
};

function enemyMovementType(enemy) {
  if (enemy.type === "fly") return "vertical";
  if (enemy.type === "slime") return "chase";
  if (enemy.type === "snail") return "slow";
  return "swim";
}

function patrolEnemy(enemy, speedScale = 1) {
  enemy.x += enemy.dx * speedScale;
  if (enemy.x < enemy.minX || enemy.x + enemy.width > enemy.maxX) {
    enemy.dx *= -1;
    enemy.x = Math.max(enemy.minX, Math.min(enemy.maxX - enemy.width, enemy.x));
  }
}

function updateEnemyMovement(enemy) {
  const movement = enemyMovementType(enemy);
  if (movement === "vertical") {
    enemy.y += enemy.dy;
    if (enemy.y < enemy.minY || enemy.y + enemy.height > enemy.maxY) enemy.dy *= -1;
    return;
  }
  if (movement === "chase") {
    const distance = player.x - enemy.x;
    if (Math.abs(distance) < 190) enemy.dx = distance < 0 ? -2.1 : 2.1;
    patrolEnemy(enemy, 1);
    return;
  }
  if (movement === "slow") {
    patrolEnemy(enemy, 0.55);
    return;
  }
  enemy.bob = (enemy.bob || 0) + 0.08;
  enemy.y += Math.sin(enemy.bob) * 0.35;
  patrolEnemy(enemy, 1);
}

updateEnemies = () => enemies.forEach(enemy => {
  if (enemy.defeated) return;
  updateEnemyMovement(enemy);
  if (!touches(enemy) || player.invulnerable > 0) return;
  if (player.dy > 1 && player.y + player.height < enemy.y + 18) {
    enemy.defeated = true;
    player.dy = -7;
    score += 15;
    coinSound.currentTime = 0;
    coinSound.play();
  } else {
    loseLife();
  }
});

drawCheckpoint = () => {
  if (!checkpoint) return;
  ctx.save();
  ctx.globalAlpha = checkpoint.active ? 1 : 0.65;
  ctx.drawImage(checkpointImage, checkpoint.x, checkpoint.y, checkpoint.width, checkpoint.height);
  if (checkpoint.active) {
    ctx.fillStyle = "white";
    ctx.font = "12px Arial";
    ctx.fillText("saved", checkpoint.x - 5, checkpoint.y - 6);
  }
  ctx.restore();
};

gameLoop = () => {
  if (!isGameRunning || gamePaused) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  levelFrames++;
  movePlayer();
  updatePlatforms();
  updatePlayer();
  updateEnemies();
  updateCollections();
  updateCheckpoint();
  updateHazard();
  updateGoal();
  drawPlatforms();
  drawEnemies();
  drawCoins();
  drawExtras();
  drawHazards();
  drawCheckpoint();
  drawGoal();
  drawPlayer();
  drawHud();
  frameId = requestAnimationFrame(gameLoop);
};

let hazards = [];
levels[0].hazards = [{ x: 600, y: 350, width: 30, height: 50, type: "cactus" }];
levels[1].hazards = [{ x: 240, y: 390, width: 40, height: 110, type: "water" }, { x: 690, y: 210, width: 30, height: 40, type: "cactus" }];
levels[2].hazards = [{ x: 180, y: 390, width: 50, height: 110, type: "water" }, { x: 650, y: 305, width: 30, height: 50, type: "cactus" }];
levels[3].hazards = [{ x: 190, y: 390, width: 40, height: 110, type: "water" }, { x: 710, y: 210, width: 30, height: 50, type: "cactus" }];
levels[4].hazards = [{ x: 480, y: 390, width: 45, height: 110, type: "water" }, { x: 690, y: 300, width: 30, height: 50, type: "cactus" }];

const loadLevelBeforeHazards = loadLevel;
loadLevel = index => {
  loadLevelBeforeHazards(index);
  hazards = (levels[index].hazards || []).map(item => ({ ...item }));
};

function updateHazard() {
  hazards.forEach(hazard => {
    if (!touches(hazard) || player.invulnerable > 0) return;
    if (hazard.type === "water") {
      loseLife();
      return;
    }
    hurtPlayer(hazard);
  });
}

function drawHazards() {
  hazards.forEach(hazard => {
    if (hazard.type === "cactus") ctx.drawImage(treeImage, hazard.x, hazard.y, hazard.width, hazard.height);
  });
}

function hurtPlayer(enemy) {
  if (player.invulnerable > 0) return;
  lives--;
  player.invulnerable = 90;
  player.dy = -5;
  player.dx = enemy && enemy.x < player.x ? 6 : -6;
  loseSound.currentTime = 0;
  loseSound.play();
  showStatus("Lives left: " + Math.max(0, lives));
  if (lives <= 0) {
    isGameRunning = false;
    saveHighScore();
    document.getElementById("game-over-message").innerText = "Game Over!";
    document.getElementById("mainActionBtn").innerText = "Restart";
    document.getElementById("game-over-screen").classList.remove("hidden");
  }
}

function formatTime(frames) {
  const totalSeconds = frames / 60;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, "0");
  const hundredths = Math.floor((frames % 60) * 100 / 60).toString().padStart(2, "0");
  return minutes + ":" + seconds + "." + hundredths;
}

const drawHudBeforeTimer = drawHud;
drawHud = () => {
  drawHudBeforeTimer();
  ctx.fillStyle = "black";
  ctx.font = "18px Arial";
  ctx.textAlign = "right";
  ctx.fillText(currentLevelName(), canvas.width - 12, 22);
  ctx.fillText("Time " + formatTime(levelFrames), canvas.width - 12, 44);
  ctx.fillText("Par " + levels[currentLevel].par + "s", canvas.width - 12, 66);
  ctx.textAlign = "left";
};

function setPaused(value) {
  if (!isGameRunning && !gamePaused) return;
  gamePaused = value;
  document.getElementById("pause-screen").classList.toggle("hidden", !gamePaused);
  if (!gamePaused && isGameRunning) {
    cancelAnimationFrame(frameId);
    gameLoop();
  }
}

function restartCurrentLevel() {
  document.getElementById("pause-screen").classList.add("hidden");
  gamePaused = false;
  loadLevel(currentLevel);
  isGameRunning = true;
  cancelAnimationFrame(frameId);
  gameLoop();
}

document.addEventListener("keydown", event => {
  if (event.key.toLowerCase() === "p" && isGameRunning) setPaused(!gamePaused);
});

const difficultySettings = {
  easy: { lives: 5, enemySpeed: 0.82 },
  normal: { lives: 3, enemySpeed: 1 },
  hard: { lives: 2, enemySpeed: 1.22 },
};
let difficulty = "normal";
function setDifficulty(value) {
  if (!difficultySettings[value]) return;
  difficulty = value;
  showStatus(value + " mode");
}
function startingLives() {
  return difficultySettings[difficulty].lives;
}
updateEnemyMovement = enemy => {
  const movement = enemyMovementType(enemy);
  const speed = difficultySettings[difficulty].enemySpeed;
  if (movement === "vertical") {
    enemy.y += enemy.dy * speed;
    if (enemy.y < enemy.minY || enemy.y + enemy.height > enemy.maxY) enemy.dy *= -1;
    return;
  }
  if (movement === "chase") {
    const distance = player.x - enemy.x;
    if (Math.abs(distance) < 190) enemy.dx = distance < 0 ? - 2.1 : 2.1;
    patrolEnemy(enemy, speed);
    return;
  }
  if (movement === "slow") {
    patrolEnemy(enemy, 0.55 * speed);
    return;
  }
  enemy.bob = (enemy.bob || 0) + 0.08;
  enemy.y += Math.sin(enemy.bob) * 0.35;
  patrolEnemy(enemy, speed);
};
startGame = () => {
  document.getElementById("start-screen").classList.add("hidden");
  document.getElementById("pause-screen").classList.add("hidden");
  gamePaused = false;
  lives = startingLives();
  loadLevel(currentLevel);
  isGameRunning = true;
  cancelAnimationFrame(frameId);
  gameLoop();
};
let unlockedLevel = Number(localStorage.getItem("platformerUnlockedLevel")) || 0;

function unlockLevel(index) {
  const safeIndex = Math.min(index, levels.length - 1);
  if (safeIndex <= unlockedLevel) return;
  unlockedLevel = safeIndex;
  localStorage.setItem("platformerUnlockedLevel", unlockedLevel);
  renderLevelSelect();
}

function chooseLevel(index) {
  if (index < 0 || index >= levels.length) return;
  if (index > unlockedLevel) return;
  currentLevel = index;
  renderLevelSelect();
}
function renderLevelSelect() {
  const holder = document.getElementById("level-select");
  let html = "";
  levels.forEach((level, index) => {
    const locked = index > unlockedLevel;
    const selected = index === currentLevel ? "*" : "";
    const disabled = locked ? 'disabled ' : '';
    const action = 'onclick="chooseLevel(' + index + ')"';
    const label = selected + (index + 1);
    html += '<button ' + disabled + action + '>' + label + '</button>';
  });
  holder.innerHTML = html;
}

const finishLevelBeforeUnlock = finishLevel;
finishLevel = () => {
  if (currentLevel < levels.length - 1) {
    unlockLevel(currentLevel + 1);
  }
  finishLevelBeforeUnlock();
};
renderLevelSelect();

let bestTimes = {};
try {
  const savedTimes = localStorage.getItem("platformerBestTimes");
  const savedJson = savedTimes || "{}";
  bestTimes = JSON.parse(savedJson);
} catch (error) {
  bestTimes = {};
}

function recordBestTime(levelIndex, frames) {
  const oldTime = bestTimes[levelIndex];
  if (oldTime !== undefined && oldTime <= frames) return;
  bestTimes[levelIndex] = frames;
  localStorage.setItem("platformerBestTimes", JSON.stringify(bestTimes));
}

function bestTimeLabel(index) {
  if (bestTimes[index] === undefined) return "";
  return " " + formatTime(bestTimes[index]);
}

renderLevelSelect = () => {
  const holder = document.getElementById("level-select");
  let html = "";
  levels.forEach((level, index) => {
    const locked = index > unlockedLevel;
    const selected = index === currentLevel ? "*" : "";
    const best = bestTimeLabel(index);
    const disabled = locked ? 'disabled' : '';
    const action = 'onclick="chooseLevel(' + index + ')"';
    const label = selected + (index + 1) + best;
    html += '<button ' + disabled + action + '>' + label + '</button>';
  });
  holder.innerHTML = html;
};

const finishLevelBeforeBestTime = finishLevel;
finishLevel = () => {
  recordBestTime(currentLevel, levelFrames);
  finishLevelBeforeBestTime();
  renderLevelSelect();
}
renderLevelSelect();

drawGoal = () => {
  ctx.save();
  ctx.globalAlpha = goalIsLocked() ? 0.45 : 1;
  ctx.drawImage(flagImage, goal.x, goal.y, goal.width, goal.height);
  ctx.restore();
  if (goalIsLocked()) {
    ctx.fillStyle = "black";
    ctx.font = "15px Arial";
    const goalLabel = currentLevel === levels.length - 1 && boss && !boss.defeated ? "boss" : "key";
    ctx.fillText(goalLabel, goal.x - 1, goal.y - 7);
  }
};

const redMushroomImage = image("collection/mushroomRed.png"), brownMushroomImage = image("collection/mushroomBrown.png");
let powerUps = [], powerUpType = "", powerUpFrames = 0;
function clearPowerUp() { powerUpType = ""; powerUpFrames = 0; }

function applyPowerUp(type) {
  powerUpType = type; powerUpFrames = 600;
  showStatus(type === "red" ? "speed boost" : "jump boost");
}

function currentMoveSpeed() { return moveSpeed + (powerUpType === "red" && powerUpFrames > 0 ? 2 : 0); }

function currentJumpPower() { return jumpPower + (powerUpType === "brown" && powerUpFrames > 0 ? 3 : 0); }

levels[0].powerUps = [{ x: 725, y: 165, width: 28, height: 28, type: "red" }];
levels[1].powerUps = [{ x: 530, y: 260, width: 28, height: 28, type: "brown" }];
levels[2].powerUps = [{ x: 775, y: 270, width: 28, height: 28, type: "red" }];
levels[3].powerUps = [{ x: 470, y: 260, width: 28, height: 28, type: "brown" }];
levels[4].powerUps = [{ x: 845, y: 245, width: 28, height: 28, type: "red" }];

const loadLevelBeforePowerUps = loadLevel;
loadLevel = index => {
  loadLevelBeforePowerUps(index);
  powerUps = (levels[index].powerUps || []).map(item => ({ ...item, collected: false }));
  clearPowerUp();
};

const updateCollectionsBeforePowerUps = updateCollections;
updateCollections = () => {
  updateCollectionsBeforePowerUps();
  powerUps.forEach(item => {
    if (!item.collected && touches(item)) {
      item.collected = true;
      applyPowerUp(item.type);
      coinSound.currentTime = 0;
      coinSound.play();
    }
  });
  if (powerUpFrames > 0) powerUpFrames--; else if (powerUpType) clearPowerUp();
};

const drawExtrasBeforePowerUps = drawExtras;
drawExtras = () => {
  drawExtrasBeforePowerUps();
  powerUps.forEach(item => {
    if (!item.collected) ctx.drawImage(item.type === "red" ? redMushroomImage : brownMushroomImage, item.x, item.y, item.width, item.height);
  });
};

movePlayer = () => {
  const jumpDown = !!(keys.ArrowUp || keys[" "]);
  if (jumpDown && !jumpHeld) queueJump();
  jumpHeld = jumpDown;
  if (jumpBufferFrames > 0) jumpBufferFrames--;
  if (jumpBufferFrames > 0 && (player.grounded || coyoteFrames > 0)) {
    player.dy = -currentJumpPower();
    player.jumping = true;
    player.grounded = false;
    coyoteFrames = 0;
    jumpBufferFrames = 0;
    jumpSound.currentTime = 0;
    jumpSound.play();
  }
  const speed = currentMoveSpeed();
  player.dx = keys.ArrowLeft && !keys.ArrowRight ? -speed : keys.ArrowRight && !keys.ArrowLeft ? speed : 0;
};

function carryPlayerWithPlatform(platform) {
  const moveX = platform.x - platform.lastX;
  const moveY = platform.y - platform.lastY;
  player.x += moveX;
  player.y += moveY;
}

updatePlatforms = () => platforms.forEach(platform => {
  platform.lastX = platform.x;
  platform.lastY = platform.y;
  if (platform.dx !== undefined) {
    platform.x += platform.dx;
    if (platform.x < platform.minX || platform.x > platform.maxX) {
      platform.dx *= -1;
      platform.x = Math.max(platform.minX, Math.min(platform.maxX, platform.x));
    }
  }
  if (platform.dy !== undefined) {
    platform.y += platform.dy;
    if (platform.y < platform.minY || platform.y > platform.maxY) {
      platform.dy *= -1;
      platform.y = Math.max(platform.minY, Math.min(platform.maxY, platform.y));
    }
  }
  if (player.standingPlatform === platform) carryPlayerWithPlatform(platform);
});

const updatePlayerBeforePlatformFix = updatePlayer;
updatePlayer = () => {
  player.standingPlatform = null;
  updatePlayerBeforePlatformFix();
};

function resetInput() {
  keys.ArrowLeft = false;
  keys.ArrowRight = false;
  keys.ArrowUp = false;
  keys[" "] = false;
  jumpHeld = false;
  jumpBufferFrames = 0;
}

window.addEventListener("blur", resetInput);
function releaseControlsIfNeeded(event) {
  const target = event.target;
  if (!target || !target.closest) {
    resetInput();
    return;
  }
  if (!target.closest(".mobile-controls")) {
    resetInput();
  }
}
function resetInputWhenHidden() {
  if (document.hidden) {
    resetInput();
  }
}

const bossImage = image("enemies/blockerMad.png");
const bossHurtImage = image("enemies/blockerSad.png");
let boss = null;
function createBoss() {
  boss = { x: 790, y: 232, width: 56, height: 56, dx: -1.6, minX: 620, maxX: 955, hp: 4, maxHP: 4, hurtFrames: 0, defeated: false };
}

function damageBoss() {
  if (!boss || boss.defeated || boss.hurtFrames > 0) return;
  boss.hp--;
  boss.hurtFrames = 35;
  player.dy = -8;
  spawnParticles(boss.x + boss.width / 2, boss.y + boss.height / 2, "enemy", 12);
  if (boss.hp <= 0) {
    boss.defeated = true;
    score += 100;
    showStatus("boss defeated");
  }
}

function updateBoss() {
  if (!boss || boss.defeated) return;
  if (boss.hurtFrames > 0) boss.hurtFrames--;
  const distance = player.x - boss.x;
  if (Math.abs(distance) < 230) boss.dx = distance < 0 ? -2.1 : 2.1;
  boss.x += boss.dx * difficultySettings[difficulty].enemySpeed;
  if (boss.x < boss.minX || boss.x + boss.width > boss.maxX) {
    boss.dx *= -1;
    boss.x = Math.max(boss.minX, Math.min(boss.maxX - boss.width, boss.x));
  }
  if (!touches(boss) || player.invulnerable > 0 || boss.hurtFrames > 0) return;
  const playerBottom = player.y + player.height;
  if (player.dy > 1 && playerBottom < boss.y + boss.height * 0.7) damageBoss();
  else hurtPlayer(boss);
}

function drawBoss() {
  if (!boss || boss.defeated) return
  const picture = boss.hurtFrames > 0 ? bossHurtImage : bossImage;
  ctx.drawImage(picture, boss.x, boss.y, boss.width, boss.height);
  ctx.fillStyle = "black";
  ctx.fillRect(canvas.width / 2 - 80, 12, 160, 8);
  ctx.fillStyle = "white";
  ctx.fillRect(canvas.width / 2 - 78, 14, 156 * boss.hp / boss.maxHP, 4);
}

const loadLevelBeforeBoss = loadLevel;
loadLevel = index => {
  loadLevelBeforeBoss(index);
  if (index === levels.length - 1) createBoss();
  else boss = null;
};

const updateEnemiesBeforeBoss = updateEnemies;
updateEnemies = () => {
  updateEnemiesBeforeBoss();
  updateBoss();
};

const drawEnemiesBeforeBoss = drawEnemies;
drawEnemies = () => {
  drawEnemiesBeforeBoss();
  drawBoss();
}

const goalIsLockedBeforeBoss = goalIsLocked;
goalIsLocked = () => goalIsLockedBeforeBoss() || !!(currentLevel === levels.length - 1 && boss && !boss.defeated);

document.addEventListener("visibilitychange", resetInputWhenHidden);
document.addEventListener("pointerup", releaseControlsIfNeeded);
document.addEventListener("pointercancel", resetInput);
window.addEventListener("pagehide", resetInput);