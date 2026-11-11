import { motion } from 'framer-motion';
import { Award, Check, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';
import { DAYS, EXAM, EXAM_PASS } from '../data/course';
import type { Reward } from '../lib/progress';
import { Companion, Zelli } from './Companion';
import { ExerciseView } from './ExerciseView';
import { Screen } from './LessonPlayer';
import { Button, ProgressBar, Rich } from './ui';

interface Props {
  onFinish: (score: number) => Reward;
  onExit: () => void;
  onCertificate: () => void;
}

export function ExamPlayer({ onFinish, onExit, onCertificate }: Props) {
  const [started, setStarted] = useState(false);
  const [pos, setPos] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [reward, setReward] = useState<Reward | null>(null);
  const [run, setRun] = useState(0);

  const done = answers.length === EXAM.length;
  const score = answers.filter(Boolean).length;
  const passed = score >= EXAM_PASS;

  function answered(ok: boolean) {
    const next = [...answers, ok];
    setAnswers(next);
    if (next.length === EXAM.length) setReward(onFinish(next.filter(Boolean).length));
    else setPos((p) => p + 1);
  }

  function restart() {
    setAnswers([]);
    setPos(0);
    setReward(null);
    setRun((r) => r + 1);
  }

  const wrongDays = [...new Set(EXAM.filter((_, i) => answers[i] === false).map((q) => q.day))].sort();

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-3xl flex-col px-4 sm:px-6">
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-slate-50/95 py-4 backdrop-blur">
        <button onClick={onExit} className="rounded-xl p-2 text-ink-400 hover:bg-slate-200" aria-label="Prüfung verlassen">
          <X />
        </button>
        <ProgressBar value={(answers.length / EXAM.length) * 100} color="bg-sun-400" className="h-4" />
        <span className="whitespace-nowrap font-extrabold text-ink-600">
          {Math.min(answers.length + 1, EXAM.length)}/{EXAM.length}
        </span>
      </header>

      <main className="flex flex-1 flex-col">
        {!started ? (
          <Screen
            footer={
              <Button className="w-full sm:w-auto" onClick={() => setStarted(true)}>
                Prüfung starten
              </Button>
            }
          >
            <h1 className="text-3xl font-black">Abschlussprüfung</h1>
            <Companion mood="cheer">Zehn gemischte Fragen aus allen sieben Tagen. Du bekommst nach jeder Frage sofort Feedback. Ab {EXAM_PASS} richtigen Antworten gibt’s dein Zertifikat!</Companion>
            <ul className="space-y-2 rounded-3xl border-2 border-slate-200 bg-white p-5 font-semibold">
              <li>📝 10 Fragen: Grundlagen, Formatierung, Formeln, Funktionen, Prozente, Gastro-Kalkulation</li>
              <li>🎯 Bestanden ab {EXAM_PASS} von 10 richtigen Antworten</li>
              <li>🔁 Du kannst die Prüfung beliebig oft wiederholen</li>
              <li>⏱️ Dauer: ca. 10 Minuten · Taschenrechner erlaubt</li>
            </ul>
          </Screen>
        ) : !done ? (
          <ExerciseView key={`${run}-${pos}`} exercise={EXAM[pos].exercise} onDone={answered} />
        ) : (
          <Screen
            footer={
              <>
                <Button variant="secondary" className="w-full sm:w-auto" onClick={restart}>
                  <RotateCcw size={18} /> Nochmal versuchen
                </Button>
                {passed ? (
                  <Button className="w-full sm:w-auto" onClick={onCertificate}>
                    <Award size={18} /> Zertifikat ansehen
                  </Button>
                ) : (
                  <Button className="w-full sm:w-auto" onClick={onExit}>
                    Zum Lernpfad
                  </Button>
                )}
              </>
            }
          >
            <div className="flex flex-col items-center gap-3 pt-2 text-center">
              <motion.div initial={{ scale: 0.6 }} animate={{ scale: 1 }}>
                <Zelli mood={passed ? 'cheer' : 'think'} size={100} />
              </motion.div>
              <h1 className="text-3xl font-black">{passed ? 'Bestanden – gratuliere!' : 'Noch nicht ganz geschafft'}</h1>
              <p className="text-5xl font-black text-leaf-600">
                {score}
                <span className="text-2xl text-ink-400"> / {EXAM.length}</span>
              </p>
              <div className="flex gap-3 font-bold">
                <span className="rounded-full bg-leaf-100 px-3 py-1 text-leaf-700">✓ {score} richtig</span>
                <span className="rounded-full bg-red-100 px-3 py-1 text-red-700">✗ {EXAM.length - score} falsch</span>
              </div>
              {reward && reward.total > 0 && <p className="font-extrabold text-sun-500">+{reward.total} XP</p>}
              {!passed && <p className="max-w-md text-ink-600">Du brauchst {EXAM_PASS} richtige Antworten. Wiederhole die empfohlenen Kapitel und versuch es dann noch einmal – du schaffst das!</p>}
            </div>

            {wrongDays.length > 0 && (
              <div className="rounded-3xl border-2 border-sun-400 bg-sun-400/10 p-5">
                <h3 className="mb-2 font-black">Empfehlung zum Wiederholen</h3>
                <ul className="list-inside list-disc space-y-1 font-semibold">
                  {wrongDays.map((d) => (
                    <li key={d}>
                      Tag {d}: {DAYS[d - 1].title}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-3">
              <h3 className="font-black">Alle Fragen mit Erklärung</h3>
              {EXAM.map((q, i) => {
                const ex = q.exercise;
                const text = ex.kind === 'truefalse' ? ex.statement : ex.question;
                return (
                  <div key={i} className={`rounded-2xl border-2 p-4 ${answers[i] ? 'border-leaf-400 bg-leaf-50' : 'border-red-300 bg-red-50'}`}>
                    <p className="flex gap-2 font-bold">
                      {answers[i] ? <Check className="shrink-0 text-leaf-600" /> : <X className="shrink-0 text-red-600" />}
                      <span>
                        {i + 1}. <Rich text={text} />
                      </span>
                    </p>
                    <p className="mt-1 pl-8 text-[15px] text-ink-600">
                      <Rich text={ex.explanation} />
                    </p>
                  </div>
                );
              })}
            </div>
          </Screen>
        )}
      </main>
    </div>
  );
}
