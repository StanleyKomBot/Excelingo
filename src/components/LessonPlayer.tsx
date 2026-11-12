import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BookOpen, Download, Eye, EyeOff, FileSpreadsheet, Heart, Info, Star, Trophy, X } from 'lucide-react';
import { useState } from 'react';
import type { Day, Lesson } from '../data/types';
import { BADGES, type Reward } from '../lib/progress';
import { Companion, Zelli } from './Companion';
import { ExerciseView } from './ExerciseView';
import { Button, ProgressBar, Rich, SheetGrid, WORKBOOK_URL } from './ui';

type Phase = 'learn' | 'example' | 'quiz' | 'hearts' | 'excel' | 'reward';
const MAX_HEARTS = 3;

interface Props {
  day: Day;
  lesson: Lesson;
  lessonIndex: number;
  onComplete: (r: { firstTry: number; mistakes: number; excelDone: boolean }) => Reward;
  onExit: () => void;
  onNext: (() => void) | null;
}

export function LessonPlayer({ day, lesson, lessonIndex, onComplete, onExit, onNext }: Props) {
  const [phase, setPhase] = useState<Phase>('learn');
  const [queue, setQueue] = useState<number[]>(() => lesson.exercises.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [hearts, setHearts] = useState(MAX_HEARTS);
  const [wrongOnce, setWrongOnce] = useState<Set<number>>(new Set());
  const [solved, setSolved] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [excelDone, setExcelDone] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [reward, setReward] = useState<Reward | null>(null);
  const [confirmExit, setConfirmExit] = useState(false);

  const n = lesson.exercises.length;
  const progress = phase === 'learn' ? 5 : phase === 'example' ? 15 : phase === 'quiz' || phase === 'hearts' ? 20 + (solved / n) * 65 : phase === 'excel' ? 90 : 100;

  function answered(correct: boolean) {
    const idx = queue[pos];
    if (correct) {
      setSolved((s) => s + 1);
    } else {
      setMistakes((m) => m + 1);
      setWrongOnce((w) => new Set(w).add(idx));
      setQueue((q) => [...q, idx]); // später noch einmal
    }
    const nextHearts = correct ? hearts : hearts - 1;
    setHearts(nextHearts);
    const remaining = queue.length - (pos + 1) + (correct ? 0 : 1);
    setPos((p) => p + 1);
    if (remaining === 0) setPhase('excel');
    else if (nextHearts <= 0) setPhase('hearts');
  }

  function finish(done: boolean) {
    const firstTry = n - wrongOnce.size;
    setReward(onComplete({ firstTry, mistakes, excelDone: done }));
    setPhase('reward');
  }

  const leave = () => (phase === 'reward' || phase === 'learn' ? onExit() : setConfirmExit(true));

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col px-4 sm:px-6">
      {/* Kopfzeile */}
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-slate-50/95 py-4 backdrop-blur">
        <button onClick={leave} className="rounded-xl p-2 text-ink-400 hover:bg-slate-200" aria-label="Lektion verlassen">
          <X />
        </button>
        <ProgressBar value={progress} className="h-4" />
        <div className="flex items-center gap-1 font-extrabold text-berry-500" title="Herzen">
          {Array.from({ length: MAX_HEARTS }, (_, i) => (
            <Heart key={i} size={20} className={i < hearts ? 'fill-berry-500' : 'text-slate-300'} />
          ))}
        </div>
      </header>
      <p className="mb-3 text-sm font-bold text-ink-400">
        Tag {day.id} · Lektion {lessonIndex + 1}/{day.lessons.length} · {lesson.title}
      </p>

      <main className="flex flex-1 flex-col">
        <AnimatePresence mode="wait">
          <motion.div key={phase + pos} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }} className="flex flex-1 flex-col">
            {phase === 'learn' && (
              <Screen
                footer={
                  <Button className="w-full sm:w-auto" onClick={() => setPhase('example')}>
                    Weiter <ArrowRight size={18} />
                  </Button>
                }
              >
                <span className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider text-leaf-600">
                  <BookOpen size={14} /> Einführung & Erklärung
                </span>
                <h1 className="text-2xl font-black sm:text-3xl">{lesson.title}</h1>
                <Companion mood="happy">{lesson.intro}</Companion>
                <div className="space-y-3 rounded-3xl border-2 border-slate-200 bg-white p-5 text-[17px] leading-relaxed">
                  {lesson.explain.map((p, i) => (
                    <p key={i}>
                      <Rich text={p} />
                    </p>
                  ))}
                </div>
              </Screen>
            )}

            {phase === 'example' && (
              <Screen
                footer={
                  <>
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={() => setPhase('learn')}>
                      Zurück
                    </Button>
                    <Button className="w-full sm:w-auto" onClick={() => setPhase('quiz')}>
                      Jetzt üben <ArrowRight size={18} />
                    </Button>
                  </>
                }
              >
                <span className="text-xs font-extrabold uppercase tracking-wider text-sky2-600">Praxisbeispiel</span>
                <h2 className="text-2xl font-black">{lesson.example.title}</h2>
                {lesson.example.grid && <SheetGrid grid={lesson.example.grid} />}
                {lesson.example.steps && (
                  <ol className="space-y-2">
                    {lesson.example.steps.map((s, i) => (
                      <li key={i} className="flex items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white p-3 font-semibold">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-sky2-500 font-black text-white">{i + 1}</span>
                        {s}
                      </li>
                    ))}
                  </ol>
                )}
                {lesson.example.note && (
                  <p className="flex gap-2 rounded-2xl bg-sky-50 p-4 text-[15px] font-semibold text-sky2-600">
                    <Info className="shrink-0" size={20} />
                    <span>
                      <Rich text={lesson.example.note} />
                    </span>
                  </p>
                )}
              </Screen>
            )}

            {phase === 'quiz' && <ExerciseView key={pos} exercise={lesson.exercises[queue[pos]]} onDone={answered} retryNote />}

            {phase === 'hearts' && (
              <Screen
                footer={
                  <>
                    <Button
                      variant="secondary"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        setHearts(MAX_HEARTS);
                        setPhase('learn');
                      }}
                    >
                      Erklärung nochmal lesen
                    </Button>
                    <Button
                      className="w-full sm:w-auto"
                      onClick={() => {
                        setHearts(MAX_HEARTS);
                        setPhase('quiz');
                      }}
                    >
                      Weiter üben
                    </Button>
                  </>
                }
              >
                <div className="flex flex-col items-center gap-4 pt-8 text-center">
                  <Zelli mood="think" size={110} />
                  <h2 className="text-2xl font-black">Kurze Verschnaufpause!</h2>
                  <p className="max-w-md text-lg text-ink-600">
                    Deine Herzen sind aufgebraucht – das ist völlig okay. Fehler gehören zum Lernen. Ich fülle sie dir wieder auf. Willst du die Erklärung noch einmal lesen oder gleich weiterüben?
                  </p>
                  <p className="text-sm font-semibold text-ink-400">Dein bisheriger Fortschritt in dieser Lektion bleibt erhalten.</p>
                </div>
              </Screen>
            )}

            {phase === 'excel' && (
              <Screen
                footer={
                  <>
                    {!excelDone && (
                      <Button variant="secondary" className="w-full sm:w-auto" onClick={() => finish(false)}>
                        Später in Excel
                      </Button>
                    )}
                    <Button className="w-full sm:w-auto" disabled={!excelDone} onClick={() => finish(true)}>
                      Lektion abschließen
                    </Button>
                  </>
                }
              >
                <span className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider text-leaf-600">
                  <FileSpreadsheet size={14} /> Praktische Excel-Aufgabe
                </span>
                <h2 className="text-2xl font-black">Jetzt bist du in Excel dran!</h2>
                <div className="rounded-3xl border-2 border-leaf-400 bg-leaf-50 p-5">
                  <p className="text-lg font-bold">
                    Öffne dein Arbeitsbuch und wechsle zum Blatt <span className="rounded-lg bg-leaf-600 px-2 py-0.5 font-mono text-white">{lesson.excel.sheet}</span>
                  </p>
                  <p className="mt-1 font-semibold text-leaf-700">{lesson.excel.task}</p>
                  <ol className="mt-4 space-y-2">
                    {lesson.excel.steps.map((s, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white font-black text-leaf-600 ring-2 ring-leaf-400">{i + 1}</span>
                        <span className="pt-0.5">
                          <Rich text={s} />
                        </span>
                      </li>
                    ))}
                  </ol>
                  <a href={WORKBOOK_URL} download="Excel_Quest_Arbeitsbuch.xlsx" className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-leaf-700 underline">
                    <Download size={16} /> Arbeitsbuch noch nicht geladen? Hier herunterladen
                  </a>
                </div>

                <div className="rounded-3xl border-2 border-slate-200 bg-white p-5">
                  <button onClick={() => setShowSolution((v) => !v)} className="flex items-center gap-2 font-extrabold text-sky2-600">
                    {showSolution ? <EyeOff size={18} /> : <Eye size={18} />} {showSolution ? 'Lösung ausblenden' : 'Selbstcheck: Lösung anzeigen'}
                  </button>
                  {showSolution && (
                    <ul className="mt-3 space-y-1 font-mono text-[15px]">
                      {lesson.excel.solution.map((s, i) => (
                        <li key={i}>✓ {s}</li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-3 text-sm text-ink-400">
                    Hinweis: Die Website kann deine Excel-Datei nicht einsehen. Vergleiche dein Ergebnis selbst mit der Lösung – oder schau in die Spalte „Check“ im Arbeitsbuch.
                  </p>
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border-2 border-slate-200 bg-white p-4 font-bold">
                  <input type="checkbox" checked={excelDone} onChange={(e) => setExcelDone(e.target.checked)} className="h-6 w-6 accent-leaf-500" />
                  Ich habe die Aufgabe in Excel bearbeitet und mit der Lösung verglichen.
                </label>
              </Screen>
            )}

            {phase === 'reward' && reward && (
              <Screen
                footer={
                  <>
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={onExit}>
                      Zum Lernpfad
                    </Button>
                    {onNext && (
                      <Button className="w-full sm:w-auto" onClick={onNext}>
                        Nächste Lektion <ArrowRight size={18} />
                      </Button>
                    )}
                  </>
                }
              >
                <div className="flex flex-col items-center gap-4 pt-4 text-center">
                  <motion.div initial={{ scale: 0.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200 }}>
                    <Zelli mood="cheer" size={120} />
                  </motion.div>
                  <h2 className="text-3xl font-black text-leaf-600">Lektion geschafft!</h2>
                  {mistakes === 0 && <p className="font-bold text-ink-600">Ohne einen einzigen Fehler – wow!</p>}
                  <div className="w-full max-w-sm space-y-2 rounded-3xl border-2 border-sun-400 bg-sun-400/10 p-4 text-left">
                    {reward.items.length === 0 ? (
                      <p className="text-center font-semibold text-ink-600">Wiederholung – XP gibt es pro Lektion nur einmal. Üben lohnt sich trotzdem!</p>
                    ) : (
                      reward.items.map((it, i) => (
                        <div key={i} className="flex justify-between font-bold">
                          <span>{it.label}</span>
                          <span className="text-sun-500">+{it.xp} XP</span>
                        </div>
                      ))
                    )}
                    {reward.total > 0 && (
                      <div className="flex justify-between border-t-2 border-sun-400/40 pt-2 text-lg font-black">
                        <span>Gesamt</span>
                        <span className="flex items-center gap-1 text-sun-500">
                          <Star size={18} className="fill-sun-400" /> +{reward.total} XP
                        </span>
                      </div>
                    )}
                  </div>
                  {reward.levelUp && <p className="rounded-full bg-sky2-500 px-4 py-2 font-extrabold text-white">Neues Level: {reward.levelUp}!</p>}
                  {reward.badges.map((b) => {
                    const badge = BADGES.find((x) => x.id === b)!;
                    return (
                      <motion.p key={b} initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2 rounded-2xl bg-leaf-100 px-4 py-2 font-extrabold text-leaf-700">
                        <Trophy size={18} /> Neues Abzeichen: {badge.name}
                      </motion.p>
                    );
                  })}
                  {!excelDone && !reward.alreadyDone && <p className="text-sm text-ink-400">Die Excel-Aufgabe kannst du später nachholen – öffne die Lektion einfach noch einmal (+15 XP).</p>}
                </div>
              </Screen>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {confirmExit && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-sm space-y-4 rounded-3xl bg-white p-6 text-center">
            <Zelli mood="sad" size={72} />
            <h3 className="text-xl font-black">Lektion wirklich verlassen?</h3>
            <p className="text-ink-600">Diese Lektion wird nicht gespeichert. Alle bereits abgeschlossenen Lektionen bleiben natürlich erhalten.</p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => setConfirmExit(false)}>Weiterlernen</Button>
              <Button variant="ghost" onClick={onExit}>
                Verlassen
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Screen({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-5 pb-6">{children}</div>
      <div className="sticky bottom-0 -mx-4 flex flex-col-reverse gap-3 border-t-2 border-slate-200 bg-white px-4 py-4 sm:-mx-6 sm:flex-row sm:justify-end sm:px-6">{footer}</div>
    </div>
  );
}

export { Screen };
