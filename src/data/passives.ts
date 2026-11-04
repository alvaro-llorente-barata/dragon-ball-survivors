import type { PassiveDef } from './types';

/**
 * Cartas pasivas. Algunas son necesarias para evolucionar ataques
 * (ver `evolution.passive` en src/data/attacks).
 */
export const PASSIVES: Record<string, PassiveDef> = {
  power: { id: 'power', name: 'Potencia', description: '+8% de daño', maxLevel: 5, perLevel: { damage: 0.08 } },
  focus: { id: 'focus', name: 'Reflejos', description: '-6% de recarga', maxLevel: 5, perLevel: { cooldown: 0.06 } },
  vitality: { id: 'vitality', name: 'Vigor', description: '+12% de vida máxima', maxLevel: 5, perLevel: { maxHp: 0.12 } },
  speed: { id: 'speed', name: 'Carrera', description: '+7% de velocidad', maxLevel: 5, perLevel: { moveSpeed: 0.07 } },
  armor: { id: 'armor', name: 'Coraza', description: '+7 de defensa', maxLevel: 5, perLevel: { defense: 7 } },
  ki_flow: { id: 'ki_flow', name: 'Concentración', description: '+30% de regeneración de Ki', maxLevel: 5, perLevel: { kiRegen: 0.3 } },
  sense: { id: 'sense', name: 'Imán', description: '+30% de radio de recogida', maxLevel: 5, perLevel: { magnet: 0.3 } },
  ki_control: { id: 'ki_control', name: 'Control de Ki', description: '+10% de daño de energía', maxLevel: 5, perLevel: { energy: 0.1 } },
  combat: { id: 'combat', name: 'Combate', description: '+10% de daño físico', maxLevel: 5, perLevel: { physical: 0.1 } },
  regen: { id: 'regen', name: 'Regeneración', description: 'Recupera 0,25% de vida por segundo', maxLevel: 5, perLevel: { regen: 0.0025 } },
  area: { id: 'area', name: 'Expansión de Ki', description: '+10% de tamaño de ataques', maxLevel: 5, perLevel: { area: 0.1 } },
  instinct: { id: 'instinct', name: 'Instinto', description: '+5% de golpe crítico', maxLevel: 5, perLevel: { crit: 0.05 } },
  afterimage: { id: 'afterimage', name: 'Imagen residual', description: '+1 proyectil en ataques de disparo', maxLevel: 2, perLevel: { amount: 1 } },
  growth: { id: 'growth', name: 'Crecimiento Saiyan', description: '+8% de experiencia', maxLevel: 5, perLevel: { xp: 0.08 } },
};
