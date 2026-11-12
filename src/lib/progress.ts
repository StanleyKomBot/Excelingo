import { DAYS, EXAM_PASS } from '../data/course';

export const XP = { lesson: 20, correct: 5, excel: 15, day: 50, exam: 100 } as const;
export const DAILY_GOAL = 3; // Lektionen pro Tag (~ 15–20 Minuten)

export const LEVELS = [
  { min: 0, name: 'Excel-Neuling' },
  { min: 150, name: 'Tabellen-Entdecker:in' },
  { min: 450, name: 'Formel-Lehrling' },
  { min: 850, name: 'Kalkulations-Profi' },
  { min: 1300, name: 'Excel-Champion' },
];

export const BADGES = [
  { id: 'first-steps', name: 'Erste Schritte', desc: 'Erste Lektion abgeschlossen', icon: 'Footprints' },
  { id: 'flawless', name: 'Fehlerfrei', desc: 'Eine Lektion ohne einen Fehler', icon: 'Sparkles' },
  { id: 'formula', name: 'Formel-Starter', desc: 'Tag 3 „Formeln“ abgeschlossen', icon: 'Calculator' },
  { id: 'functions', name: 'Funktions-Fan', desc: 'Tag 4 „Funktionen“ abgeschlossen', icon: 'Sigma' },
  { id: 'percent', name: 'Prozent-Profi', desc: 'Tag 5 „Prozente“ abgeschlossen', icon: 'Percent' },
  { id: 'gastro', name: 'Gastro-Rechner', desc: 'Tag 6 „Kalkulation“ abgeschlossen', icon: 'ChefHat' },
  { id: 'streak3', name: 'Dranbleiber:in', desc: '3 Tage in Folge gelernt', icon: 'Flame' },
  { id: 'finisher', name: 'Sieben-Tage-Finisher', desc: 'Abschlussprüfung bestanden', icon: 'Trophy' },
] as const;
export type BadgeId = (typeof BADGES)[number]['id'];
const DAY_BADGE: Record<number, BadgeId> = { 3: 'formula', 4: 'functions', 5: 'percent', 6: 'gastro' };

export interface LessonRecord {
  xp: number;
  excelDone: boolean;
  perfect: boolean;
  date: string;
}

export interface Progress {
  version: 1;
  name: string;
  xp: number;
  lessons: Record<string, LessonRecord>;
  days: number[]; // Tage, für die der Kapitelbonus vergeben wurde
  exam: { best: number; attempts: number; passed: boolean; passedDate: string | null };
  streak: { count: number; last: string | null };
  today: { date: string; lessons: number };
  badges: Partial<Record<BadgeId, string>>;
}

export const emptyProgress = (): Progress => ({
  version: 1,
  name: '',
  xp: 0,
  lessons: {},
  days: [],
  exam: { best: 0, attempts: 0, passed: false, passedDate: null },
  streak: { count: 0, last: null },
  today: { date: '', lessons: 0 },
  badges: {},
});

// ---------- Datum (lokale Zeit) ----------
export const dateKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayDiff = (a: string, b: string) => Math.round((Date.parse(b + 'T12:00:00') - Date.parse(a + 'T12:00:00')) / 86400000);

// ---------- Speicherung ----------
const KEY = 'excel-quest-progress-v1';

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const num = (v: unknown, d = 0) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : d);

