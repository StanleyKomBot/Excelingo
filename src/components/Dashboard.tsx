import { motion } from 'framer-motion';
import {
  Award,
  Calculator,
  Check,
  ChefHat,
  ChevronDown,
  Clock,
  Download,
  Flame,
  Footprints,
  GraduationCap,
  LayoutGrid,
  Lock,
  Paintbrush,
  Percent,
  Play,
  RotateCcw,
  Sigma,
  Sparkles,
  Star,
  Target,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { DAYS } from '../data/course';
import {
  BADGES,
  DAILY_GOAL,
  currentStreak,
  doneUnits,
  isDayComplete,
  isDayUnlocked,
  lessonsToday,
  levelInfo,
  nextStep,
  totalUnits,
  type Progress,
} from '../lib/progress';
import { Companion, Zelli } from './Companion';
import { Button, Card, ProgressBar, WORKBOOK_URL } from './ui';

const DAY_ICONS: LucideIcon[] = [LayoutGrid, Paintbrush, Calculator, Sigma, Percent, ChefHat, Trophy];
const BADGE_ICONS: Record<string, LucideIcon> = { Footprints, Sparkles, Calculator, Sigma, Percent, ChefHat, Flame, Trophy };

interface Props {
  progress: Progress;
  onStart: (day: number, lesson: number) => void;
  onExam: () => void;
  onCertificate: () => void;
  onName: (name: string) => void;
  onReset: () => void;
}

export function Dashboard({ progress: p, onStart, onExam, onCertificate, onName, onReset }: Props) {
  const next = nextStep(p);
  const lvl = levelInfo(p.xp);
  const streak = currentStreak(p);
  const today = lessonsToday(p);
  const pct = (doneUnits(p) / totalUnits()) * 100;
  const currentDay = next === null ? 7 : next === 'exam' ? 7 : next.day;
  const [open, setOpen] = useState<number | null>(currentDay);
  const [nameDraft, setNameDraft] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  const greeting =
    doneUnits(p) === 0
      ? 'Servus! Ich bin Zelli. In 7 Tagen mit je 20–30 Minuten lernst du Excel – mit Beispielen aus Küche, Schank und Kassa. Lade zuerst dein Arbeitsbuch herunter, dann geht’s los!'
      : next === null
        ? 'Du hast den ganzen Kurs geschafft! Hol dir dein Zertifikat – und schau ruhig wieder vorbei, um zu wiederholen.'
        : next === 'exam'
          ? 'Alle Lektionen erledigt! Jetzt wartet nur noch die Abschlussprüfung auf dich.'
          : today >= DAILY_GOAL
            ? 'Tagesziel erreicht – stark! Wenn du magst, mach noch eine Lektion. Sonst: Bis morgen!'
            : DAYS[next.day - 1].companion;

  const continueLabel = next === null ? 'Zertifikat ansehen' : next === 'exam' ? 'Zur Abschlussprüfung' : doneUnits(p) === 0 ? 'Jetzt starten' : 'Weiterlernen';
  const onContinue = () => (next === null ? onCertificate() : next === 'exam' ? onExam() : onStart(next.day, next.lesson));

  return (
    <div className="min-h-[100dvh]">
      {/* Kopfzeile */}
      <header className="sticky top-0 z-20 border-b-2 border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Zelli size={40} />
            <span className="text-xl font-black tracking-tight text-leaf-600 sm:text-2xl">
              Excel<span className="text-ink-900"> Quest</span>
            </span>
          </div>
          <div className="flex items-center gap-2 font-extrabold sm:gap-4">
            <span className="flex items-center gap-1 rounded-xl px-2 py-1 text-orange-500" title="Lern-Streak (Tage in Folge)">
              <Flame className={streak > 0 ? 'fill-orange-400' : 'text-slate-300'} size={22} /> {streak}
            </span>
            <span className="flex items-center gap-1 rounded-xl px-2 py-1 text-sun-500" title="Erfahrungspunkte">
              <Star className="fill-sun-400" size={22} /> {p.xp}
            </span>
            <span className="hidden rounded-xl bg-sky2-500/10 px-3 py-1 text-sm text-sky2-600 sm:inline">Lvl {lvl.index}</span>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_340px]">
        {/* Hauptspalte */}
        <div className="space-y-6">
          <Card className="space-y-5 bg-gradient-to-br from-white to-leaf-50">
            <div>
              <h1 className="text-2xl font-black sm:text-3xl">{p.name ? `Willkommen zurück, ${p.name}!` : 'Willkommen bei Excel Quest!'}</h1>
              <p className="font-semibold text-ink-600">Dein 7-Tage-Excel-Kurs mit Beispielen aus der Gastronomie.</p>
            </div>
            {!p.name && (
              <form
                className="flex flex-wrap gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (nameDraft.trim()) onName(nameDraft.trim());
                }}
              >
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  maxLength={60}
                  placeholder="Dein Name (optional)"
                  aria-label="Dein Vorname"
                  className="min-w-0 flex-1 rounded-2xl border-2 border-slate-200 bg-white px-4 py-2 font-bold outline-none focus:border-sky2-500"
                />
                <Button variant="secondary" type="submit" disabled={!nameDraft.trim()}>
                  Speichern
                </Button>
              </form>
            )}
            <Companion mood={next === null ? 'cheer' : 'happy'}>{greeting}</Companion>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button className="flex-1 text-lg" onClick={onContinue}>
                <Play size={20} className="fill-white" /> {continueLabel}
              </Button>
              <a
                href={WORKBOOK_URL}
                download="Excel_Quest_Arbeitsbuch.xlsx"
                className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-sky2-500 px-5 py-3 font-extrabold uppercase tracking-wide text-white shadow-[0_4px_0_0_#0369a1] transition hover:bg-sky2-400 active:translate-y-1 active:shadow-none"
              >
                <Download size={20} /> Arbeitsbuch (.xlsx)
              </a>
            </div>
            {next !== null && next !== 'exam' && (
              <p className="text-sm font-semibold text-ink-400">
                Als Nächstes: Tag {next.day} · {DAYS[next.day - 1].lessons[next.lesson].title}
              </p>
            )}
          </Card>

          {/* Lernpfad */}
          <section aria-labelledby="path-title">
            <h2 id="path-title" className="mb-4 text-xl font-black">
              Dein Lernpfad
            </h2>
            <ol className="relative space-y-4">
              <span className="absolute left-[31px] top-6 bottom-6 w-1 rounded bg-slate-200 sm:left-[39px]" aria-hidden="true" />
              {DAYS.map((day, di) => {
                const unlocked = isDayUnlocked(p, day.id);
                const complete = isDayComplete(p, day.id);
                const done = day.lessons.filter((l) => p.lessons[l.id]).length;
                const units = day.lessons.length + (day.id === 7 ? 1 : 0);
                const doneU = done + (day.id === 7 && p.exam.passed ? 1 : 0);
                const isCurrent = unlocked && !complete;
                const Icon = DAY_ICONS[di];
                const expanded = open === day.id && unlocked;
                return (
                  <motion.li key={day.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: di * 0.04 }} className={`relative flex gap-3 sm:gap-4 ${di % 2 ? 'sm:pl-8' : ''}`}>
                    <button
                      disabled={!unlocked}
                      onClick={() => setOpen(expanded ? null : day.id)}
                      aria-label={`Tag ${day.id}: ${day.title}`}
                      className={`relative z-10 grid h-16 w-16 shrink-0 place-items-center rounded-full border-b-[6px] transition sm:h-20 sm:w-20 ${
                        complete ? 'border-sun-500 bg-sun-400 text-white' : isCurrent ? 'border-leaf-700 bg-leaf-500 text-white ring-8 ring-leaf-500/20' : 'border-slate-300 bg-slate-200 text-slate-400'
                      }`}
                    >
                      {complete ? <Check size={32} strokeWidth={3} /> : unlocked ? <Icon size={30} /> : <Lock size={26} />}
                    </button>
                    <div className={`flex-1 rounded-3xl border-2 bg-white ${isCurrent ? 'border-leaf-400' : 'border-slate-200'} ${!unlocked ? 'opacity-60' : ''}`}>
                      <button disabled={!unlocked} onClick={() => setOpen(expanded ? null : day.id)} className="w-full p-4 text-left">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-extrabold uppercase tracking-wider text-ink-400">Tag {day.id}</p>
                            <h3 className="text-lg font-black leading-tight">{day.title}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            {complete && <span className="rounded-full bg-sun-400/20 px-2 py-0.5 text-xs font-extrabold text-sun-500">Erledigt</span>}
                            {unlocked && <ChevronDown size={20} className={`text-ink-400 transition ${expanded ? 'rotate-180' : ''}`} />}
                          </div>
                        </div>
                        <p className="mt-1 text-sm text-ink-600">{day.description}</p>
                        <div className="mt-3 flex items-center gap-3 text-xs font-bold text-ink-400">
                          <span className="flex items-center gap-1">
                            <Clock size={14} /> ca. {day.minutes} Min.
                          </span>
                          <span>
                            {doneU}/{units} {day.id === 7 ? 'Schritte' : 'Lektionen'}
                          </span>
                        </div>
                        <ProgressBar value={(doneU / units) * 100} color={complete ? 'bg-sun-400' : 'bg-leaf-500'} className="mt-2 h-2" />
                        {!unlocked && <p className="mt-2 text-xs font-bold text-ink-400">Wird nach Tag {day.id - 1} freigeschaltet.</p>}
                      </button>
                      {expanded && (
                        <ul className="space-y-2 border-t-2 border-slate-100 p-3">
                          {day.lessons.map((l, li) => {
                            const rec = p.lessons[l.id];
                            const avail = li === 0 || !!p.lessons[day.lessons[li - 1].id];
                            return (
                              <li key={l.id}>
                                <button
                                  disabled={!avail}
                                  onClick={() => onStart(day.id, li)}
                                  className="flex w-full items-center gap-3 rounded-2xl p-2 text-left hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-transparent"
                                >
                                  <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${rec ? 'bg-sun-400 text-white' : avail ? 'bg-leaf-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                    {rec ? <Check size={18} strokeWidth={3} /> : avail ? <Play size={16} className="fill-white" /> : <Lock size={16} />}
                                  </span>
                                  <span className="flex-1">
                                    <span className="block font-bold leading-tight">{l.title}</span>
                                    <span className="text-xs font-semibold text-ink-400">
                                      {l.minutes} Min. · Excel: {l.excel.sheet}
                                      {rec && !rec.excelDone && ' · Excel-Aufgabe offen'}
                                    </span>
                                  </span>
                                  {rec && <RotateCcw size={16} className="text-ink-400" aria-label="Wiederholen" />}
                                </button>
                              </li>
                            );
                          })}
                          {day.id === 7 && (
                            <li>
                              <button
                                disabled={!day.lessons.every((l) => p.lessons[l.id])}
                                onClick={onExam}
                                className="flex w-full items-center gap-3 rounded-2xl p-2 text-left hover:bg-slate-50 disabled:opacity-50"
                              >
                                <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${p.exam.passed ? 'bg-sun-400' : 'bg-sky2-500'} text-white`}>
                                  <GraduationCap size={18} />
                                </span>
                                <span className="flex-1">
                                  <span className="block font-bold leading-tight">Abschlussprüfung</span>
                                  <span className="text-xs font-semibold text-ink-400">
                                    10 Fragen · ca. 10 Min.{p.exam.attempts > 0 && ` · Bestes Ergebnis: ${p.exam.best}/10`}
                                  </span>
                                </span>
                              </button>
                            </li>
                          )}
                        </ul>
                      )}
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          </section>
        </div>

        {/* Seitenspalte */}
        <aside className="space-y-4">
          <Card>
            <p className="text-xs font-extrabold uppercase tracking-wider text-ink-400">Gesamtfortschritt</p>
            <p className="text-3xl font-black">{Math.round(pct)} %</p>
            <ProgressBar value={pct} className="mt-2" />
            <p className="mt-2 text-sm font-semibold text-ink-400">
              {doneUnits(p)} von {totalUnits()} Einheiten erledigt
            </p>
          </Card>
          <Card>
            <p className="text-xs font-extrabold uppercase tracking-wider text-ink-400">Level {lvl.index}</p>
            <p className="text-xl font-black text-sky2-600">{lvl.name}</p>
            <ProgressBar value={lvl.pct} color="bg-sky2-500" className="mt-2" />
            <p className="mt-2 text-sm font-semibold text-ink-400">{lvl.next ? `Noch ${lvl.toNext} XP bis „${lvl.next}“` : 'Höchstes Level erreicht!'}</p>
          </Card>
          <div className="grid grid-cols-2 gap-4">
            <Card className="text-center">
              <Star className="mx-auto fill-sun-400 text-sun-500" size={28} />
              <p className="text-2xl font-black">{p.xp}</p>
              <p className="text-xs font-bold text-ink-400">XP gesamt</p>
            </Card>
            <Card className="text-center">
              <Flame className={`mx-auto ${streak > 0 ? 'fill-orange-400 text-orange-500' : 'text-slate-300'}`} size={28} />
              <p className="text-2xl font-black">{streak}</p>
              <p className="text-xs font-bold text-ink-400">{streak === 1 ? 'Tag' : 'Tage'} in Folge</p>
            </Card>
          </div>
          <Card>
            <div className="flex items-center gap-3">
              <Target className="text-berry-500" size={28} />
              <div className="flex-1">
                <p className="text-xs font-extrabold uppercase tracking-wider text-ink-400">Tagesziel</p>
                <p className="font-black">
                  {Math.min(today, DAILY_GOAL)} / {DAILY_GOAL} Lektionen heute
                </p>
              </div>
              {today >= DAILY_GOAL && <Check className="text-leaf-500" strokeWidth={3} />}
            </div>
            <ProgressBar value={(today / DAILY_GOAL) * 100} color="bg-berry-400" className="mt-3" />
            <p className="mt-2 text-xs font-semibold text-ink-400">≈ 20–30 Minuten inkl. Excel-Aufgaben</p>
          </Card>
          <Card>
            <p className="mb-3 text-xs font-extrabold uppercase tracking-wider text-ink-400">Abzeichen</p>
            <div className="grid grid-cols-4 gap-2">
              {BADGES.map((b) => {
                const got = !!p.badges[b.id];
                const Icon = BADGE_ICONS[b.icon];
                return (
                  <div key={b.id} className="group relative flex flex-col items-center text-center" title={`${b.name}: ${b.desc}`}>
                    <span className={`grid h-12 w-12 place-items-center rounded-2xl ${got ? 'bg-sun-400 text-white shadow-[0_3px_0_0_#ca8a04]' : 'bg-slate-100 text-slate-300'}`}>
                      <Icon size={22} />
                    </span>
                    <span className={`mt-1 text-[10px] font-bold leading-tight ${got ? 'text-ink-900' : 'text-ink-400'}`}>{b.name}</span>
                  </div>
                );
              })}
            </div>
          </Card>
          {p.exam.passed && (
            <Button className="w-full" onClick={onCertificate}>
              <Award size={18} /> Mein Zertifikat
            </Button>
          )}
          <Card className="text-xs text-ink-400">
            <p>
              Excel Quest ist ein ergänzender Praxiskurs und <strong>kein</strong> offizieller Vorbereitungskurs für die Befähigungsprüfung Gastgewerbe. Alle Rechenbeispiele sind vereinfachte Übungen und keine Steuer- oder
              Rechtsberatung.
            </p>
            <p className="mt-2">Dein Fortschritt wird nur in diesem Browser gespeichert.</p>
            {!confirmReset ? (
              <button onClick={() => setConfirmReset(true)} className="mt-2 font-bold underline hover:text-berry-500">
                Fortschritt zurücksetzen
              </button>
            ) : (
              <div className="mt-2 space-y-2 rounded-xl bg-red-50 p-3 text-red-700">
                <p className="font-bold">Wirklich alles löschen? XP, Lektionen und Abzeichen gehen verloren.</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onReset();
                      setConfirmReset(false);
                    }}
                    className="rounded-lg bg-berry-500 px-3 py-1 font-bold text-white"
                  >
                    Ja, zurücksetzen
                  </button>
                  <button onClick={() => setConfirmReset(false)} className="rounded-lg bg-white px-3 py-1 font-bold">
                    Abbrechen
                  </button>
                </div>
              </div>
            )}
          </Card>
        </aside>
      </div>
    </div>
  );
}
