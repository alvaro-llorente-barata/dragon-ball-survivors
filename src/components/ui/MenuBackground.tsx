/**
 * Fondo del menú principal: un paisaje estilo Dragon Ball dibujado por código
 * (SVG), sin imágenes externas. Cielo de atardecer, sol, nubes, cordillera en
 * capas, suelo y las 7 Bolas de Dragón flotando. Respeta "reducir movimiento".
 */
export function MenuBackground() {
  // Las 7 bolas, con su número de estrellas, repartidas por el cielo.
  const balls = [
    { x: 120, y: 90, r: 16, s: 1 },
    { x: 1080, y: 70, r: 18, s: 2 },
    { x: 300, y: 150, r: 13, s: 3 },
    { x: 900, y: 170, r: 14, s: 4 },
    { x: 620, y: 70, r: 15, s: 5 },
    { x: 470, y: 120, r: 12, s: 6 },
    { x: 780, y: 120, r: 13, s: 7 },
  ];
  const star = (cx: number, cy: number, r: number) => {
    const pts: string[] = [];
    for (let i = 0; i < 10; i++) {
      const ang = (Math.PI / 5) * i - Math.PI / 2;
      const rad = i % 2 === 0 ? r : r / 2.3;
      pts.push(`${cx + rad * Math.cos(ang)},${cy + rad * Math.sin(ang)}`);
    }
    return pts.join(' ');
  };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg className="h-full w-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3a2a6a" />
            <stop offset="35%" stopColor="#7a4a8a" />
            <stop offset="65%" stopColor="#f0864a" />
            <stop offset="100%" stopColor="#ffd06a" />
          </linearGradient>
          <radialGradient id="sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff6d0" />
            <stop offset="60%" stopColor="#ffd84a" />
            <stop offset="100%" stopColor="#ff9a3a" />
          </radialGradient>
          <radialGradient id="ballg" cx="35%" cy="30%" r="75%">
            <stop offset="0%" stopColor="#fff2cc" />
            <stop offset="45%" stopColor="#ff9a3a" />
            <stop offset="100%" stopColor="#d65a1a" />
          </radialGradient>
          <linearGradient id="m1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#5a3a7a" />
            <stop offset="100%" stopColor="#3a2456" />
          </linearGradient>
          <linearGradient id="m2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7a4a6a" />
            <stop offset="100%" stopColor="#5a2e4a" />
          </linearGradient>
          <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4a8a3a" />
            <stop offset="100%" stopColor="#2a5a24" />
          </linearGradient>
        </defs>

        {/* Cielo */}
        <rect x="0" y="0" width="1200" height="800" fill="url(#sky)" />

        {/* Sol */}
        <circle cx="600" cy="300" r="140" fill="url(#sun)" opacity="0.95" />
        <circle cx="600" cy="300" r="180" fill="#ffd84a" opacity="0.12" />

        {/* Nubes */}
        <g fill="#ffe3c0" opacity="0.5">
          <ellipse cx="240" cy="250" rx="90" ry="22" />
          <ellipse cx="320" cy="258" rx="70" ry="18" />
          <ellipse cx="960" cy="230" rx="100" ry="24" />
          <ellipse cx="1040" cy="240" rx="70" ry="18" />
        </g>

        {/* Montañas lejanas */}
        <path d="M0 520 L160 380 L320 500 L480 360 L640 500 L820 370 L1000 500 L1200 400 L1200 800 L0 800 Z" fill="url(#m1)" opacity="0.9" />
        {/* Montañas cercanas */}
        <path d="M0 620 L220 460 L420 600 L640 450 L880 600 L1100 480 L1200 560 L1200 800 L0 800 Z" fill="url(#m2)" />
        {/* Suelo */}
        <path d="M0 640 Q300 600 600 640 T1200 640 L1200 800 L0 800 Z" fill="url(#ground)" />

        {/* Bolas de Dragón */}
        {balls.map((b, i) => (
          <g key={i} className="db-float" style={{ animationDelay: `${i * 0.35}s` }}>
            <circle cx={b.x} cy={b.y} r={b.r + 6} fill="#ffd84a" opacity="0.18" />
            <circle cx={b.x} cy={b.y} r={b.r} fill="url(#ballg)" />
            <circle cx={b.x - b.r * 0.35} cy={b.y - b.r * 0.4} r={b.r * 0.28} fill="#ffffff" opacity="0.7" />
            {Array.from({ length: b.s }).map((_, k) => {
              const a = (Math.PI * 2 * k) / b.s - Math.PI / 2;
              const rr = b.s === 1 ? 0 : b.r * 0.42;
              return <polygon key={k} points={star(b.x + rr * Math.cos(a), b.y + rr * Math.sin(a), b.r * 0.2)} fill="#d8341a" />;
            })}
          </g>
        ))}
      </svg>
    </div>
  );
}
