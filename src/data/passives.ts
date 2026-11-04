import type { PassiveDef } from './types';

export const PASSIVES: Record<string, PassiveDef> = {
  power: { id: 'power', name: 'Entrenamiento de fuerza', description: '+10% de daño', maxLevel: 5, perLevel: { damage: 0.1 } },
  speed: { id: 'speed', name: 'Ropa con pesas', description: '+8% de velocidad', maxLevel: 5, perLevel: { moveSpeed: 0.08 } },
  focus: { id: 'focus', name: 'Concentración', description: '-7% de recarga', maxLevel: 5, perLevel: { cooldown: 0.07 } },
  area: { id: 'area', name: 'Expansión de Ki', description: '+12% de tamaño de ataques', maxLevel: 5, perLevel: { area: 0.12 } },
  vitality: { id: 'vitality', name: 'Cuerpo de guerrero', description: '+15% de vida máxima', maxLevel: 5, perLevel: { maxHp: 0.15 } },
  ki_flow: { id: 'ki_flow', name: 'Flujo de Ki', description: '+30% de regeneración de Ki', maxLevel: 5, perLevel: { kiRegen: 0.3 } },
  instinct: { id: 'instinct', name: 'Instinto de combate', description: '+5% de golpe crítico', maxLevel: 5, perLevel: { crit: 0.05 } },
  sense: { id: 'sense', name: 'Percepción de Ki', description: '+30% de radio de recogida', maxLevel: 5, perLevel: { magnet: 0.3 } },
  afterimage: { id: 'afterimage', name: 'Imagen residual', description: '+1 proyectil en ataques de disparo', maxLevel: 2, perLevel: { amount: 1 } },
  armor: { id: 'armor', name: 'Armadura Saiyan', description: '+8 de defensa', maxLevel: 5, perLevel: { defense: 8 } },
  growth: { id: 'growth', name: 'Crecimiento Saiyan', description: '+10% de experiencia', maxLevel: 5, perLevel: { xp: 0.1 } },
};
