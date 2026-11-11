/** Prüft Kursinhalte, Antwortprüfung und Gamification-Logik. Aufruf: npm run check */
import { DAYS, EXAM, EXAM_PASS } from '../src/data/course';
import type { Exercise } from '../src/data/types';
import { checkInput, parseNumber } from '../src/lib/check';
import { XP, completeExam, completeLesson, currentStreak, emptyProgress, isDayUnlocked, levelInfo, nextStep, parseProgress } from '../src/lib/progress';

let fails = 0;
const ok = (cond: unknown, msg: string) => {
  if (!cond) {
    fails++;
    console.error('✗', msg);
  }
};

const SHEETS = ['01_Start', '02_Grundlagen', '03_Formatierung', '04_Formeln', '05_Funktionen', '06_Kalkulation', '07_Abschluss'];

function checkExercise(ex: Exercise, where: string) {
  ok(ex.explanation.trim().length > 5, `${where}: Erklärung fehlt`);
  if (ex.kind === 'choice') {
    ok(ex.options.length >= 2 && ex.correct >= 0 && ex.correct < ex.options.length, `${where}: correct-Index ungültig`);
    ok(new Set(ex.options).size === ex.options.length, `${where}: doppelte Optionen`);
  }
  if (ex.kind === 'match') ok(new Set(ex.pairs.map((p) => p[1])).size === ex.pairs.length, `${where}: doppelte Zuordnung`);
  if (ex.kind === 'input') {
    ok(ex.numeric || ex.answers?.length, `${where}: keine Antwort`);
    // Musterlösung muss akzeptiert werden, offensichtlich falsche nicht
    if (ex.numeric) {
      const s = ex.numeric[0].toLocaleString('de-AT', { maximumFractionDigits: 4, useGrouping: false });
      ok(checkInput(ex, s), `${where}: Musterlösung ${s} wird nicht akzeptiert`);
      ok(!checkInput(ex, String(ex.numeric[0] + 1)), `${where}: falsche Antwort wird akzeptiert`);
    } else {
      ok(checkInput(ex, ex.answers![0]), `${where}: Musterlösung nicht akzeptiert`);
      ok(!checkInput(ex, 'X1'), `${where}: falsche Antwort akzeptiert`);
      if (ex.prefix) ok(checkInput(ex, ex.prefix + ex.answers![0]), `${where}: ganze Formel nicht akzeptiert`);
    }
  }
}

