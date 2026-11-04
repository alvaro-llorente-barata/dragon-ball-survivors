# Dragon Ball Survivors (fan game)

Juego de supervivencia gratuito y no oficial. Sin anuncios ni pagos.

## Empezar

```bash
npm install
npm run dev        # http://127.0.0.1:5173
npm test           # pruebas de lógica (Vitest)
npm run smoke      # prueba en navegador real (con `npm run dev` abierto)
npm run build      # salida en dist/ (Netlify: netlify.toml; Vercel: detecta Vite)
```

## Controles

WASD/flechas mover · Espacio teletransporte · Q Genkidama · E transformación · Esc pausa · 1-3 elegir mejora.
En móvil: joystick (mitad izquierda) y botones táctiles.

## Estructura

- `src/data` datos puros (personajes, ataques, enemigos, jefes, mapas, objetos).
- `src/game/logic` reglas puras y testeadas (mapas, botín, stats, transformaciones, mejoras).
- `src/game/systems`, `scenes`, `entities`, `world` motor Phaser.
- `src/components`, `src/pages` menús React + Tailwind. `src/stores` Zustand.
- `src/services` guardado IndexedDB, economía, progresión, audio Web Audio.

## Arte y licencias

No existen sprites de Dragon Ball con licencia libre. Todo el arte y el sonido se generan por código (originales).
Para cambiar un sprite, ver `src/assets/manifest.ts`.

Estado de las fases: ver `ROADMAP.md`.
