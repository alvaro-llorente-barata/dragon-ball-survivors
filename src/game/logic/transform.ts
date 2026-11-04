import type { CharacterDef, FormDef } from '../../data/types';
import type { RunState } from './run';

/** Transformaciones temporales dentro de la partida (tecla E). Independientes de las versiones del gacha. */

export function currentForm(char: CharacterDef, run: RunState): FormDef | null {
  if (!run.formId) return null;
  return char.transformations?.find((f) => f.id === run.formId) ?? null;
}

export interface FormCheck {
  form: FormDef;
  ready: boolean;
  reason: string;
}

export function nextForm(char: CharacterDef, run: RunState): FormCheck | null {
  const forms = char.transformations ?? [];
  const idx = run.formId ? forms.findIndex((f) => f.id === run.formId) : -1;
  const form = forms[idx + 1];
  if (!form) return null;
  if (run.level < form.minLevel) return { form, ready: false, reason: `Necesitas nivel ${form.minLevel}` };
  if (run.ki < form.kiCost) return { form, ready: false, reason: `Necesitas ${form.kiCost} de Ki` };
  return { form, ready: true, reason: 'Pulsa E' };
}

export function tryTransform(char: CharacterDef, run: RunState): FormDef | null {
  const c = nextForm(char, run);
  if (!c || !c.ready) return null;
  run.ki -= c.form.kiCost;
  run.formId = c.form.id;
  return c.form;
}

/** Gasta Ki de la forma activa. Devuelve true si se acabó y se vuelve a la base. */
export function drainForm(char: CharacterDef, run: RunState, dt: number): boolean {
  const f = currentForm(char, run);
  if (!f) return false;
  run.ki -= f.kiDrain * dt;
  if (run.ki <= 0) {
    run.ki = 0;
    run.formId = '';
    return true;
  }
  return false;
}
