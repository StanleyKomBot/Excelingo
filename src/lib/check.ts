import type { Exercise } from '../data/types';

/** Zahl aus deutscher oder englischer Schreibweise lesen: "1.398,50 €", "1398.5", "25 %". */
export function parseNumber(input: string): number | null {
  let s = input.replace(/[€%\s ]/g, '').replace(/euro/i, '');
  if (!s) return null;
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.includes(',')) s = s.replace(',', '.');
  else if (/^[1-9]\d{0,2}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ''); // 1.398 → 1398
  if (!/^-?\d*\.?\d+$/.test(s)) return null;
  return Number(s);
}

const normFormula = (s: string) => s.replace(/\s+/g, '').toUpperCase().replace(/,/g, ';');

export function checkInput(ex: Extract<Exercise, { kind: 'input' }>, value: string): boolean {
  if (ex.numeric) {
    const n = parseNumber(value);
    if (n === null) return false;
    const tol = ex.tolerance ?? 0.005;
    return ex.numeric.some((t) => Math.abs(n - t) <= tol + 1e-9 || (ex.percent && Math.abs(n * 100 - t) <= tol + 1e-9));
  }
  let v = normFormula(value);
  if (ex.prefix) {
    const p = normFormula(ex.prefix);
    if (v.startsWith(p)) v = v.slice(p.length); // ganze Formel eingetippt
  }
  return (ex.answers ?? []).some((a) => normFormula(a) === v);
}
