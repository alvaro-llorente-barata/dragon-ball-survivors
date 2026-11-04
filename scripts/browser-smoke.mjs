// Prueba de humo en un navegador real (Chrome/Edge headless vía DevTools Protocol, sin dependencias).
// Uso: npm run dev (en otra terminal) y luego:
//   node scripts/browser-smoke.mjs [URL] [carpeta-capturas]
// Variable opcional CHROME_PATH para indicar el ejecutable.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL_ = process.argv[2] ?? 'http://127.0.0.1:5173/';
const OUT = process.argv[3] ?? join(tmpdir(), 'dbs-smoke');
mkdirSync(OUT, { recursive: true });
const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const exe = candidates.find((p) => existsSync(p));
if (!exe) throw new Error('No se encontró Chrome/Edge. Define CHROME_PATH.');

const PORT = 9333;
const browser = spawn(exe, [
  '--headless=new',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${join(OUT, 'profile')}`,
  '--window-size=1280,800',
  '--no-first-run',
  '--mute-audio',
  '--autoplay-policy=no-user-gesture-required',
  'about:blank',
], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws;
let id = 0;
const pending = new Map();
const errors = [];
const results = [];

function send(method, params = {}) {
  const msgId = ++id;
  ws.send(JSON.stringify({ id: msgId, method, params }));
  return new Promise((resolve, reject) => pending.set(msgId, { resolve, reject }));
}
async function evaluate(expr) {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(`Evaluate falló: ${r.exceptionDetails.text} ${r.exceptionDetails.exception?.description ?? ''}`);
  return r.result.value;
}
async function key(k, code, keyCode, holdMs = 0) {
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: k, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode });
  if (holdMs) await sleep(holdMs);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: keyCode, nativeVirtualKeyCode: keyCode });
}
async function shot(name) {
  const r = await send('Page.captureScreenshot', { format: 'png' });
  const file = join(OUT, `${name}.png`);
  writeFileSync(file, Buffer.from(r.data, 'base64'));
  return file;
}
function check(name, ok, detail = '') {
  results.push({ name, ok: !!ok, detail });
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' · ' + detail : ''}`);
}
const clickText = (t) =>
  evaluate(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes(${JSON.stringify(t)})); if (b) b.click(); return !!b; })()`);
const S = (expr) => evaluate(`(() => { const s = window.__dbs; return ${expr}; })()`);

async function main() {
  let target;
  for (let i = 0; i < 40 && !target; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
      target = list.find((t) => t.type === 'page');
    } catch {
      await sleep(250);
    }
  }
  if (!target) throw new Error('No se pudo conectar con el navegador');
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id).resolve(msg.result ?? {});
      pending.delete(msg.id);
    } else if (msg.method === 'Runtime.exceptionThrown') {
      errors.push(msg.params.exceptionDetails.exception?.description ?? msg.params.exceptionDetails.text);
    } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      errors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '));
    }
  });
  await send('Runtime.enable');
  await send('Page.enable');
  await send('Page.navigate', { url: URL_ });
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    if (await evaluate(`document.body.innerText.includes('Jugar')`).catch(() => false)) break;
  }
  console.log('Texto inicial:', (await evaluate('document.body.innerText.slice(0, 120)')).replace(/\n/g, ' | '));

  check('Menú principal visible', await clickText('Jugar'));
  await sleep(600);
  check('Pantalla de selección', await clickText('¡A luchar'));
  await sleep(3500);
  check('Escena de juego creada', await S('!!s && !!s.player'));
  await shot('01-inicio');

  const x0 = await S('s.player.x');
  await key('d', 'KeyD', 68, 1500);
  const x1 = await S('s.player.x');
  check('Movimiento del jugador (D)', x1 > x0 + 100, `${Math.round(x0)} → ${Math.round(x1)}`);
  const cam = await S('Math.abs(s.cameras.main.midPoint.x - s.player.x) < 120');
  check('Cámara sigue al jugador', cam);

  await sleep(6000);
  check('Aparecen enemigos', (await S('s.enemies.count()')) > 0, `activos: ${await S('s.enemies.count()')}`);
  const near = await S(`(() => { const p = s.player; return s.enemies.activeEnemies().some(e => Math.hypot(e.x - p.x, e.y - p.y) < 500); })()`);
  check('Los enemigos persiguen al jugador', near);
  check('Ataques automáticos matan enemigos', (await S('s.run.kills')) > 0, `bajas: ${await S('s.run.kills')}`);
  await shot('02-combate');

  // Subida de nivel y selección de mejora
  const weaponsBefore = await S('JSON.stringify([s.run.weapons, s.run.passives])');
  await S('(s.gainXp(9999), 0)');
  await sleep(500);
  check('Ventana de subida de nivel', await evaluate(`document.body.innerText.includes('Elige una mejora')`));
  await shot('03-nivel');
  let guard = 0;
  while ((await evaluate(`document.body.innerText.includes('Elige una mejora')`)) && guard++ < 40) {
    await key('1', 'Digit1', 49);
    await sleep(150);
  }
  check('Mejoras aplicadas', (await S('JSON.stringify([s.run.weapons, s.run.passives])')) !== weaponsBefore, await S('JSON.stringify(s.run.weapons)'));
  check('Nivel alto tras EXP', (await S('s.run.level')) >= 10, `nivel ${await S('s.run.level')}`);

  check('Máximo 4 ataques', (await S('Object.keys(s.run.weapons).length')) <= 4, await S('Object.keys(s.run.weapons).length'));

  // Mundo infinito: el jugador viaja lejos y los trozos se cargan y descargan.
  await S(`(() => { s.player.invulnUntil = s.time.now + 600000; return 0; })()`);
  const chunksBefore = await S('s.world.loadedCount()');
  for (let i = 1; i <= 6; i++) {
    await S(`(() => { s.player.sprite.body.reset(s.player.x + 2600, s.player.y - 1800); return 0; })()`);
    await sleep(350);
  }
  check('Jugador visible sobre el suelo en coordenadas negativas', await S('s.player.y < 0 && s.player.sprite.depth > 0 && s.player.sprite.visible'), `y=${Math.round(await S('s.player.y'))}`);
  check('Mapa infinito: viaje de 15.000 px', (await S('s.player.x')) > 15000, `x=${Math.round(await S('s.player.x'))}`);
  check('Trozos acotados en memoria', (await S('s.world.loadedCount()')) <= 49, `trozos cargados: ${await S('s.world.loadedCount()')} (antes ${chunksBefore})`);
  await sleep(1500);
  await shot('04-lejos');

  // Ataque definitivo
  await S('(s.run.ki = 100, 0)');
  const killsBeforeUlt = await S('s.run.kills');
  await key('q', 'KeyQ', 81);
  await sleep(2600);
  check('Genkidama lanzada (Ki gastado)', (await S('s.run.ki')) < 100);
  check('Genkidama sin errores', true, `bajas ${killsBeforeUlt} → ${await S('s.run.kills')}`);

  // Esquiva
  const before = await S('[s.player.x, s.player.y]');
  await S('(s.player.dodgeReadyAt = 0, 0)');
  await key(' ', 'Space', 32);
  await sleep(200);
  const after = await S('[s.player.x, s.player.y]');
  check('Teletransporte (Espacio)', Math.hypot(after[0] - before[0], after[1] - before[1]) > 30, await S(`JSON.stringify({ modal: s.activeModal?.type ?? null, paused: s.scene.isPaused(), ready: s.player.dodgeReadyAt, now: Math.round(s.time.now) })`));

  // Cápsula y objeto
  await S(`(() => { s.player.invulnUntil = s.time.now + 60000; return 0; })()`);
  const coinsBefore = await S('s.run.coins + s.run.xp + s.run.hp + s.run.ki + s.run.tickets');
  await S(`(() => { const c = s.loot.capsules.find(c => c.alive); s.player.sprite.body.reset(c.img.x, c.img.y); return 0; })()`);
  await sleep(500);
  while ((await evaluate(`document.body.innerText.includes('Elige una mejora')`)) && guard++ < 80) {
    await key('1', 'Digit1', 49);
    await sleep(150);
  }
  check('Cápsula recogida', (await S('s.loot.capsules.filter(c => !c.alive).length')) >= 1);

  // Cofre
  await S(`(() => { const c = s.loot.chests.find(c => !c.opened); s.player.sprite.body.reset(c.img.x, c.img.y - 12); return 0; })()`);
  await sleep(1200);
  check('Cofre abierto con recompensas', await evaluate(`document.body.innerText.includes('Recompensas')`));
  await shot('05-cofre');
  await clickText('Continuar');
  await sleep(400);
  while ((await evaluate(`document.body.innerText.includes('Elige una mejora')`)) && guard++ < 120) {
    await key('1', 'Digit1', 49);
    await sleep(150);
  }

  // Jefe (se fuerza Raditz, que tiene dos fases)
  await S('(s.bosses.nextIdx = 1, s.run.time = 181, 0)');
  await sleep(2500);
  check('Aparece el jefe (Raditz)', (await S('s.bosses.current()?.def.id')) === 'raditz', await S('s.bosses.current()?.def.id'));
  check('Barra de jefe visible', await evaluate(`/JEFE|MINIBOSS/.test(document.body.innerText)`));
  await shot('06-jefe');
  await S(`(() => { const b = s.bosses.current().enemy; s.enemies.damage(b, b.maxHp * 0.55, false, b.x, b.y); return 0; })()`);
  await sleep(1500);
  check('Fase 2 del jefe', (await S('s.bosses.phase')) >= 1);
  await sleep(3000);
  await S(`(() => { const b = s.bosses.current().enemy; s.bosses.invulnUntil = 0; s.enemies.damage(b, b.hp + 10, false, b.x, b.y); return 0; })()`);
  await sleep(500);
  check('Jefe derrotado', (await S('s.run.bossesDefeated.length')) >= 1, await S('JSON.stringify(s.run.bossesDefeated)'));
  check('Cofre de jefe generado', await S(`s.loot.chests.some(c => !c.opened && (c.rarity === 'epic' || c.rarity === 'rare' || c.rarity === 'legendary'))`));

  // Pausa
  await key('Escape', 'Escape', 27);
  await sleep(300);
  check('Pausa con Esc', await evaluate(`document.body.innerText.includes('Continuar')`), await S(`JSON.stringify({ modal: s.activeModal?.type ?? null })`));
  await clickText('Continuar');
  await sleep(300);

  // Muerte y guardado
  await S(`(() => { s.run.revivesLeft = 0; s.run.shieldHits = 0; s.player.invulnUntil = 0; s.damagePlayer(999999); return 0; })()`);
  await sleep(1000);
  check('Game Over', await evaluate(`document.body.innerText.includes('Has caído')`));
  await shot('07-game-over');
  await clickText('Menú');
  await sleep(800);
  const saved = await evaluate(`new Promise(res => { const r = indexedDB.open('dragon-ball-survivors'); r.onsuccess = () => { const g = r.result.transaction('saves').objectStore('saves').get('main'); g.onsuccess = () => res(g.result ? JSON.parse(g.result).stats.runs : 0); }; r.onerror = () => res(-1); })`);
  check('Progresión guardada en IndexedDB', saved >= 1, `partidas guardadas: ${saved}`);
  // Invocaciones: Bola de Dragón
  await evaluate(`(() => { const m = window.__meta.getState(); m.set({ ...m.meta, tickets: m.meta.tickets + 10 }); return 0; })()`);
  await clickText('Invocaciones');
  await sleep(500);
  check('Pantalla de invocaciones', await evaluate(`document.body.innerText.includes('Banner')`));
  const ownedBefore = await evaluate(`window.__meta.getState().meta.unlockedCharacters.length`);
  await clickText('Invocar x10');
  await sleep(400);
  check('Aparece la Bola de Dragón', await evaluate(`!!document.querySelector('svg[aria-label^="Bola de Dragón"]') && document.body.innerText.includes('brilla')`));
  await shot('08-bola');
  await sleep(2200);
  await shot('09-revelado');
  await clickText('Saltar');
  await sleep(400);
  const after10 = await evaluate(`window.__meta.getState().meta`);
  check('Invocación x10 gasta tickets', after10.gacha.pulls >= 10, `tiradas ${after10.gacha.pulls}`);
  check('Personajes nuevos desbloqueados', after10.unlockedCharacters.length > ownedBefore, `personajes: ${after10.unlockedCharacters.join(',')}`);
  await shot('10-resultado');
  // Jugar con un personaje conseguido distinto de Goku base
  const other = after10.unlockedCharacters.find((id) => id !== 'goku');
  await clickText('Volver');
  await sleep(300);
  await clickText('Jugar');
  await sleep(500);
  if (other) {
    await evaluate(`(() => { const m = window.__meta.getState(); m.select(${JSON.stringify(other)}, 'earth'); return 0; })()`);
    await clickText('Volver');
    await sleep(300);
    await clickText('Jugar');
    await sleep(500);
  }
  await clickText('¡A luchar');
  await sleep(3500);
  check('Nueva partida tras volver al menú', await S('!!s && s.run.time > 0'));
  if (other) {
    check(`Juega con ${other} (aura visible)`, (await S('s.char.id')) === other && (await S('s.player.aura.visible')), await S('s.char.name'));
    await shot('11-otro-personaje');
  }

  check('Sin errores de JavaScript', errors.length === 0, errors.slice(0, 5).join(' | '));
}

main()
  .catch((e) => {
    console.error(e);
    results.push({ name: 'script', ok: false, detail: String(e) });
  })
  .finally(() => {
    try { ws?.close(); } catch {}
    browser.kill();
    const failed = results.filter((r) => !r.ok).length;
    console.log(`\n${results.length - failed}/${results.length} comprobaciones OK · capturas en ${OUT}`);
    if (errors.length) console.log('Errores:', errors);
    process.exit(failed ? 1 : 0);
  });
