import { Fragment, type ButtonHTMLAttributes, type ReactNode } from 'react';
import type { Grid } from '../data/types';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'blue';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-leaf-500 text-white shadow-[0_4px_0_0_#15803d] hover:bg-leaf-400 active:shadow-none active:translate-y-1',
  blue: 'bg-sky2-500 text-white shadow-[0_4px_0_0_#0369a1] hover:bg-sky2-400 active:shadow-none active:translate-y-1',
  danger: 'bg-berry-500 text-white shadow-[0_4px_0_0_#b91c1c] hover:bg-berry-400 active:shadow-none active:translate-y-1',
  secondary: 'bg-white text-ink-900 border-2 border-slate-200 shadow-[0_4px_0_0_#e2e8f0] hover:bg-slate-50 active:shadow-none active:translate-y-1',
  ghost: 'text-ink-600 hover:bg-slate-100',
};

export function Button({ variant = 'primary', className = '', children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={`inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-extrabold uppercase tracking-wide transition disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none disabled:translate-y-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-sky2-400/50 ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

export function ProgressBar({ value, color = 'bg-leaf-500', className = '' }: { value: number; color?: string; className?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-3 w-full overflow-hidden rounded-full bg-slate-200 ${className}`} role="progressbar" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${v}%` }} />
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-3xl border-2 border-slate-200 bg-white p-5 ${className}`}>{children}</div>;
}

/** Minimaler Formatierer: **fett** und `code`. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') ? (
          <strong key={i} className="font-extrabold">
            {p.slice(2, -2)}
          </strong>
        ) : p.startsWith('`') ? (
          <code key={i}>{p.slice(1, -1)}</code>
        ) : p.startsWith('*') && p.length > 2 ? (
          <em key={i}>{p.slice(1, -1)}</em>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  );
}

const isNum = (s: string) => /^[-\d.,\s]+(€|%)?$/.test(s.trim()) || s.trim() === '####';

/** Mini-Tabellenblatt im Excel-Look mit Spaltenbuchstaben und Zeilennummern. */
export function SheetGrid({ grid }: { grid: Grid }) {
  const cols = Math.max(...grid.rows.map((r) => r.length));
  const start = grid.startRow ?? 1;
  const letters = Array.from({ length: cols }, (_, i) => String.fromCharCode(65 + i));
  return (
    <div className="overflow-x-auto rounded-xl border-2 border-slate-200 bg-white text-sm">
      {grid.formula && (
        <div className="flex items-center gap-2 border-b-2 border-slate-200 bg-slate-50 px-3 py-1.5 font-mono">
          <span className="font-sans text-xs font-bold italic text-ink-400">fx</span>
          <span className="text-leaf-700">{grid.formula}</span>
        </div>
      )}
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-8 border border-slate-200 bg-slate-100" />
            {letters.map((l) => (
              <th key={l} className="border border-slate-200 bg-slate-100 px-2 py-1 text-xs font-bold text-ink-600">
                {l}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {grid.rows.map((row, r) => (
            <tr key={r}>
              <td className="border border-slate-200 bg-slate-100 px-2 text-center text-xs font-bold text-ink-600">{start + r}</td>
              {letters.map((l, c) => {
                const v = row[c] ?? '';
                const addr = `${l}${start + r}`;
                const hl = grid.highlight?.includes(addr);
                const head = grid.headerRow && r === 0;
                return (
                  <td
                    key={addr}
                    className={`whitespace-nowrap border border-slate-200 px-2 py-1.5 ${head ? 'bg-leaf-600 font-bold text-white' : ''} ${isNum(v) && !head ? 'text-right tabular-nums' : ''} ${
                      hl ? 'outline outline-[3px] -outline-offset-2 outline-leaf-500 bg-leaf-50' : ''
                    }`}
                  >
                    {v}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const WORKBOOK_URL = `${import.meta.env.BASE_URL}Excel_Quest_Arbeitsbuch.xlsx`;
