import { AnimatePresence, motion } from 'framer-motion';
import { Check, Lightbulb, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { Exercise } from '../data/types';
import { checkInput } from '../lib/check';
import { Zelli } from './Companion';
import { Button, Rich, SheetGrid } from './ui';

const LABEL: Record<Exercise['kind'], string> = { choice: 'Multiple Choice', truefalse: 'Richtig oder falsch', input: 'Rechnen', match: 'Zuordnen' };

const PRAISE = ['Super gemacht!', 'Genau richtig!', 'Klasse!', 'Stark!', 'Perfekt!'];
const COMFORT = ['Nicht ganz – kein Problem!', 'Fast! Schau dir die Erklärung an.', 'Fehler sind zum Lernen da.'];

function shuffle<T>(a: T[]): T[] {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [r[i], r[j]] = [r[j], r[i]];
  }
  return r;
}

interface Props {
  exercise: Exercise;
  /** Wird nach „Weiter“ aufgerufen. */
  onDone: (correct: boolean) => void;
  /** Im Lektionsmodus kommt eine falsche Frage später erneut. */
  retryNote?: boolean;
}

export function ExerciseView({ exercise: ex, onDone, retryNote }: Props) {
  const [choice, setChoice] = useState<number | null>(null);
  const [tf, setTf] = useState<boolean | null>(null);
  const [text, setText] = useState('');
  const [pairs, setPairs] = useState<Record<number, number>>({}); // linker Index → rechter Index (Original)
  const [leftSel, setLeftSel] = useState<number | null>(null);
  const [result, setResult] = useState<boolean | null>(null);
  const [showHint, setShowHint] = useState(false);
  const rightOrder = useMemo(() => (ex.kind === 'match' ? shuffle(ex.pairs.map((_, i) => i)) : []), [ex]);
  const msg = useMemo(() => Math.floor(Math.random() * 5), [ex]);

  const ready =
    ex.kind === 'choice' ? choice !== null : ex.kind === 'truefalse' ? tf !== null : ex.kind === 'input' ? text.trim() !== '' : Object.keys(pairs).length === ex.pairs.length;

  function check() {
    if (!ready || result !== null) return;
    let ok = false;
    if (ex.kind === 'choice') ok = choice === ex.correct;
    if (ex.kind === 'truefalse') ok = tf === ex.correct;
    if (ex.kind === 'input') ok = checkInput(ex, text);
    if (ex.kind === 'match') ok = ex.pairs.every((_, i) => pairs[i] === i);
    setResult(ok);
  }

  const locked = result !== null;
  const question = ex.kind === 'truefalse' ? ex.statement : ex.question;

  function pickRight(ri: number) {
    if (locked) return;
    const owner = Object.entries(pairs).find(([, v]) => v === ri)?.[0];
    if (leftSel === null) {
      if (owner !== undefined) {
        const next = { ...pairs };
        delete next[Number(owner)];
        setPairs(next);
      }
      return;
    }
    const next = { ...pairs };
    if (owner !== undefined) delete next[Number(owner)];
    next[leftSel] = ri;
    setPairs(next);
    setLeftSel(null);
  }

  const PAIR_COLORS = ['bg-sky2-500', 'bg-sun-500', 'bg-purple-500', 'bg-orange-500'];

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-5 pb-4">
        <span className="inline-block rounded-full bg-sky2-500/10 px-3 py-1 text-xs font-extrabold uppercase tracking-wider text-sky2-600">
          {ex.label ?? LABEL[ex.kind]}
        </span>
        <h2 className="text-xl font-extrabold leading-snug sm:text-2xl">
          {ex.kind === 'truefalse' && <span className="block text-base font-bold text-ink-600">Stimmt diese Aussage?</span>}
          <Rich text={question} />
        </h2>
        {ex.grid && <SheetGrid grid={ex.grid} />}

        {ex.kind === 'choice' && (
          <div className="grid gap-3 sm:grid-cols-2">
            {ex.options.map((o, i) => {
              const sel = choice === i;
              const state = locked && i === ex.correct ? 'border-leaf-500 bg-leaf-50' : locked && sel ? 'border-berry-500 bg-red-50' : sel ? 'border-sky2-500 bg-sky-50' : 'border-slate-200 bg-white hover:bg-slate-50';
              return (
                <button
                  key={i}
                  disabled={locked}
                  onClick={() => setChoice(i)}
                  className={`flex min-h-[56px] items-center gap-3 rounded-2xl border-2 border-b-4 px-4 py-3 text-left font-bold transition ${state}`}
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 border-slate-200 text-sm text-ink-400">{i + 1}</span>
                  <span data-option className={o.startsWith('=') ? 'font-mono' : ''}>{o}</span>
                </button>
              );
            })}
          </div>
        )}

        {ex.kind === 'truefalse' && (
          <div className="grid grid-cols-2 gap-3">
            {[true, false].map((v) => {
              const sel = tf === v;
              const state = locked && v === ex.correct ? 'border-leaf-500 bg-leaf-50' : locked && sel ? 'border-berry-500 bg-red-50' : sel ? 'border-sky2-500 bg-sky-50' : 'border-slate-200 bg-white hover:bg-slate-50';
              return (
                <button key={String(v)} disabled={locked} onClick={() => setTf(v)} className={`flex min-h-[72px] items-center justify-center gap-2 rounded-2xl border-2 border-b-4 text-lg font-extrabold transition ${state}`}>
                  {v ? <Check className="text-leaf-500" /> : <X className="text-berry-500" />} {v ? 'Richtig' : 'Falsch'}
                </button>
              );
            })}
          </div>
        )}

        {ex.kind === 'input' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              check();
            }}
            className="flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white p-2 focus-within:border-sky2-500"
          >
            {ex.prefix && <span className="pl-2 font-mono text-lg font-bold text-leaf-700">{ex.prefix}</span>}
            <input
              autoFocus
              disabled={locked}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={ex.placeholder ?? (ex.numeric ? 'Deine Antwort' : '')}
              inputMode={ex.numeric ? 'decimal' : 'text'}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label="Antwort"
              className={`min-w-0 flex-1 bg-transparent px-2 py-2 text-lg font-bold outline-none ${ex.numeric ? '' : 'font-mono'}`}
            />
            {ex.unit && <span className="pr-2 font-bold text-ink-400">{ex.unit}</span>}
          </form>
        )}
        {ex.kind === 'input' && ex.numeric && <p className="text-sm text-ink-400">Tipp: Komma oder Punkt sind beide ok, z. B. 3,25.</p>}

        {ex.kind === 'match' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              {ex.pairs.map(([l], i) => {
                const paired = pairs[i] !== undefined;
                const wrong = locked && pairs[i] !== i;
                return (
                  <button
                    key={i}
                    disabled={locked}
                    onClick={() => setLeftSel(leftSel === i ? null : i)}
                    className={`flex min-h-[56px] w-full items-center gap-2 rounded-2xl border-2 border-b-4 px-3 py-2 text-left text-sm font-bold sm:text-base ${
                      locked ? (wrong ? 'border-berry-500 bg-red-50' : 'border-leaf-500 bg-leaf-50') : leftSel === i ? 'border-sky2-500 bg-sky-50' : 'border-slate-200 bg-white'
                    }`}
                  >
                    {paired && <span className={`h-3 w-3 shrink-0 rounded-full ${PAIR_COLORS[i % 4]}`} />}
                    {l}
                  </button>
                );
              })}
            </div>
            <div className="space-y-2">
              {rightOrder.map((ri) => {
                const owner = Object.entries(pairs).find(([, v]) => v === ri)?.[0];
                return (
                  <button
                    key={ri}
                    disabled={locked}
                    onClick={() => pickRight(ri)}
                    className={`flex min-h-[56px] w-full items-center gap-2 rounded-2xl border-2 border-b-4 px-3 py-2 text-left text-sm font-semibold sm:text-base ${
                      owner !== undefined ? 'border-slate-300 bg-slate-50' : leftSel !== null ? 'border-sky2-400 bg-white' : 'border-slate-200 bg-white'
                    }`}
                  >
                    {owner !== undefined && <span className={`h-3 w-3 shrink-0 rounded-full ${PAIR_COLORS[Number(owner) % 4]}`} />}
                    {ex.pairs[ri][1]}
                  </button>
                );
              })}
            </div>
            <p className="col-span-2 text-sm text-ink-400">Tippe links auf einen Begriff und dann rechts auf die passende Beschreibung.</p>
          </div>
        )}

        {ex.hint && !locked && (
          <div>
            {showHint ? (
              <div className="flex items-start gap-2 rounded-2xl bg-sun-400/20 p-3 text-sm font-semibold">
                <Zelli mood="think" size={36} /> <span className="pt-2">{ex.hint}</span>
              </div>
            ) : (
              <button onClick={() => setShowHint(true)} className="inline-flex items-center gap-1 text-sm font-bold text-sky2-600 hover:underline">
                <Lightbulb size={16} /> Tipp von Zelli
              </button>
            )}
          </div>
        )}
      </div>

      {/* Fußleiste mit Feedback */}
      <div className="sticky bottom-0 -mx-4 sm:-mx-6">
        <AnimatePresence mode="wait">
          {result === null ? (
            <motion.div key="check" className="border-t-2 border-slate-200 bg-white px-4 py-4 sm:px-6">
              <Button className="w-full sm:float-right sm:w-auto" disabled={!ready} onClick={check}>
                Prüfen
              </Button>
              <div className="clear-both" />
            </motion.div>
          ) : (
            <motion.div
              key="fb"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className={`border-t-2 px-4 py-4 sm:px-6 ${result ? 'border-leaf-400 bg-leaf-100' : 'border-red-300 bg-red-100'}`}
              role="status"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-start gap-3">
                  <Zelli mood={result ? 'cheer' : 'sad'} size={48} />
                  <div>
                    <p className={`text-lg font-extrabold ${result ? 'text-leaf-700' : 'text-red-700'}`}>{result ? PRAISE[msg] : COMFORT[msg % 3]}</p>
                    {!result && ex.kind === 'input' && (
                      <p className="text-sm font-bold text-red-700">
                        Richtige Antwort: {ex.prefix ?? ''}
                        {ex.answers?.[0] ?? ex.numeric?.[0].toLocaleString('de-AT')}
                        {ex.unit && ex.numeric ? ` ${ex.unit}` : ''}
                      </p>
                    )}
                    <p className={`text-[15px] ${result ? 'text-leaf-700' : 'text-red-800'}`}>
                      <Rich text={ex.explanation} />
                    </p>
                    {!result && retryNote && <p className="mt-1 text-sm font-semibold text-red-700">Diese Frage kommt gleich noch einmal.</p>}
                  </div>
                </div>
                <Button variant={result ? 'primary' : 'danger'} className="w-full shrink-0 sm:w-auto" onClick={() => onDone(result)} autoFocus>
                  Weiter
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
