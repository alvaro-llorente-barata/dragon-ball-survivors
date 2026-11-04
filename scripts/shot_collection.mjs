// Captura de la pantalla de Colección para revisar los sprites en los menús.
// Uso: node scripts/shot_collection.mjs <URL> <carpeta_salida>
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const URL_ = process.argv[2] ?? 'http://127.0.0.1:5174/';
const OUT = process.argv[3] ?? '.';
mkdirSync(OUT, { recursive: true });
const exe = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean).find((p) => existsSync(p));
if (!exe) throw new Error('No Chrome/Edge');

const PORT = 9344;
const browser = spawn(exe, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${join(OUT, 'profile')}`, '--window-size=1280,900', '--no-first-run', '--mute-audio', 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let ws, id = 0; const pending = new Map();
function send(method, params = {}) { const i = ++id; ws.send(JSON.stringify({ id: i, method, params })); return new Promise((res) => pending.set(i, res)); }
async function evaluate(expr) { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); return r.result?.value; }
const clickText = (t) => evaluate(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes(${JSON.stringify(t)})); if(b)b.click(); return !!b; })()`);
async function shot(name) { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(OUT, name), Buffer.from(r.data, 'base64')); }

async function main() {
  let target;
  for (let i = 0; i < 40 && !target; i++) { try { const l = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); target = l.find((t) => t.type === 'page'); } catch { await sleep(250); } }
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result ?? {}); pending.delete(m.id); } });
  await send('Runtime.enable'); await send('Page.enable');
  await send('Page.navigate', { url: URL_ });
  for (let i = 0; i < 40; i++) { await sleep(400); if (await evaluate(`document.body.innerText.includes('Jugar')`)) break; }
  await clickText('Jugar');          // va a la pantalla de colección/selección
  await sleep(2500);
  await shot('collection.png');
  // también damos a Invocar para ver esa pantalla
  await clickText('Invocar');
  await sleep(1500);
  await shot('summon.png');
  console.log('listo');
}
main().finally(() => { try { ws?.close(); } catch {} browser.kill(); process.exit(0); });
