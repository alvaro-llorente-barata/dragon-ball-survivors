// Verifica que el menú principal muestra el personaje seleccionado.
// Selecciona uno vía el store, vuelve al menú y captura.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const URL_ = process.argv[2] ?? 'http://127.0.0.1:5175/';
const OUT = process.argv[3] ?? '.';
mkdirSync(OUT, { recursive: true });
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean).find((p) => existsSync(p));
const PORT = 9355;
const browser = spawn(exe, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(OUT, 'profile')}`, '--window-size=1000,800', '--no-first-run', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const pending = new Map();
function send(m, p = {}) { const i = ++id; ws.send(JSON.stringify({ id: i, method: m, params: p })); return new Promise((res) => pending.set(i, res)); }
async function evaluate(expr) { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); return r.result?.value; }
async function shot(n) { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(OUT, n), Buffer.from(r.data, 'base64')); }

async function main() {
  let t;
  for (let i = 0; i < 40 && !t; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); t = l.find((x) => x.type === 'page'); } catch { await sleep(250); } }
  ws = new WebSocket(t.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? {}); pending.delete(m.id); } });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.navigate', { url: URL_ });
  for (let i = 0; i < 40; i++) { await sleep(400); if (await evaluate(`document.body.innerText.includes('Jugar')`)) break; }
  // Desbloquea y selecciona a Vegeta directamente en el store, con arte real.
  await evaluate(`(() => { const m = window.__meta.getState(); m.set({ ...m.meta, unlockedCharacters: [...new Set([...m.meta.unlockedCharacters, 'vegeta'])], selectedCharacter: 'vegeta' }); return 0; })()`);
  await sleep(600);
  await shot('menu_vegeta.png');
  const name = await evaluate(`window.__meta.getState().meta.selectedCharacter`);
  console.log('seleccionado:', name);
}
main().finally(() => { try { ws?.close(); } catch {} browser.kill(); process.exit(0); });