/** Liest und validiert gespeicherten Fortschritt. Beschädigte Felder werden durch Standardwerte ersetzt. */
export function parseProgress(raw: string | null): Progress {
  const base = emptyProgress();
  if (!raw) return base;
  try {
    const p = JSON.parse(raw);
    if (!isObj(p)) return base;
    const lessons: Record<string, LessonRecord> = {};
    if (isObj(p.lessons))
      for (const [k, v] of Object.entries(p.lessons))
        if (isObj(v)) lessons[k] = { xp: num(v.xp), excelDone: !!v.excelDone, perfect: !!v.perfect, date: String(v.date ?? '') };
    const exam = isObj(p.exam) ? p.exam : {};
    const streak = isObj(p.streak) ? p.streak : {};
    const today = isObj(p.today) ? p.today : {};
    const badges: Progress['badges'] = {};
    if (isObj(p.badges)) for (const b of BADGES) if (typeof p.badges[b.id] === 'string') badges[b.id] = p.badges[b.id] as string;
    return {
      version: 1,
      name: typeof p.name === 'string' ? p.name.slice(0, 60) : '',
      xp: num(p.xp),
      lessons,
      days: Array.isArray(p.days) ? p.days.filter((d): d is number => typeof d === 'number') : [],
      exam: {
        best: num(exam.best),
        attempts: num(exam.attempts),
        passed: !!exam.passed,
        passedDate: typeof exam.passedDate === 'string' ? exam.passedDate : null,
      },
      streak: { count: num(streak.count), last: typeof streak.last === 'string' ? streak.last : null },
      today: { date: typeof today.date === 'string' ? today.date : '', lessons: num(today.lessons) },
      badges,
    };
  } catch {
    return base;
  }
}

export function loadProgress(): Progress {
  try {
    return parseProgress(localStorage.getItem(KEY));
  } catch {
    return emptyProgress();
  }
}

export function saveProgress(p: Progress): boolean {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}

export function clearProgress() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignorieren */
  }
}

// ---------- Abgeleitete Werte ----------
export function levelInfo(xp: number) {
  let i = 0;
  for (let k = 0; k < LEVELS.length; k++) if (xp >= LEVELS[k].min) i = k;
  const next = LEVELS[i + 1];
  return {
    index: i + 1,
    name: LEVELS[i].name,
    next: next?.name ?? null,
    toNext: next ? next.min - xp : 0,
    pct: next ? ((xp - LEVELS[i].min) / (next.min - LEVELS[i].min)) * 100 : 100,
  };
}

export const isDayComplete = (p: Progress, dayId: number) => {
  const day = DAYS.find((d) => d.id === dayId)!;
  const lessonsDone = day.lessons.every((l) => p.lessons[l.id]);
  return dayId === 7 ? lessonsDone && p.exam.passed : lessonsDone;
};

export const isDayUnlocked = (p: Progress, dayId: number) => dayId === 1 || isDayComplete(p, dayId - 1);

/** Erste noch nicht erledigte Lektion – oder 'exam' bzw. null, wenn alles fertig ist. */
export function nextStep(p: Progress): { day: number; lesson: number } | 'exam' | null {
  for (const d of DAYS) {
    const i = d.lessons.findIndex((l) => !p.lessons[l.id]);
    if (i >= 0) return { day: d.id, lesson: i };
  }
  return p.exam.passed ? null : 'exam';
}

export const totalUnits = () => DAYS.reduce((a, d) => a + d.lessons.length, 0) + 1; // +1 = Prüfung
export const doneUnits = (p: Progress) => Object.keys(p.lessons).length + (p.exam.passed ? 1 : 0);

/** Aktueller Streak (0, wenn der letzte Lerntag vor gestern war). */
export function currentStreak(p: Progress, today = dateKey()) {
  if (!p.streak.last) return 0;
  return dayDiff(p.streak.last, today) <= 1 ? p.streak.count : 0;
}

export const lessonsToday = (p: Progress, today = dateKey()) => (p.today.date === today ? p.today.lessons : 0);

// ---------- Belohnungen ----------
export interface Reward {
  items: { label: string; xp: number }[];
  total: number;
  badges: BadgeId[];
  levelUp: string | null;
  alreadyDone: boolean;
}

function touchActivity(p: Progress, today: string): Progress {
  let { count, last } = p.streak;
  if (last !== today) {
    count = last && dayDiff(last, today) === 1 ? count + 1 : 1;
    last = today;
  }
  const t = p.today.date === today ? p.today.lessons + 1 : 1;
  return { ...p, streak: { count, last }, today: { date: today, lessons: t } };
}

