import { BOSSES } from '../../data/bosses';
import type { CharacterDef, TransformationDef } from '../../data/types';
import type { RunState } from './run';

export interface FormCheck {
  form: TransformationDef;
  ready: boolean;
  reason: string;
}

/** Siguiente transformación de la cadena y si se puede activar ahora. */
export function nextForm(char: CharacterDef, run: RunState, everDefeated: readonly string[]): FormCheck | null {
  const forms = char.transformations;
  const idx = forms.findIndex((f) => f.id === run.formId);
  const form = forms[idx + 1];
  if (!form) return null;
  if (form.requiresBossEver && !everDefeated.includes(form.requiresBossEver)) {
    const bossName = BOSSES[form.requiresBossEver]?.name ?? form.requiresBossEver;
    return { form, ready: false, reason: `Bloqueada: vence a ${bossName} alguna vez` };
  }
  if (run.level < form.minLevel) {
    return { form, ready: false, reason: `Necesitas nivel ${form.minLevel}` };
  }
  if (run.ki < form.kiCost) {
    return { form, ready: false, reason: `Necesitas ${form.kiCost} de Ki` };
  }
  return { form, ready: true, reason: 'Pulsa E' };
}

/** Intenta transformarse. Devuelve la forma nueva o null si no se puede. */
export function tryTransform(char: CharacterDef, run: RunState, everDefeated: readonly string[]): TransformationDef | null {
  const check = nextForm(char, run, everDefeated);
  if (!check || !check.ready) return null;
  run.ki -= check.form.kiCost;
  run.formId = check.form.id;
  return check.form;
}

/**
 * Consume Ki de la forma actual. Si se acaba el Ki, vuelve a la forma base.
 * Devuelve true si la transformación terminó en este paso.
 */
export function drainForm(char: CharacterDef, run: RunState, dt: number): boolean {
  const form = char.transformations.find((f) => f.id === run.formId);
  if (!form || form.kiDrain <= 0) return false;
  run.ki -= form.kiDrain * dt;
  if (run.ki <= 0) {
    run.ki = 0;
    run.formId = char.transformations[0].id;
    return true;
  }
  return false;
}
