const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const hpEl = document.querySelector("#hp");
const epEl = document.querySelector("#ep");
const relicsEl = document.querySelector("#relics");
const levelEl = document.querySelector("#level");
const xpEl = document.querySelector("#xp");
const potionsEl = document.querySelector("#potions");
const modeEl = document.querySelector("#mode");
const areaEl = document.querySelector("#area");
const messageEl = document.querySelector("#message");
const actionButton = document.querySelector("#actionButton");
const spellButton = document.querySelector("#spellButton");
const potionButton = document.querySelector("#potionButton");
const saveButton = document.querySelector("#saveButton");
const loadButton = document.querySelector("#loadButton");
const resetButton = document.querySelector("#resetButton");

const tile = 32;
const maps = {
  temple: [
    "WWWWWWWWWWWWWWWWWWWWWWWW",
    "W....G.....C.....T.....W",
    "W.WWWW..WWWW..WWW...R..W",
    "W.W..W..W..W..W.W..WW..W",
    "W.W..W.RW.SW..W.W.C.W..W",
    "W....W.....W....W.B.W..W",
    "W.WWWW..WW.WWWW.WWW.W..W",
    "W.....N..W....W........W",
    "W..B.WW..W.R..W..WWWW..W",
    "W....WW..WWW.WW.....W..W",
    "W.W...C..M..R....B..W..W",
    "W.W.WWWW.WWWWWW.RWWWW..W",
    "W...W.........T.......PW",
    "WWWWWWWWWWWWWWWWWWWWWWWW",
  ],
  sanctum: [
    "WWWWWWWWWWWWWWWWWWWWWWWW",
    "WP....W....R....W.....EW",
    "W.WW..W.WWWWWW..W.WWW..W",
    "W..W..W.C..T.W....W....W",
    "W..W.WWWW.WW.WWWW.W.B..W",
    "W....R....W..C..W.W....W",
    "W.WWWWWW..W.B.W.W.WWW..W",
    "W....M....W...W.W......W",
    "W.W.WWWWWWW.W.W.WWWWW..W",
    "W.W.....N...W...R......W",
    "W.WWW.WWWWWWWWWWW.WWW..W",
    "W.....W.......T.C..B...W",
    "W.R...W..............G.W",
    "WWWWWWWWWWWWWWWWWWWWWWWW",
  ],
};

const colors = { ".": "#3e7a46", W: "#263247", G: "#386a3f", S: "#b99352", R: "#cfb56a", B: "#57433a", M: "#2e716c", T: "#2e8a55", N: "#6b4f9f", C: "#8a5b2d", P: "#335d7a", E: "#d8b957" };
const passable = new Set([".", "G", "S", "R", "M", "T", "N", "C", "P", "E"]);
const requiredRelics = 8;
const player = { x: 2, y: 2, hp: 34, maxHp: 34, ep: 16, maxEp: 16, relics: 0, level: 1, xp: 0, nextXp: 12, potions: 2, facing: "down" };
let mode = "field";
let currentArea = "temple";
let battle = null;
let message = "太陽神殿と地下聖域に散った8つの遺物を集めよう。";
let solvedRocks = new Set();
let openedRelics = new Set();
let openedChests = new Set();
let animationTime = 0;

const enemies = [
  { name: "砂牙ウルフ", hp: 24, maxHp: 24, attack: 5, xp: 5, color: "#c98b4f" },
  { name: "蔦のゴーレム", hp: 30, maxHp: 30, attack: 4, xp: 6, color: "#55a65a" },
  { name: "遺跡の影", hp: 36, maxHp: 36, attack: 6, xp: 8, color: "#725aa8" },
];

const tileLabels = {
  S: "古い石碑: 『光は道を開き、心は太陽を宿す』",
  M: "泉の精霊がHPとEPを満たしてくれた。",
  T: "旅人の記録: 『ひび割れた岩にはルーメンを放て』",
  N: "賢者: 『地下聖域にも遺物が眠る。戦いで鍛え、8つの光を門へ掲げなさい』",
  C: "古い宝箱だ。中を調べられそうだ。",
  P: "転移陣が青く揺れている。別の階層へ進めそうだ。",
  E: "太陽門が輝いている。遺物が8つあれば守護者に挑めそうだ。",
};