function finish(before: Progress, after: Progress, items: Reward['items'], newBadges: BadgeId[], alreadyDone: boolean, today: string) {
  const badges = { ...after.badges };
  if (currentStreak(after, today) >= 3 && !badges.streak3) newBadges.push('streak3');
  for (const b of newBadges) badges[b] = today;
  const total = items.reduce((a, i) => a + i.xp, 0);
  const final: Progress = { ...after, xp: after.xp + total, badges };
  const lvlBefore = levelInfo(before.xp).name;
  const lvlAfter = levelInfo(final.xp).name;
  return { progress: final, reward: { items, total, badges: newBadges, levelUp: lvlAfter !== lvlBefore ? lvlAfter : null, alreadyDone } as Reward };
}

/**
 * Lektion abschließen. XP werden pro Lektion nur einmal vergeben.
 * Wird die Excel-Aufgabe bei einer Wiederholung erstmals bestätigt, gibt es nur die Excel-XP nachträglich.
 */
export function completeLesson(
  p: Progress,
  lessonId: string,
  r: { firstTry: number; mistakes: number; excelDone: boolean },
  today = dateKey(),
): { progress: Progress; reward: Reward } {
  const prev = p.lessons[lessonId];
  const items: Reward['items'] = [];
  const newBadges: BadgeId[] = [];
  let next = touchActivity(p, today);

  if (prev) {
    if (r.excelDone && !prev.excelDone) items.push({ label: 'Excel-Aufgabe nachgeholt', xp: XP.excel });
    next = {
      ...next,
      lessons: { ...next.lessons, [lessonId]: { ...prev, xp: prev.xp + items.reduce((a, i) => a + i.xp, 0), excelDone: prev.excelDone || r.excelDone, perfect: prev.perfect || r.mistakes === 0 } },
    };
    return finish(p, next, items, newBadges, true, today);
  }

  items.push({ label: 'Lektion abgeschlossen', xp: XP.lesson });
  if (r.firstTry > 0) items.push({ label: `${r.firstTry} × auf Anhieb richtig`, xp: r.firstTry * XP.correct });
  if (r.excelDone) items.push({ label: 'Excel-Aufgabe erledigt', xp: XP.excel });
  const lessonXp = items.reduce((a, i) => a + i.xp, 0);
  next = { ...next, lessons: { ...next.lessons, [lessonId]: { xp: lessonXp, excelDone: r.excelDone, perfect: r.mistakes === 0, date: today } } };

  if (!next.badges['first-steps']) newBadges.push('first-steps');
  if (r.mistakes === 0 && !next.badges.flawless) newBadges.push('flawless');

  const day = DAYS.find((d) => d.lessons.some((l) => l.id === lessonId))!;
  if (day.id !== 7 && isDayComplete(next, day.id) && !next.days.includes(day.id)) {
    items.push({ label: `Kapitel „${day.title}“ geschafft`, xp: XP.day });
    next = { ...next, days: [...next.days, day.id] };
    const b = DAY_BADGE[day.id];
    if (b && !next.badges[b]) newBadges.push(b);
  }
  return finish(p, next, items, newBadges, false, today);
}

/** Abschlussprüfung werten. XP und Zertifikat nur beim ersten Bestehen. */
export function completeExam(p: Progress, score: number, today = dateKey()): { progress: Progress; reward: Reward } {
  const passed = score >= EXAM_PASS;
  const items: Reward['items'] = [];
  const newBadges: BadgeId[] = [];
  let next: Progress = { ...p, exam: { ...p.exam, attempts: p.exam.attempts + 1, best: Math.max(p.exam.best, score) } };
  const firstPass = passed && !p.exam.passed;
  if (firstPass) {
    items.push({ label: 'Abschlussprüfung bestanden', xp: XP.exam });
    next = { ...next, exam: { ...next.exam, passed: true, passedDate: today } };
    if (!next.days.includes(7)) {
      items.push({ label: 'Kapitel „Abschluss-Challenge“ geschafft', xp: XP.day });
      next = { ...next, days: [...next.days, 7] };
    }
    newBadges.push('finisher');
  }
  return finish(p, next, items, newBadges, passed && !firstPass, today);
}
