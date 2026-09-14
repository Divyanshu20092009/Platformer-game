const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const gravity = 0.5;
const moveSpeed = 5;
const jumpPower = 10;
const image = src => { const img = new Image(); img.src = src; return img; };
const playerImage = image("p1_walk01.png");
const platformImage = image("item/grassHalfMid.png");
const player = { x:100, y:300, width:40, height:60, dx:0, dy:0, jumping:false, grounded:false, spawnX:100, spawnY:300, animationTick:0, invulnerable:0, standingPlatform:null };
let platforms = [{ x:0, y:400, width:1000, height:20 }];
let enemies = [];
let obstacle = { x:600, y:360, width:30, height:40 };
let coins = [];
let gems = [];
let levelKey = null;
let checkpoint = null;
let goal = { x:950, y:118, width:30, height:60 };
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
let updatePlatforms = () => {};
let updateEnemies = () => {};
let updateCollections = () => {};
let updateCheckpoint = () => {};
let updateGoal = () => {};
let drawEnemies = () => {};
let drawObstacle = () => {};
let drawCoins = () => {};
let drawExtras = () => {};
let drawCheckpoint = () => {};
let drawGoal = () => {};
let drawHud = () => {};
function resetPlayer() { player.x=player.spawnX; player.y=player.spawnY; player.dx=0; player.dy=0; player.jumping=false; player.grounded=false; player.standingPlatform=null; }
function drawPlatforms() { platforms.forEach(p => { for (let x=0; x<p.width; x+=50) ctx.drawImage(platformImage,p.x+x,p.y,50,20); }); }
function drawPlayer() { ctx.drawImage(playerImage,player.x,player.y,player.width,player.height); }
function movePlayer() { if ((keys.ArrowUp || keys[" "]) && player.grounded) { player.dy=-jumpPower; player.jumping=true; player.grounded=false; } player.dx=keys.ArrowLeft&&!keys.ArrowRight?-moveSpeed:keys.ArrowRight&&!keys.ArrowLeft?moveSpeed:0; }
function updatePlayer() {
  const oldBottom=player.y+player.height; player.x=Math.max(0,Math.min(canvas.width-player.width,player.x+player.dx)); player.y+=player.dy; player.dy+=gravity; player.grounded=false;
  platforms.forEach(p => { const bottom=player.y+player.height, inside=player.x<p.x+p.width&&player.x+player.width>p.x; if (inside&&oldBottom<=p.y&&bottom>=p.y&&player.dy>=0) { player.y=p.y-player.height; player.dy=0; player.jumping=false; player.grounded=true; player.standingPlatform=p; } });
  if (player.y>canvas.height+80) handleFall();
}
function gameLoop() { if (!isGameRunning||gamePaused) return; ctx.clearRect(0,0,canvas.width,canvas.height); levelFrames++; movePlayer(); updatePlatforms(); updatePlayer(); updateEnemies(); updateCollections(); updateCheckpoint(); updateGoal(); drawPlatforms(); drawEnemies(); drawObstacle(); drawCoins(); drawExtras(); drawCheckpoint(); drawGoal(); drawPlayer(); drawHud(); frameId=requestAnimationFrame(gameLoop); }
function startGame() { document.getElementById("start-screen").classList.add("hidden"); setupWorld(); isGameRunning=true; cancelAnimationFrame(frameId); gameLoop(); }
function restartGame() { score=0; lives=3; currentLevel=0; setupWorld(); document.getElementById("game-over-screen").classList.add("hidden"); isGameRunning=true; cancelAnimationFrame(frameId); gameLoop(); }
function mainAction() { restartGame(); }
function exitGame() { window.close(); }
document.addEventListener("keydown",e => { if (["ArrowLeft","ArrowRight","ArrowUp"," "].includes(e.key)) e.preventDefault(); keys[e.key]=true; });
document.addEventListener("keyup",e => { keys[e.key]=false; });
const coinSound = document.getElementById("coinSound");
const jumpSound = document.getElementById("jumpSound");
const winSound = document.getElementById("winSound");
const loseSound = document.getElementById("loseSound");
const coinImage = image("coinGold.png");
const treeImage = image("item/cactus.png");
const flagImage = image("item/flagYellow.png");
let highScore = Number(localStorage.getItem("platformerHighScore")) || 0;
let statusText = "";
let statusFrames = 0;
function touches(item) { return player.x<item.x+item.width&&player.x+player.width>item.x&&player.y<item.y+item.height&&player.y+player.height>item.y; }
function showStatus(text) { statusText=text; statusFrames=90; }
function saveHighScore() { if (score>highScore) { highScore=score; localStorage.setItem("platformerHighScore",highScore); } }
function collectedCoinCount() { return coins.filter(c=>c.collected).length; }
coins = [
  { x:100, y:360, width:20, height:20, collected:false },
  { x:200, y:360, width:20, height:20, collected:false },
  { x:500, y:220, width:20, height:20, collected:false }
];
drawObstacle = () => ctx.drawImage(treeImage,obstacle.x,obstacle.y,obstacle.width,obstacle.height);
drawCoins = () => coins.forEach(c => { if (!c.collected) ctx.drawImage(coinImage,c.x,c.y,c.width,c.height); });
drawGoal = () => ctx.drawImage(flagImage,goal.x,goal.y,goal.width,goal.height);
updateCollections = () => coins.forEach(c => {
  if (!c.collected&&touches(c)) { c.collected=true; score+=10; coinSound.currentTime=0; coinSound.play(); }
});
updateGoal = () => {
  if (!touches(goal)) return;
  isGameRunning=false; score+=25; saveHighScore(); winSound.currentTime=0; winSound.play();
  document.getElementById("game-over-message").innerText="You Win!";
  document.getElementById("mainActionBtn").innerText="Restart";
  document.getElementById("game-over-screen").classList.remove("hidden");
};
drawHud = () => {
  ctx.fillStyle="black"; ctx.font="20px Arial";
  ctx.fillText("Score: "+score,10,20);
  ctx.fillText("High Score: "+highScore,10,40);
  ctx.fillText("Coins: "+collectedCoinCount()+"/"+coins.length,10,60);
  if (statusFrames>0) { ctx.font="18px Arial"; ctx.textAlign="center"; ctx.fillText(statusText,canvas.width/2,35); ctx.textAlign="left"; statusFrames--; }
};
const oldMovePlayer = movePlayer;
movePlayer = function() {
  const wasGrounded=player.grounded; oldMovePlayer();
  if ((keys.ArrowUp||keys[" "])&&wasGrounded&&player.dy<0) { jumpSound.currentTime=0; jumpSound.play(); }
};
function loseLife() { lives--; loseSound.currentTime=0; loseSound.play(); if (lives<=0) { isGameRunning=false; document.getElementById("game-over-message").innerText="Game Over!"; document.getElementById("mainActionBtn").innerText="Restart"; document.getElementById("game-over-screen").classList.remove("hidden"); saveHighScore(); return; } resetPlayer(); player.invulnerable=90; showStatus("Lives left: "+lives); }
const P = (x,y,width,height=20,extra={}) => ({ x,y,width,height,...extra });
const C = (x,y) => ({ x,y,width:20,height:20 });
const G = (x,y,color) => ({ x,y,width:22,height:22,color });
const E = (x,y,dx,minX,maxX,type="fish") => ({ x,y,width:30,height:30,dx,minX,maxX,type });
levels.push({
  name:"First Steps", par:35, start:{x:100,y:300},
  platforms:[P(0,400,1000),P(300,300,100),P(500,250,100),P(700,200,100),P(850,150,100)],
  enemies:[E(300,370,2,250,400)], obstacle:P(600,360,30,40),
  checkpoint:{x:520,y:210,width:24,height:40,spawnX:500,spawnY:170},
  coins:[C(200,360),C(500,220),C(650,100),C(300,240),C(800,120),C(100,360),C(400,270),C(600,180)],
  gems:[G(545,205,"blue"),G(875,105,"green")], key:null,
  goal:P(950,118,30,60)
});
levels.push({
  name:"Long Way Up", par:45, start:{x:60,y:320},
  platforms:[P(0,400,240),P(280,350,140),P(470,300,120),P(650,250,110),P(810,205,160),P(620,130,120),P(420,100,130)],
  enemies:[E(305,320,1.8,280,420),E(825,175,1.4,810,970,"slime")],
  obstacle:P(690,210,30,40), checkpoint:{x:650,y:90,width:24,height:40,spawnX:640,spawnY:50},
  coins:[C(120,350),C(330,310),C(500,260),C(680,210),C(850,165),C(915,165),C(660,90),C(460,60)],
  gems:[G(700,90,"red"),G(430,60,"yellow")], key:null, goal:P(500,40,30,60)
});
function copyItems(items,flag) { return items.map(item => ({...item,[flag]:false})); }
function loadLevel(index) {
  const level=levels[index]; currentLevel=index; levelFrames=0;
  platforms=level.platforms.map(p=>({...p}));
  enemies=copyItems(level.enemies,"defeated");
  obstacle={...level.obstacle};
  checkpoint=level.checkpoint?{...level.checkpoint,active:false}:null;
  coins=copyItems(level.coins,"collected");
  gems=copyItems(level.gems||[],"collected");
  levelKey=level.key?{...level.key,collected:false}:null;
  goal={...level.goal};
  player.spawnX=level.start.x; player.spawnY=level.start.y; resetPlayer();
}
function currentLevelName() { return levels[currentLevel]?levels[currentLevel].name:""; }
setupWorld = () => loadLevel(currentLevel);
startGame = function() {
  document.getElementById("start-screen").classList.add("hidden");
  document.getElementById("pause-screen").classList.add("hidden");
  gamePaused=false; lives=3; loadLevel(currentLevel); isGameRunning=true;
  cancelAnimationFrame(frameId); gameLoop();
};
restartGame = function() { score=0; lives=3; gamePaused=false; document.getElementById("pause-screen").classList.add("hidden"); loadLevel(0); document.getElementById("game-over-screen").classList.add("hidden"); isGameRunning=true; cancelAnimationFrame(frameId); gameLoop(); };