function currentMap() {
  return maps[currentArea];
}

function scopedKey(x, y) {
  return `${currentArea}:${x},${y}`;
}

function setMessage(text) {
  message = text;
  messageEl.textContent = text;
}

function draw() {
  animationTime += 1;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (mode === "battle") drawBattle();
  else drawField();
  updateHud();
  requestAnimationFrame(draw);
}

function drawField() {
  currentMap().forEach((row, y) => {
    [...row].forEach((cell, x) => {
      ctx.fillStyle = colors[cell] || colors["."];
      ctx.fillRect(x * tile, y * tile, tile, tile);
      ctx.strokeStyle = "rgba(0,0,0,0.13)";
      ctx.strokeRect(x * tile, y * tile, tile, tile);
      if (cell === "R" && !openedRelics.has(scopedKey(x, y))) drawRelic(x, y);
      if (cell === "B" && !solvedRocks.has(scopedKey(x, y))) drawRock(x, y);
      if (cell === "S") drawRune(x, y);
      if (cell === "M") drawSpring(x, y);
      if (cell === "N") drawSage(x, y);
      if (cell === "C" && !openedChests.has(scopedKey(x, y))) drawChest(x, y);
      if (cell === "P") drawPortal(x, y);
      if (cell === "E") drawGate(x, y);
    });
  });
  drawHero(player.x * tile + 16, player.y * tile + 18);
  drawDialogBox(message);
}