// ---------- Inhalte ----------
ok(DAYS.length === 7, '7 Tage');
const ids = new Set<string>();
for (const d of DAYS) {
  ok(d.lessons.length >= 1 && (d.id === 7 || (d.lessons.length >= 3 && d.lessons.length <= 5)), `Tag ${d.id}: 3–5 Lektionen`);
  for (const l of d.lessons) {
    const w = `Lektion ${l.id}`;
    ok(!ids.has(l.id), `${w}: doppelte ID`);
    ids.add(l.id);
    ok(l.intro && l.explain.length >= 2, `${w}: Einführung/Erklärung fehlt`);
    ok(l.example.grid || l.example.steps, `${w}: Beispiel fehlt`);
    ok(l.exercises.length >= 3, `${w}: mind. 3 Übungen`);
    ok(new Set(l.exercises.map((e) => e.kind)).size >= 2, `${w}: Übungsformate zu einseitig`);
    ok(SHEETS.includes(l.excel.sheet), `${w}: unbekanntes Blatt ${l.excel.sheet}`);
    ok(l.excel.steps.length && l.excel.solution.length, `${w}: Excel-Aufgabe unvollständig`);
    ok(l.minutes >= 3 && l.minutes <= 6, `${w}: Dauer 3–6 Min.`);
    l.exercises.forEach((e, i) => checkExercise(e, `${w} Ü${i + 1}`));
    const text = JSON.stringify(l);
    ok(!/TODO|lorem|placeholder/i.test(text.replace(/"placeholder":"[^"]*"/g, '')), `${w}: Platzhalter-Text`);
  }
}
ok(EXAM.length === 10, 'Prüfung: 10 Fragen');
ok(new Set(EXAM.map((q) => q.day)).size >= 6, 'Prüfung deckt alle Themen ab');
EXAM.forEach((q, i) => checkExercise(q.exercise, `Prüfung F${i + 1}`));
const kinds = new Set(DAYS.flatMap((d) => d.lessons.flatMap((l) => l.exercises.map((e) => e.label ?? e.kind))));
ok(kinds.size >= 7, `Übungsformate: ${[...kinds].join(', ')}`);

// ---------- Zahlen lesen ----------
ok(parseNumber('1.398,50 €') === 1398.5, 'parse 1.398,50 €');
ok(parseNumber('3,25') === 3.25, 'parse 3,25');
ok(parseNumber('0.5') === 0.5, 'parse 0.5');
ok(parseNumber('25 %') === 25, 'parse 25 %');
ok(parseNumber('abc') === null, 'parse abc');

// ---------- Gamification ----------
const d1 = '2026-11-10';
const d2 = '2026-11-11';
const d4 = '2026-11-13';
let p = emptyProgress();
let r = completeLesson(p, '1-1', { firstTry: 3, mistakes: 0, excelDone: true }, d1);
p = r.progress;
ok(r.reward.total === XP.lesson + 3 * XP.correct + XP.excel, `XP erste Lektion (${r.reward.total})`);
ok(r.reward.badges.includes('first-steps') && r.reward.badges.includes('flawless'), 'Abzeichen erste Lektion');
const xpAfter = p.xp;
r = completeLesson(p, '1-1', { firstTry: 3, mistakes: 0, excelDone: true }, d1);
ok(r.reward.total === 0 && r.progress.xp === xpAfter && r.reward.alreadyDone, 'keine doppelten XP');
// Excel-Aufgabe nachholen
let q = completeLesson(emptyProgress(), '1-1', { firstTry: 1, mistakes: 2, excelDone: false }, d1).progress;
r = completeLesson(q, '1-1', { firstTry: 3, mistakes: 0, excelDone: true }, d1);
ok(r.reward.total === XP.excel, 'Excel-XP nachholen');
ok(completeLesson(r.progress, '1-1', { firstTry: 3, mistakes: 0, excelDone: true }, d1).reward.total === 0, 'Excel-XP nur einmal');
// Streak
ok(currentStreak(p, d1) === 1, 'Streak 1');
p = completeLesson(p, '1-2', { firstTry: 4, mistakes: 0, excelDone: true }, d2).progress;
ok(p.streak.count === 2 && currentStreak(p, d2) === 2, 'Streak 2');
ok(currentStreak(p, d4) === 0, 'Streak verfällt nach Pause');
p = completeLesson(p, '1-3', { firstTry: 4, mistakes: 0, excelDone: true }, d4).progress;
ok(p.streak.count === 1, 'Streak beginnt neu');
ok(!isDayUnlocked(p, 2), 'Tag 2 gesperrt');
r = completeLesson(p, '1-4', { firstTry: 3, mistakes: 0, excelDone: true }, d4);
ok(r.reward.items.some((i) => i.xp === XP.day) && isDayUnlocked(r.progress, 2), 'Kapitelbonus + Tag 2 frei');
// alles durchspielen
p = r.progress;
for (const d of DAYS) for (const l of d.lessons) p = completeLesson(p, l.id, { firstTry: l.exercises.length, mistakes: 0, excelDone: true }, d4).progress;
ok(nextStep(p) === 'exam', 'danach Prüfung');
r = completeExam(p, EXAM_PASS - 1, d4);
ok(!r.progress.exam.passed && r.reward.total === 0 && !r.progress.badges.finisher, 'nicht bestanden → kein Zertifikat');
r = completeExam(r.progress, EXAM_PASS, d4);
ok(r.progress.exam.passed && r.reward.total === XP.exam + XP.day && r.progress.badges.finisher, 'bestanden → Zertifikat');
ok(completeExam(r.progress, 10, d4).reward.total === 0, 'Prüfungs-XP nur einmal');
ok(nextStep(r.progress) === null, 'Kurs fertig');
console.log(`Max. XP: ${r.progress.xp} → Level ${levelInfo(r.progress.xp).name}`);
// Speicherung robust
ok(parseProgress('kaputt{').xp === 0, 'kaputtes JSON');
ok(parseProgress(JSON.stringify({ xp: -5, lessons: 'x' })).xp === 0, 'ungültige Werte');
ok(parseProgress(JSON.stringify(r.progress)).xp === r.progress.xp, 'Roundtrip');

console.log(fails ? `\n${fails} Fehler` : `✓ Inhalte & Logik OK (${ids.size} Lektionen, ${DAYS.reduce((a, d) => a + d.lessons.reduce((b, l) => b + l.exercises.length, 0), 0)} Übungen, ${EXAM.length} Prüfungsfragen)`);
process.exit(fails ? 1 : 0);
