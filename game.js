(() => {
  "use strict";

  const canvas = document.querySelector("#game");
  const ctx = canvas.getContext("2d");
  const scoreForm = document.querySelector("#score-form");
  const nickname = document.querySelector("#nickname");
  const W = canvas.width;
  const H = canvas.height;
  const FLOOR = 432;
  const LEVEL_LENGTH = 2350;
  const image = (path) => {
    const img = new Image();
    img.src = path;
    return img;
  };
  const art = {
    title: image("assets/game/title_bg_church.png"),
    player: Array.from({ length: 6 }, (_, i) => image(`assets/sprites/wikary_kamil_run_${i + 1}.png`)),
    idle: [image("assets/sprites/wikary_kamil_idle_1.png"), image("assets/sprites/wikary_kamil_idle_2.png")],
    jump: [image("assets/sprites/wikary_kamil_jump_1.png"), image("assets/sprites/wikary_kamil_jump_2.png"), image("assets/sprites/wikary_kamil_jump_3.png")],
    flip: Array.from({ length: 6 }, (_, i) => image(`assets/sprites/wikary_kamil_flip_${i + 1}.png`)),
    candles: Array.from({ length: 8 }, (_, i) => image(`assets/sprites/candle_${i + 1}.png`)),
    portrait: image("assets/portraits/wikary_kamil_closeup_open.png"),
    closed: image("assets/portraits/wikary_kamil_closeup_closed.png"),
    cross: [1, 2, 3, 4].map((n) => image(`assets/sprites/fx_cross_${n}.png`)),
    fire: [1, 2, 3, 4].map((n) => image(`assets/sprites/fx_fireball_${n}.png`)),
    bless: [1, 2, 3, 4, 5, 6].map((n) => image(`assets/sprites/fx_bless_${n}.png`)),
  };
  const stages = [
    { title: "DROGA NA PLEBANIĘ", sky: "#37294e", ground: "#384446", rain: false },
    { title: "WIZYTA U DWÓCH GROSZY", sky: "#171d36", ground: "#30383b", rain: true },
    { title: "NOC DUCHÓW", sky: "#10152d", ground: "#252d36", rain: false },
  ];
  const storageKey = "wikary_leaderboard";
  const keyState = new Set();
  let state = "title";
  let stage = 0;
  let camera = 0;
  let score = 0;
  let elapsed = 0;
  let lastTime = 0;
  let animationTime = 0;
  let messageTime = 0;
  let scoreNameSaved = false;
  let flash = 0;
  let rainOffset = 0;
  let introLine = 0;
  let player;
  let obstacles = [];
  let enemies = [];
  let gems = [];
  let bolts = [];
  let projectiles = [];
  let particles = [];
  let boss = null;
  let scores = loadScores();
  let pressedShift = false;
  let canvasScale = 1;

  const introLines = [
    "KAMIL MODLI SIĘ PRZY ŚWIECY. NAGLE DZWONI TELEFON...",
    "PROBOSZCZ: KAMIL, PILNIE NA PLEBANIĘ! TYLKO SIĘ NIE SPÓŹNIJ!",
    "KAMIL: JUŻ LECĘ, PROSZĘ KSIĘDZA! (SPACJA, ŻEBY POMINĄĆ)",
  ];
  const betweenLines = [
    ["PROBOSZCZ: ZUCH CHŁOPAK! TERAZ ODWIEDŹ PANA KRZYSZTOFA.", "KAMIL: W TĘ ULEWĘ? NO DOBRZE..."],
    ["KAMIL: KRZYSZTOF DORZUCIŁ DYCHĘ. CZAS WRACAĆ!", "Z KOŚCIOŁA DOBIEGAJĄ NIEPOKOJĄCE DZWONY..."],
  ];

  function loadScores() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return Array.isArray(saved) ? saved.filter((entry) => entry && typeof entry.name === "string") : [];
    } catch (error) {
      console.warn("Nie udało się odczytać lokalnej tablicy wyników.", error);
      return [];
    }
  }

  function saveScores() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(scores.slice(0, 20)));
      return true;
    } catch (error) {
      console.error("Nie udało się zapisać lokalnej tablicy wyników.", error);
      return false;
    }
  }

  function resetRun() {
    stage = 0;
    score = 0;
    elapsed = 0;
    player = { y: FLOOR, vy: 0, lives: 3, invulnerable: 0, meter: 0, jumps: 0, facing: 1 };
    scoreNameSaved = false;
    initStage();
    state = "intro";
    introLine = 0;
    scoreForm.hidden = true;
  }

  function initStage() {
    camera = 0;
    obstacles = [];
    enemies = [];
    gems = [];
    bolts = [];
    projectiles = [];
    particles = [];
    boss = null;
    const rng = seeded(stage * 931 + 17);
    for (let x = 370; x < LEVEL_LENGTH - 150; x += 245 + rng() * 110) {
      if (stage === 2 && x > LEVEL_LENGTH - 850) break;
      obstacles.push({ x, type: rng() > 0.63 ? "hole" : rng() > 0.45 ? "puddle" : "fence", w: 42 + rng() * 20 });
      if (rng() > 0.24) gems.push({ x: x + 110 + rng() * 40, y: FLOOR - 52 - rng() * 42, collected: false });
      if (x > 500 && rng() > 0.3) enemies.push(makeEnemy(x + 170 + rng() * 45));
    }
    if (stage > 0) enemies.push(makeEnemy(750));
    if (stage === 2) boss = { x: LEVEL_LENGTH - 255, hp: 8, maxHp: 8, active: false, hitTimer: 0, attackTimer: 2 };
  }

  function seeded(seed) {
    let value = seed;
    return () => {
      value = (value * 16807) % 2147483647;
      return (value - 1) / 2147483646;
    };
  }

  function makeEnemy(x) {
    const kind = stage === 2 ? ["ghost", "ghost", "bat"][Math.floor(Math.random() * 3)]
      : stage === 1 ? ["boar", "crow", "wolf"][Math.floor(Math.random() * 3)]
        : ["dog", "wolf", "bat"][Math.floor(Math.random() * 3)];
    return { x, y: FLOOR, kind, hp: kind === "boar" || kind === "wolf" ? 2 : 1, hit: 0, phase: Math.random() * 6 };
  }

  function nextStage() {
    if (stage + 1 >= stages.length) {
      state = "won";
      showScoreEntry();
      return;
    }
    stage += 1;
    initStage();
    state = "intermission";
    introLine = 0;
  }

  function jump() {
    if (state !== "playing") return;
    if (player.y >= FLOOR - 1) {
      player.vy = -480;
      player.jumps = 1;
    } else if (player.jumps === 1) {
      player.vy = -610;
      player.jumps = 2;
      player.flipUntil = animationTime + 0.48;
      addText("SALTO!", 180, 300, "#f7d976");
    }
  }

  function throwCross(kind = "cross") {
    if (state !== "playing") return;
    if (kind === "fire" && stage < 1) return;
    if (kind === "bless" && stage < 2) return;
    if (kind === "bless") {
      enemies = enemies.filter((enemy) => {
        if (Math.abs(enemy.x - camera - 180) < 280) { hitEnemy(enemy, 3); return false; }
        return true;
      });
      if (boss?.active && Math.abs(boss.x - camera - 180) < 280) damageBoss(2);
      burst(180, player.y - 44, "#f8d875", 22);
      return;
    }
    projectiles.push({ x: camera + 215, y: player.y - 50, vx: 520, type: kind, ttl: 1.3, hit: new Set() });
  }

  function activateUltimate() {
    if (player.meter < 100 || state !== "playing") return;
    player.meter = 0;
    flash = 0.48;
    enemies.forEach((enemy) => hitEnemy(enemy, 5));
    enemies = enemies.filter((enemy) => enemy.hp > 0);
    if (boss?.active) damageBoss(3);
    burst(480, 225, "#ffe178", 56);
    addText("GROM Z NIEBA!", 480, 175, "#fff0a5");
  }

  function hitEnemy(enemy, amount) {
    enemy.hp -= amount;
    enemy.hit = 0.15;
    if (enemy.hp <= 0) {
      score += enemy.kind === "ghost" ? 180 : 120;
      player.meter = Math.min(100, player.meter + 8);
      burst(enemy.x - camera, enemy.y - 35, enemy.kind === "ghost" ? "#a8e7ff" : "#ffd16a", 9);
    }
  }

  function damageBoss(amount) {
    if (!boss?.active) return;
    boss.hp = Math.max(0, boss.hp - amount);
    boss.hitTimer = 0.35;
    burst(boss.x - camera, FLOOR - 90, "#c8ebff", 14);
    if (boss.hp === 0) {
      score += 1500;
      boss.defeated = true;
      messageTime = 3;
    }
  }

  function hurt() {
    if (player.invulnerable > 0) return;
    player.lives -= 1;
    player.invulnerable = 1.5;
    flash = 0.16;
    burst(180, player.y - 35, "#ff6d61", 12);
    if (player.lives <= 0) {
      state = "gameover";
      showScoreEntry();
    }
  }

  function showScoreEntry() {
    scoreForm.hidden = false;
    nickname.value = "";
    setTimeout(() => nickname.focus(), 0);
  }

  scoreForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (scoreNameSaved) return;
    const name = nickname.value.trim().toLocaleUpperCase("pl-PL").slice(0, 12) || "KAMIL";
    scores.push({ name, score, seconds: Math.floor(elapsed) });
    scores.sort((a, b) => b.score - a.score || a.seconds - b.seconds);
    scores = scores.slice(0, 20);
    scoreNameSaved = true;
    saveScores();
    scoreForm.hidden = true;
    state = "scores";
  });

  function keyDown(event) {
    if (["ArrowLeft", "ArrowRight", "ArrowUp", "Space", "Alt", "Shift"].includes(event.code)) event.preventDefault();
    if (event.repeat) return;
    keyState.add(event.code);
    if (event.code === "Space" || event.code === "ArrowUp") {
      if (state === "title") resetRun();
      else if (state === "intro" || state === "intermission") advanceDialogue();
      else jump();
    }
    if (event.code === "Enter") {
      if (state === "title") resetRun();
      else if (state === "intro" || state === "intermission") advanceDialogue();
      else if (state === "scores" || state === "gameover" || state === "won") state = "title";
    }
    if (event.code === "KeyH" && state === "title") state = "scores";
    if (event.code === "Escape" && state === "scores") state = "title";
    if (event.code === "AltLeft" || event.code === "AltRight") throwCross("cross");
    if (event.code === "KeyZ") throwCross("fire");
    if (event.code === "KeyX") throwCross("bless");
    if (event.code === "ShiftLeft" || event.code === "ShiftRight") pressedShift = true;
  }

  function keyUp(event) {
    keyState.delete(event.code);
    if ((event.code === "ShiftLeft" || event.code === "ShiftRight") && pressedShift) {
      pressedShift = false;
      activateUltimate();
    }
  }

  function advanceDialogue() {
    introLine += 1;
    if (state === "intro" && introLine >= introLines.length) {
      state = "playing";
      return;
    }
    if (state === "intermission" && introLine >= betweenLines[stage - 1].length) state = "playing";
  }

  window.addEventListener("keydown", keyDown);
  window.addEventListener("keyup", keyUp);
  window.addEventListener("blur", () => { keyState.clear(); pressedShift = false; });

  function canvasPoint(event) {
    const bounds = canvas.getBoundingClientRect();
    canvasScale = W / bounds.width;
    return { x: (event.clientX - bounds.left) * canvasScale, y: (event.clientY - bounds.top) * canvasScale };
  }

  canvas.addEventListener("pointerdown", (event) => {
    const { x, y } = canvasPoint(event);
    if (state === "title") {
      if (y > 340 && y < 430) resetRun();
      else if (y > 430) state = "scores";
    } else if (state === "intro" || state === "intermission") advanceDialogue();
    else if (state === "scores") state = "title";
    else if (state === "playing") {
      if (x < W * 0.35) jump();
      else if (x > W * 0.74) throwCross(stage > 0 ? "fire" : "cross");
    }
  });

  document.querySelectorAll(".touch-controls button").forEach((button) => {
    const code = button.dataset.key;
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      if (code === "Space") jump();
      else if (code === "Alt") throwCross(stage > 0 ? "fire" : "cross");
      else keyState.add(code);
    });
    for (const type of ["pointerup", "pointerleave", "pointercancel"]) {
      button.addEventListener(type, () => keyState.delete(code));
    }
  });

  function update(dt) {
    animationTime += dt;
    if (flash > 0) flash = Math.max(0, flash - dt);
    if (messageTime > 0) messageTime = Math.max(0, messageTime - dt);
    if (state !== "playing") return;
    elapsed += dt;
    rainOffset = (rainOffset + dt * 280) % 80;
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    const isMoving = keyState.has("ArrowRight") || keyState.has("KeyD");
    const isBack = keyState.has("ArrowLeft") || keyState.has("KeyA");
    player.facing = isBack ? -1 : 1;
    camera += dt * (isMoving ? 210 : 155);
    if (isBack) camera = Math.max(0, camera - dt * 190);
    camera = Math.min(camera, LEVEL_LENGTH);

    player.vy += 1220 * dt;
    player.y += player.vy * dt;
    if (player.y >= FLOOR) {
      player.y = FLOOR;
      player.vy = 0;
      player.jumps = 0;
    }
    if (pressedShift && player.meter >= 100) {
      player.pray = (player.pray || 0) + dt;
      if (player.pray > 1) player.glow = Math.min(1, (player.glow || 0) + dt);
    } else {
      player.pray = 0;
      player.glow = Math.max(0, (player.glow || 0) - dt * 2);
    }

    const px = camera + 180;
    for (const obstacle of obstacles) {
      const sx = obstacle.x - camera;
      if (sx < 155 || sx > 225) continue;
      const airborne = player.y < FLOOR - 16;
      if (obstacle.type === "hole" ? !airborne : !airborne && player.invulnerable <= 0) hurt();
    }
    for (const gem of gems) {
      if (!gem.collected && Math.abs(gem.x - px) < 28 && Math.abs((player.y - 45) - gem.y) < 55) {
        gem.collected = true;
        score += 100;
        player.meter = Math.min(100, player.meter + 12);
        burst(gem.x - camera, gem.y, "#72f6dc", 8);
      }
    }
    for (const bolt of bolts) {
      if (!bolt.collected && Math.abs(bolt.x - px) < 27 && Math.abs(player.y - bolt.y) < 55) {
        bolt.collected = true;
        score += 50;
        camera += 80;
        burst(bolt.x - camera, bolt.y, "#fff27a", 8);
      }
    }

    for (const enemy of enemies) {
      if (enemy.hp <= 0 || enemy.x - camera < -60) continue;
      const bob = enemy.kind === "bat" || enemy.kind === "crow" || enemy.kind === "ghost"
        ? Math.sin(animationTime * 4 + enemy.phase) * 28 : 0;
      const ey = FLOOR - 30 + bob;
      if (Math.abs(enemy.x - px) < 40 && Math.abs((player.y - 35) - ey) < 46) hurt();
      enemy.hit = Math.max(0, enemy.hit - dt);
    }
    enemies = enemies.filter((enemy) => enemy.hp > 0 && enemy.x - camera > -100);

    for (const shot of projectiles) {
      shot.x += shot.vx * dt;
      shot.ttl -= dt;
      for (const enemy of enemies) {
        if (!shot.hit.has(enemy) && Math.abs(enemy.x - shot.x) < 35 && Math.abs(enemy.y - 35 - shot.y) < 55) {
          shot.hit.add(enemy);
          hitEnemy(enemy, shot.type === "fire" ? 2 : 1);
        }
      }
      if (boss?.active && !shot.hit.has(boss) && Math.abs(boss.x - shot.x) < 62 && Math.abs(FLOOR - 90 - shot.y) < 75) {
        shot.hit.add(boss);
        damageBoss(shot.type === "fire" ? 2 : 1);
      }
    }
    projectiles = projectiles.filter((shot) => shot.ttl > 0 && shot.x - camera < W + 100);

    if (boss && camera > boss.x - W * 0.8) {
      boss.active = true;
      camera = Math.min(camera, boss.x - 620);
      boss.attackTimer -= dt;
      boss.hitTimer = Math.max(0, boss.hitTimer - dt);
      if (!boss.defeated && boss.attackTimer <= 0) {
        boss.attackTimer = 2.3;
        if (Math.abs(boss.x - camera - 180) < 420) hurt();
      }
      if (boss.defeated && messageTime <= 0) nextStage();
    } else if (!boss && camera >= LEVEL_LENGTH - 50) {
      nextStage();
    }
    if (Math.random() < dt * 0.16) bolts.push({ x: camera + W + 50, y: FLOOR - 45 - Math.random() * 70, collected: false });
    bolts = bolts.filter((bolt) => bolt.x - camera > -100 && !bolt.collected);
    particles.forEach((particle) => {
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 80 * dt;
      particle.life -= dt;
    });
    particles = particles.filter((particle) => particle.life > 0);
  }

  function burst(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 25 + Math.random() * 180;
      particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, color, life: .35 + Math.random() * .5, size: 2 + Math.random() * 4 });
    }
  }

  function addText(text, x, y, color) {
    particles.push({ text, x, y, vx: 0, vy: -32, color, life: 1.2, size: 18 });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (state === "title") drawTitle();
    else if (state === "scores") drawScores();
    else {
      drawWorld();
      if (state === "intro") drawDialogue(introLines[introLine] || introLines[0]);
      if (state === "intermission") drawDialogue(betweenLines[stage - 1][introLine] || "");
      if (state === "gameover") drawEnd(false);
      if (state === "won") drawEnd(true);
    }
    if (flash > 0) {
      ctx.fillStyle = `rgba(255,244,198,${Math.min(.85, flash * 1.6)})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawTitle() {
    if (art.title.complete && art.title.naturalWidth) ctx.drawImage(art.title, 0, 0, W, H);
    else {
      ctx.fillStyle = "#171224";
      ctx.fillRect(0, 0, W, H);
    }
    ctx.fillStyle = "#05050bcc";
    ctx.fillRect(0, 0, W, H);
    drawPortrait(animationTime % 6 > 5.65);
    ctx.textAlign = "center";
    ctx.shadowColor = "#e3a940";
    ctx.shadowBlur = 14;
    ctx.fillStyle = "#ffe38a";
    ctx.font = "28px 'Press Start 2P', monospace";
    ctx.fillText("PRZYGODY KSIĘDZA", W / 2, 120);
    ctx.font = "39px 'Press Start 2P', monospace";
    ctx.fillText("KAMILA", W / 2, 174);
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#e8d8ba";
    ctx.font = "23px 'VT323', monospace";
    ctx.fillText("NOCNA ZMIANA NA PARAFII — ARCADE EDITION", W / 2, 211);
    candleRow();
    button(W / 2 - 150, 342, 300, 58, "START NEW GAME");
    button(W / 2 - 120, 415, 240, 42, "HIGH SCORES");
    ctx.fillStyle = "#d5c7ad";
    ctx.font = "18px 'VT323', monospace";
    ctx.fillText("STRZAŁKI / SPACJA / ALT / SHIFT", W / 2, 495);
    ctx.fillText(`v1.${Math.max(1, 1 + Object.keys(art).length)}`, W - 55, H - 14);
  }

  function drawPortrait(closed) {
    const img = closed ? art.closed : art.portrait;
    if (img.complete && img.naturalWidth) {
      ctx.save();
      ctx.globalAlpha = .45;
      ctx.drawImage(img, 350, 47, 260, 260);
      ctx.restore();
    }
  }

  function candleRow() {
    const frame = art.candles[Math.floor(animationTime * 10) % art.candles.length];
    for (let x = 90; x < W; x += 120) {
      if (frame.complete && frame.naturalWidth) ctx.drawImage(frame, x - 30, 445, 60, 60);
      else {
        ctx.fillStyle = "#8b6045";
        ctx.fillRect(x - 7, 468, 14, 30);
        ctx.fillStyle = "#ffc75c";
        ctx.fillRect(x - 3, 454 + Math.sin(animationTime * 9 + x) * 2, 6, 14);
      }
    }
  }

  function button(x, y, w, h, text) {
    ctx.fillStyle = "#08070bc9";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#e6bd70";
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "#ffe9ad";
    ctx.font = "19px 'Press Start 2P', monospace";
    ctx.textAlign = "center";
    ctx.fillText(text, x + w / 2, y + h / 2 + 7);
  }

  function drawScores() {
    ctx.fillStyle = "#11101c";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffe18a";
    ctx.font = "27px 'Press Start 2P', monospace";
    ctx.fillText("HIGH SCORES", W / 2, 65);
    ctx.font = "20px 'VT323', monospace";
    ctx.fillStyle = "#d9c8a9";
    ctx.fillText("RANGA      NICK                 PUNKTY       CZAS", W / 2, 115);
    ctx.textAlign = "left";
    const rows = [...scores].sort((a, b) => b.score - a.score || a.seconds - b.seconds).slice(0, 8);
    rows.forEach((entry, index) => {
      const y = 158 + index * 36;
      ctx.fillStyle = index === 0 ? "#ffe18a" : "#f1e7d2";
      ctx.fillText(`${String(index + 1).padStart(2, "0")}        ${entry.name.padEnd(18)} ${String(entry.score).padStart(7)}     ${formatTime(entry.seconds)}`, 195, y);
    });
    if (!rows.length) {
      ctx.textAlign = "center";
      ctx.fillText("BRAK WYNIKÓW — CZAS ZDOBYĆ PIERWSZY!", W / 2, 210);
    }
    ctx.textAlign = "center";
    ctx.fillStyle = "#c7b9a2";
    ctx.fillText("ENTER / KLIKNIJ, ABY WRÓCIĆ", W / 2, 490);
  }

  function drawWorld() {
    const data = stages[stage];
    const sky = ctx.createLinearGradient(0, 0, 0, FLOOR);
    sky.addColorStop(0, data.sky);
    sky.addColorStop(1, stage === 0 ? "#8d5c55" : "#394451");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
    drawMoonAndStars();
    drawTown();
    if (stage === 1) drawRain();
    drawGround(data);
    drawObstacles();
    drawPickups();
    drawEnemies();
    drawBoss();
    drawShots();
    drawPlayer();
    drawParticles();
    drawHud();
    if (player.glow > 0) {
      ctx.fillStyle = `rgba(255,214,99,${player.glow * .16})`;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawMoonAndStars() {
    ctx.fillStyle = "#f4e3ad";
    if (stage === 2) {
      ctx.beginPath(); ctx.arc(790, 78, 35, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = stages[stage].sky;
      ctx.beginPath(); ctx.arc(804, 68, 34, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = "#ffffff99";
    for (let i = 0; i < 30; i++) {
      const x = ((i * 193 - camera * .08) % W + W) % W;
      const y = 23 + (i * 67) % 190;
      ctx.fillRect(x, y, i % 4 === 0 ? 3 : 1, i % 4 === 0 ? 3 : 1);
    }
  }

  function drawTown() {
    const offset = (camera * .25) % 300;
    for (let i = -1; i < 5; i++) {
      const x = i * 300 - offset;
      const height = 75 + (i * 37 % 45 + 45) % 45;
      ctx.fillStyle = stage === 2 ? "#151a2e" : "#29303d";
      ctx.fillRect(x, FLOOR - height - 12, 132, height + 12);
      ctx.fillStyle = stage === 2 ? "#a7814a" : "#e0b875";
      for (let wy = FLOOR - height + 12; wy < FLOOR - 25; wy += 24) {
        for (let wx = x + 13; wx < x + 120; wx += 30) {
          ctx.globalAlpha = .3 + ((Math.floor(wx + wy) % 2) * .22);
          ctx.fillRect(wx, wy, 8, 11);
        }
      }
    }
    ctx.globalAlpha = 1;
    if (camera > LEVEL_LENGTH - 640 || boss?.active) {
      const x = Math.max(540, Math.min(760, LEVEL_LENGTH - camera + 100));
      drawChurch(x, FLOOR - 14);
    }
  }

  function drawChurch(x, y) {
    ctx.fillStyle = "#393447";
    ctx.fillRect(x, y - 164, 112, 150);
    ctx.beginPath();
    ctx.moveTo(x - 18, y - 160); ctx.lineTo(x + 56, y - 226); ctx.lineTo(x + 130, y - 160);
    ctx.fill();
    ctx.fillRect(x + 47, y - 260, 18, 38);
    ctx.fillStyle = "#f2cb72";
    ctx.beginPath(); ctx.arc(x + 56, y - 120, 17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#2b2233";
    ctx.fillRect(x + 47, y - 60, 20, 46);
  }

  function drawRain() {
    ctx.strokeStyle = "#91c8e855";
    ctx.lineWidth = 2;
    for (let i = 0; i < 68; i++) {
      const x = (i * 73 + rainOffset * 1.7) % W;
      const y = (i * 117 + rainOffset * 2.5) % FLOOR;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 7, y + 18); ctx.stroke();
    }
  }

  function drawGround(data) {
    ctx.fillStyle = data.ground;
    ctx.fillRect(0, FLOOR, W, H - FLOOR);
    ctx.fillStyle = stage === 0 ? "#77835c" : "#5c675e";
    ctx.fillRect(0, FLOOR, W, 8);
    ctx.fillStyle = "#1c2026";
    for (let x = -((camera * 1.1) % 80); x < W; x += 80) {
      ctx.fillRect(x, FLOOR + 30, 35, 3);
      ctx.fillRect(x + 42, FLOOR + 56, 20, 3);
    }
  }

  function drawObstacles() {
    for (const obstacle of obstacles) {
      const x = obstacle.x - camera;
      if (x < -80 || x > W + 80) continue;
      if (obstacle.type === "hole") {
        ctx.fillStyle = "#090c14";
        ctx.beginPath(); ctx.ellipse(x, FLOOR + 2, obstacle.w, 18, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "#9ca4a5"; ctx.beginPath(); ctx.ellipse(x, FLOOR, obstacle.w, 13, 0, Math.PI, Math.PI * 2); ctx.stroke();
      } else if (obstacle.type === "fence") {
        ctx.fillStyle = "#684a36";
        ctx.fillRect(x - 18, FLOOR - 44, 9, 44);
        ctx.fillRect(x + 14, FLOOR - 44, 9, 44);
        ctx.fillRect(x - 24, FLOOR - 37, 48, 8);
        ctx.fillRect(x - 24, FLOOR - 17, 48, 7);
      } else {
        ctx.fillStyle = "#47616a";
        ctx.beginPath(); ctx.ellipse(x, FLOOR - 4, obstacle.w / 2, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#a9c5c6";
        ctx.fillRect(x - 14, FLOOR - 9, 10, 2);
      }
    }
  }

  function drawPickups() {
    for (const gem of gems) {
      if (gem.collected) continue;
      const x = gem.x - camera;
      if (x < -30 || x > W + 30) continue;
      ctx.save();
      ctx.translate(x, gem.y + Math.sin(animationTime * 4 + gem.x) * 4);
      ctx.fillStyle = "#79ffe2";
      ctx.shadowColor = "#36ffe7";
      ctx.shadowBlur = 12;
      ctx.beginPath(); ctx.moveTo(0, -13); ctx.lineTo(10, -2); ctx.lineTo(0, 12); ctx.lineTo(-10, -2); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    for (const bolt of bolts) {
      const x = bolt.x - camera;
      ctx.fillStyle = "#fff07a";
      ctx.font = "25px monospace";
      ctx.textAlign = "center";
      ctx.fillText("ϟ", x, bolt.y);
    }
  }

  function drawEnemies() {
    for (const enemy of enemies) {
      const x = enemy.x - camera;
      if (x < -60 || x > W + 60) continue;
      const bob = enemy.kind === "bat" || enemy.kind === "crow" || enemy.kind === "ghost" ? Math.sin(animationTime * 4 + enemy.phase) * 28 : 0;
      const y = FLOOR - 27 + bob;
      ctx.save();
      ctx.translate(x, y);
      if (enemy.hit > 0) ctx.globalAlpha = .45;
      const colors = { dog: "#ab6944", wolf: "#82858d", bat: "#725b90", boar: "#876046", crow: "#282837", ghost: "#b8e4ed" };
      ctx.fillStyle = colors[enemy.kind];
      if (enemy.kind === "ghost") {
        ctx.beginPath(); ctx.arc(0, -7, 19, Math.PI, 0); ctx.lineTo(19, 17); ctx.lineTo(9, 10); ctx.lineTo(0, 18); ctx.lineTo(-9, 10); ctx.lineTo(-19, 17); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#283047";
        ctx.fillRect(-8, -8, 4, 5); ctx.fillRect(5, -8, 4, 5);
      } else if (enemy.kind === "bat" || enemy.kind === "crow") {
        ctx.beginPath(); ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(-28, -10 - Math.sin(animationTime * 12) * 5); ctx.lineTo(-15, 8); ctx.fill();
        ctx.beginPath(); ctx.moveTo(5, 0); ctx.lineTo(28, -10 + Math.sin(animationTime * 12) * 5); ctx.lineTo(15, 8); ctx.fill();
      } else {
        ctx.beginPath(); ctx.ellipse(0, 0, 22, 14, 0, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(17, -8, 9, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#17131d"; ctx.fillRect(20, -11, 3, 3);
        ctx.fillStyle = colors[enemy.kind];
        ctx.fillRect(-14, 8, 5, 12); ctx.fillRect(7, 8, 5, 12);
      }
      ctx.restore();
    }
  }

  function drawBoss() {
    if (!boss?.active || boss.defeated) return;
    const x = boss.x - camera;
    ctx.fillStyle = boss.hitTimer > 0 ? "#ffffff" : "#c2dae8";
    ctx.beginPath(); ctx.arc(x, FLOOR - 86, 38, Math.PI, 0); ctx.lineTo(x + 37, FLOOR - 17); ctx.lineTo(x + 20, FLOOR - 29); ctx.lineTo(x, FLOOR - 18); ctx.lineTo(x - 20, FLOOR - 30); ctx.lineTo(x - 37, FLOOR - 17); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#303146";
    ctx.fillRect(x - 15, FLOOR - 93, 7, 9); ctx.fillRect(x + 8, FLOOR - 93, 7, 9);
    ctx.fillStyle = "#17121d";
    ctx.fillRect(325, 22, 310, 12);
    ctx.fillStyle = "#e67e78";
    ctx.fillRect(327, 24, 306 * (boss.hp / boss.maxHp), 8);
    ctx.fillStyle = "#ffe4c1";
    ctx.font = "15px 'VT323', monospace";
    ctx.textAlign = "center";
    ctx.fillText("UPIORNY KOŚCIELNY", 480, 18);
  }

  function drawShots() {
    for (const shot of projectiles) {
      const x = shot.x - camera;
      const frame = Math.floor(animationTime * 14) % (shot.type === "fire" ? art.fire.length : art.cross.length);
      const img = shot.type === "fire" ? art.fire[frame] : art.cross[frame];
      if (img.complete && img.naturalWidth) ctx.drawImage(img, x - 22, shot.y - 22, 44, 44);
      else {
        ctx.fillStyle = shot.type === "fire" ? "#ff9f50" : "#fff0a4";
        ctx.fillRect(x - 11, shot.y - 4, 24, 8);
      }
    }
  }

  function drawPlayer() {
    if (player.invulnerable > 0 && Math.floor(animationTime * 14) % 2) return;
    const airborne = player.y < FLOOR - 2;
    let frames = airborne ? (animationTime < (player.flipUntil || 0) ? art.flip : art.jump) : art.player;
    const frame = frames[Math.floor(animationTime * (airborne ? 12 : 10)) % frames.length];
    if (!frame?.complete || !frame.naturalWidth) {
      ctx.fillStyle = "#bd643d";
      ctx.fillRect(160, player.y - 83, 35, 28);
      ctx.fillStyle = "#14121b";
      ctx.fillRect(153, player.y - 55, 48, 55);
      return;
    }
    const h = 118;
    const w = Math.max(46, h * frame.naturalWidth / frame.naturalHeight);
    ctx.save();
    ctx.shadowColor = "#f2c56c";
    ctx.shadowBlur = player.glow > 0 ? 24 : 8;
    if (player.facing < 0) {
      ctx.translate(180, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(frame, -w / 2, player.y - h, w, h);
    } else ctx.drawImage(frame, 180 - w / 2, player.y - h, w, h);
    ctx.restore();
  }

  function drawParticles() {
    for (const particle of particles) {
      ctx.globalAlpha = Math.min(1, particle.life * 2);
      if (particle.text) {
        ctx.fillStyle = particle.color;
        ctx.font = `bold ${particle.size}px 'VT323', monospace`;
        ctx.textAlign = "center";
        ctx.fillText(particle.text, particle.x, particle.y);
      } else {
        ctx.fillStyle = particle.color;
        ctx.fillRect(particle.x, particle.y, particle.size, particle.size);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawHud() {
    ctx.fillStyle = "#090811c9";
    ctx.fillRect(0, 0, W, 54);
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffe6ac";
    ctx.font = "20px 'VT323', monospace";
    ctx.fillText(`ETAP ${stage + 1}: ${stages[stage].title}`, 18, 24);
    ctx.fillStyle = "#fff5db";
    ctx.fillText(`PUNKTY ${score}`, 18, 47);
    ctx.fillText(`CZAS ${formatTime(Math.floor(elapsed))}`, 188, 47);
    ctx.fillStyle = "#e88678";
    ctx.fillText("♥".repeat(Math.max(0, player.lives)), 367, 44);
    ctx.fillStyle = "#322a35";
    ctx.fillRect(475, 26, 155, 12);
    ctx.fillStyle = player.meter >= 100 ? "#ffe17b" : "#73ead6";
    ctx.fillRect(477, 28, 151 * player.meter / 100, 8);
    ctx.fillStyle = "#fff3c8";
    ctx.fillText("GROM", 635, 38);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "right";
    ctx.fillText(`${Math.min(100, Math.floor(camera / LEVEL_LENGTH * 100))}%`, 940, 31);
    ctx.fillStyle = "#090811aa";
    ctx.fillRect(704, 40, 240, 7);
    ctx.fillStyle = "#be9460";
    ctx.fillRect(706, 42, 236 * Math.min(1, camera / LEVEL_LENGTH), 3);
  }

  function drawDialogue(line) {
    ctx.fillStyle = "#08070de8";
    ctx.fillRect(50, 350, 860, 126);
    ctx.strokeStyle = "#d2a863";
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 350, 860, 126);
    if (art.portrait.complete && art.portrait.naturalWidth) ctx.drawImage(art.portrait, 72, 365, 94, 94);
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffe9bb";
    ctx.font = "24px 'VT323', monospace";
    wrapText(line, 188, 390, 690, 31);
    ctx.fillStyle = "#cdbb9e";
    ctx.font = "17px 'VT323', monospace";
    ctx.fillText("SPACJA / KLIKNIJ — DALEJ", 188, 456);
  }

  function drawEnd(won) {
    ctx.fillStyle = "#08070de8";
    ctx.fillRect(160, 120, 640, 300);
    ctx.strokeStyle = "#d2a863";
    ctx.strokeRect(160, 120, 640, 300);
    ctx.textAlign = "center";
    ctx.fillStyle = won ? "#ffe28a" : "#ff9a87";
    ctx.font = "28px 'Press Start 2P', monospace";
    ctx.fillText(won ? "KOŚCIÓŁ OBRONIONY!" : "KONIEC GRY", W / 2, 185);
    ctx.fillStyle = "#f7e7ce";
    ctx.font = "26px 'VT323', monospace";
    ctx.fillText(`WYNIK: ${score}      CZAS: ${formatTime(Math.floor(elapsed))}`, W / 2, 240);
    ctx.font = "20px 'VT323', monospace";
    ctx.fillText(won ? "PROBOSZCZ: Z CIEBIE BĘDZIE JESZCZE PROBOSZCZ!" : "SPRÓBUJ JESZCZE RAZ, WIKARY!", W / 2, 286);
    ctx.fillText("WPISZ NICK, ZAPISZ WYNIK ALBO NACIŚNIJ ENTER", W / 2, 355);
  }

  function wrapText(text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    let lineY = y;
    for (const word of words) {
      const test = line + word + " ";
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, lineY);
        line = word + " ";
        lineY += lineHeight;
      } else line = test;
    }
    ctx.fillText(line, x, lineY);
  }

  function formatTime(seconds) {
    return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }

  function drawEndFrame(time) {
    const dt = Math.min(.04, (time - lastTime) / 1000 || 0);
    lastTime = time;
    update(dt);
    draw();
    requestAnimationFrame(drawEndFrame);
  }

  document.fonts?.ready.then(() => {});
  requestAnimationFrame(drawEndFrame);
})();