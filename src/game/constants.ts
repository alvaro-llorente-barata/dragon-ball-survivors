export const DEPTH = {
  ground: 0,
  decal: 5,
  pickup: 20,
  telegraph: 30,
  /**
   * entidades: ENTITY + y para ordenar por profundidad. El mapa es infinito y la y puede ser
   * negativa, así que la base es muy alta para quedar siempre por encima del suelo.
   */
  entity: 10_000_000,
  effect: 30_000_000,
  text: 40_000_000,
} as const;

export const MAX_ENEMIES_POOL = 420;
export const MAX_SHOTS_POOL = 320;
export const MAX_ENEMY_BULLETS = 300;
export const MAX_GEMS = 500;
