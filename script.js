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