function drawHero(x, y) {
  ctx.fillStyle = "#f4d06f";
  ctx.beginPath();
  ctx.arc(x, y - 8, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#2d5ea8";
  ctx.fillRect(x - 9, y, 18, 18);
  ctx.fillStyle = "#fff2c4";
  ctx.fillRect(x - 14, y + 4, 6, 13);
  ctx.fillRect(x + 8, y + 4, 6, 13);
}

function drawRelic(x, y) {
  const pulse = Math.sin(animationTime / 18) * 3;
  ctx.fillStyle = "#fff1a8";
  ctx.beginPath();
  ctx.arc(x * tile + 16, y * tile + 16, 8 + pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#b87525";
  ctx.fillRect(x * tile + 12, y * tile + 10, 8, 14);
}

function drawRock(x, y) {
  ctx.fillStyle = "#5d514b";
  ctx.beginPath();
  ctx.moveTo(x * tile + 7, y * tile + 26);
  ctx.lineTo(x * tile + 14, y * tile + 7);
  ctx.lineTo(x * tile + 26, y * tile + 25);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#ffdf77";
  ctx.beginPath();
  ctx.moveTo(x * tile + 16, y * tile + 8);
  ctx.lineTo(x * tile + 13, y * tile + 18);
  ctx.lineTo(x * tile + 19, y * tile + 17);
  ctx.stroke();
}

function drawRune(x, y) {
  ctx.fillStyle = "#f8c35a";
  ctx.fillRect(x * tile + 8, y * tile + 7, 16, 20);
  ctx.fillStyle = "#6f4518";
  ctx.fillRect(x * tile + 13, y * tile + 12, 6, 10);
}

function drawSpring(x, y) {
  ctx.fillStyle = "#9af7ee";
  ctx.beginPath();
  ctx.arc(x * tile + 16, y * tile + 17, 11, 0, Math.PI * 2);
  ctx.fill();
}

function drawChest(x, y) {
  ctx.fillStyle = "#c78338";
  ctx.fillRect(x * tile + 7, y * tile + 14, 18, 13);
  ctx.fillStyle = "#ffd36e";
  ctx.fillRect(x * tile + 14, y * tile + 17, 4, 5);
  ctx.strokeStyle = "#5b351c";
  ctx.strokeRect(x * tile + 7, y * tile + 14, 18, 13);
}

function drawPortal(x, y) {
  const pulse = Math.sin(animationTime / 14) * 4;
  ctx.strokeStyle = "#9af7ff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x * tile + 16, y * tile + 18, 10 + pulse, 6, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;
}

function drawSage(x, y) {
  ctx.fillStyle = "#c7b8ff";
  ctx.beginPath();
  ctx.arc(x * tile + 16, y * tile + 11, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#5d45a0";
  ctx.fillRect(x * tile + 8, y * tile + 18, 16, 10);
}

function drawGate(x, y) {
  ctx.fillStyle = "#fff1a8";
  ctx.fillRect(x * tile + 6, y * tile + 4, 20, 24);
  ctx.fillStyle = "#c07125";
  ctx.fillRect(x * tile + 10, y * tile + 10, 12, 18);
}

function drawDialogBox(text) {
  ctx.fillStyle = "rgba(31, 23, 17, 0.84)";
  ctx.fillRect(12, canvas.height - 72, canvas.width - 24, 58);
  ctx.strokeStyle = "#f8c35a";
  ctx.strokeRect(12, canvas.height - 72, canvas.width - 24, 58);
  ctx.fillStyle = "#fff8e7";
  ctx.font = "18px sans-serif";
  ctx.fillText(text, 28, canvas.height - 36);
}

function drawBattle() {
  const enemy = battle.enemy;
  ctx.fillStyle = "#171123";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#35234e";
  ctx.fillRect(0, 310, canvas.width, 202);
  drawHero(170, 350);
  ctx.fillStyle = enemy.color;
  ctx.beginPath();
  ctx.arc(540, 230, 54, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff8e7";
  ctx.font = "24px sans-serif";
  ctx.fillText(enemy.name, 455, 150);
  drawBar(455, 168, 170, 14, enemy.hp / enemy.maxHp, "#ff7b6e");
  drawBar(94, 386, 160, 14, player.hp / player.maxHp, "#74d7d2");
  drawDialogBox(`${battle.log}   1:攻撃  2:ルーメン(EP4)  3:癒し(EP5)`);
}

function drawBar(x, y, w, h, ratio, color) {
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, Math.max(0, w * ratio), h);
}

function tryMove(dx, dy, facing) {
  if (mode !== "field") return;
  player.facing = facing;
  const nx = player.x + dx;
  const ny = player.y + dy;
  const cell = currentMap()[ny]?.[nx];
  if (!cell) return;
  if (cell === "B" && !solvedRocks.has(scopedKey(nx, ny))) {
    setMessage("ひび割れた岩が道をふさいでいる。精霊術を使えそうだ。");
    return;
  }
  if (passable.has(cell) || solvedRocks.has(scopedKey(nx, ny))) {
    player.x = nx;
    player.y = ny;
    if (["G", "."].includes(cell) && Math.random() < 0.08) startBattle();
    if (cell === "M") restoreAtSpring();
    if (cell === "P") changeArea();
  }
}

function getFrontTile() {
  const offset = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[player.facing];
  const x = player.x + offset[0];
  const y = player.y + offset[1];
  return { x, y, cell: currentMap()[y]?.[x] };
}

function action() {
  if (mode === "battle") return playerAttack("strike");
  const here = { x: player.x, y: player.y, cell: currentMap()[player.y][player.x] };
  const front = getFrontTile();
  const target = [front, here].find((spot) => spot.cell && spot.cell !== "." && spot.cell !== "G");
  if (!target) return setMessage("風が草原を渡っていく……。怪しいものは近くにない。");
  const key = scopedKey(target.x, target.y);
  if (target.cell === "R") return collectRelic(key);
  if (target.cell === "C") return openChest(key);
  if (target.cell === "P") return changeArea();
  if (target.cell === "E") return openGate();
  if (target.cell === "M") return restoreAtSpring();
  setMessage(tileLabels[target.cell] || "古代の気配がする。精霊術が反応している。");
}

function castFieldSpell() {
  if (mode === "battle") return playerAttack("spell");
  const front = getFrontTile();
  const key = scopedKey(front.x, front.y);
  if (front.cell !== "B" || solvedRocks.has(key)) return setMessage("ルーメンの光が周囲を照らした。ここでは何も起きない。");
  if (player.ep < 3) return setMessage("EPが足りない。泉を探して回復しよう。");
  player.ep -= 3;
  solvedRocks.add(key);
  setMessage("ルーメン！ ひび割れた岩が光にほどけ、道が開いた。");
}

function collectRelic(key) {
  if (openedRelics.has(key)) return setMessage("台座はもう空っぽだ。遺物の温かさだけが残っている。");
  openedRelics.add(key);
  player.relics += 1;
  player.ep = Math.min(player.maxEp, player.ep + 4);
  setMessage(`太陽遺物を手に入れた！ (${player.relics}/${requiredRelics}) EPが少し回復した。`);
}

function openChest(key) {
  if (openedChests.has(key)) return setMessage("宝箱は空っぽだ。");
  openedChests.add(key);
  player.potions += 1;
  player.ep = Math.min(player.maxEp, player.ep + 2);
  setMessage("宝箱からポーションを見つけた！ EPも少し整った。");
}

function usePotion() {
  if (player.potions <= 0) return setMessage("ポーションを持っていない。");
  if (player.hp >= player.maxHp) return setMessage("HPはすでに満タンだ。");
  player.potions -= 1;
  player.hp = Math.min(player.maxHp, player.hp + 24);
  const text = "ポーションでHPを24回復した。";
  if (mode === "battle" && battle) {
    battle.log = text;
    enemyTurn();
  } else setMessage(text);
}

function changeArea() {
  if (currentArea === "temple") {
    currentArea = "sanctum";
    player.x = 1;
    player.y = 1;
    setMessage("転移陣を抜け、地下聖域へ降りた。敵は少し強そうだ。");
  } else {
    currentArea = "temple";
    player.x = 22;
    player.y = 12;
    setMessage("転移陣で太陽神殿へ戻った。");
  }
}

function openGate() {
  if (player.relics >= requiredRelics) {
    startBossBattle();
  } else setMessage(`太陽門はまだ眠っている。${requiredRelics}つの太陽遺物が必要だ。`);
}

function restoreAtSpring() {
  player.hp = player.maxHp;
  player.ep = player.maxEp;
  setMessage(tileLabels.M);
}

function startBattle() {
  mode = "battle";
  const template = enemies[Math.floor(Math.random() * enemies.length)];
  battle = { enemy: { ...template }, boss: false, log: `${template.name}が現れた！` };
}

function startBossBattle() {
  if (mode === "clear") return;
  mode = "battle";
  battle = { enemy: { name: "太陽門の守護者", hp: 118, maxHp: 118, attack: 10, xp: 32, color: "#f8c35a" }, boss: true, log: "太陽門の守護者が目覚めた！" };
}

function playerAttack(kind) {
  if (!battle) return;
  if (kind === "spell") {
    if (player.ep < 4) return (battle.log = "EPが足りない！");
    player.ep -= 4;
    battle.enemy.hp -= 13 + player.level * 2;
    battle.log = "ルーメンが敵を焼いた！";
  } else if (kind === "heal") {
    if (player.ep < 5) return (battle.log = "EPが足りない！");
    player.ep -= 5;
    player.hp = Math.min(player.maxHp, player.hp + 16);
    battle.log = "癒しの精霊がHPを回復した。";
  } else {
    battle.enemy.hp -= 8 + player.level * 2 + Math.floor(Math.random() * 5);
    battle.log = "剣で斬りつけた！";
  }
  if (battle.enemy.hp <= 0) return winBattle();
  enemyTurn();
}

function enemyTurn() {
  const damage = battle.enemy.attack + Math.floor(Math.random() * 4);
  player.hp -= damage;
  battle.log += ` ${battle.enemy.name}の反撃、${damage}ダメージ！`;
  if (player.hp <= 0) {
    player.hp = 1;
    player.x = 2;
    player.y = 2;
    mode = "field";
    battle = null;
    setMessage("倒れかけたが、夜明けの加護で入口へ戻された。泉を目指そう。");
  }
}

function winBattle() {
  const defeatedBoss = battle.boss;
  const gainedXp = battle.enemy.xp;
  player.ep = Math.min(player.maxEp, player.ep + 2);
  gainXp(gainedXp);
  mode = defeatedBoss ? "clear" : "field";
  battle = null;
  if (defeatedBoss) setMessage("守護者を倒した！ 太陽門が開き、世界に夜明けが戻った。クリア！");
  else setMessage(`魔物を退けた！ ${gainedXp}XP獲得、EPが2回復した。探索を続けよう。`);
}

function gainXp(amount) {
  player.xp += amount;
  while (player.xp >= player.nextXp) {
    player.xp -= player.nextXp;
    player.level += 1;
    player.nextXp += 8;
    player.maxHp += 6;
    player.maxEp += 3;
    player.hp = player.maxHp;
    player.ep = player.maxEp;
  }
}

function updateHud() {
  hpEl.textContent = `${player.hp} / ${player.maxHp}`;
  epEl.textContent = `${player.ep} / ${player.maxEp}`;
  relicsEl.textContent = `${player.relics} / ${requiredRelics}`;
  levelEl.textContent = player.level;
  xpEl.textContent = `${player.xp} / ${player.nextXp}`;
  potionsEl.textContent = player.potions;
  modeEl.textContent = mode === "battle" ? "Battle" : mode === "clear" ? "Clear" : "Field";
  areaEl.textContent = currentArea === "temple" ? "神殿" : "地下";
}

function resetGame() {
  Object.assign(player, { x: 2, y: 2, hp: 34, maxHp: 34, ep: 16, maxEp: 16, relics: 0, level: 1, xp: 0, nextXp: 12, potions: 2, facing: "down" });
  solvedRocks = new Set();
  openedRelics = new Set();
  openedChests = new Set();
  mode = "field";
  currentArea = "temple";
  battle = null;
  setMessage("太陽神殿と地下聖域に散った8つの遺物を集めよう。");
}

function saveGame() {
  const data = { player, mode, currentArea, solvedRocks: [...solvedRocks], openedRelics: [...openedRelics], openedChests: [...openedChests] };
  localStorage.setItem("solarRelicSave", JSON.stringify(data));
  setMessage("冒険をセーブした。");
}

function loadGame() {
  const raw = localStorage.getItem("solarRelicSave");
  if (!raw) return setMessage("セーブデータがない。");
  const data = JSON.parse(raw);
  Object.assign(player, data.player);
  mode = data.mode === "battle" ? "field" : data.mode;
  currentArea = data.currentArea || "temple";
  solvedRocks = new Set(data.solvedRocks || []);
  openedRelics = new Set(data.openedRelics || []);
  openedChests = new Set(data.openedChests || []);
  battle = null;
  setMessage("セーブデータをロードした。");
}

document.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  const handled = ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", " ", "enter", "e", "1", "2", "3", "4"].includes(key);
  if (handled) event.preventDefault();
  if (key === "arrowup" || key === "w") tryMove(0, -1, "up");
  if (key === "arrowdown" || key === "s") tryMove(0, 1, "down");
  if (key === "arrowleft" || key === "a") tryMove(-1, 0, "left");
  if (key === "arrowright" || key === "d") tryMove(1, 0, "right");
  if (key === " " || key === "enter" || key === "1") action();
  if (key === "e" || key === "2") castFieldSpell();
  if (key === "3" && mode === "battle") playerAttack("heal");
  if (key === "4") usePotion();
});

actionButton.addEventListener("click", action);
spellButton.addEventListener("click", castFieldSpell);
potionButton.addEventListener("click", usePotion);
saveButton.addEventListener("click", saveGame);
loadButton.addEventListener("click", loadGame);
resetButton.addEventListener("click", resetGame);

setMessage(message);
draw();
