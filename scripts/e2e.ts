/**
 * End-to-End-Test: spielt den ganzen Kurs im Browser durch (Playwright).
 * Voraussetzung: `npm run build && npx vite preview --port 4173` läuft.
 * Aufruf: npx tsx scripts/e2e.ts [screenshot-ordner]
 */
import { createRequire } from 'node:module';
import type { Page } from 'playwright';
import { DAYS, EXAM } from '../src/data/course';
import type { Exercise } from '../src/data/types';

// Playwright wird nicht als Projekt-Abhängigkeit installiert, sondern global erwartet (require-Auflösung inkl. NODE_PATH).
const { chromium, devices } = createRequire(import.meta.url)('playwright') as typeof import('playwright');
const URL = process.env.E2E_URL ?? 'http://localhost:4173/';
const SHOTS = process.argv[2];
const errors: string[] = [];

const fmt = (n: number) => n.toLocaleString('de-AT', { useGrouping: false, maximumFractionDigits: 4 });

async function answer(page: Page, ex: Exercise, correct = true) {
  if (ex.kind === 'choice') {
    const i = correct ? ex.correct : (ex.correct + 1) % ex.options.length;
    await page.locator('main button', { has: page.locator(`span[data-option]:text-is(${JSON.stringify(ex.options[i])})`) }).click();
  } else if (ex.kind === 'truefalse') {
    const v = correct ? ex.correct : !ex.correct;
    await page.locator('main button').filter({ hasText: new RegExp(`^\\s*${v ? 'Richtig' : 'Falsch'}$`) }).click();
  } else if (ex.kind === 'input') {
    const val = !correct ? '999' : ex.numeric ? fmt(ex.numeric[0]) : ex.answers![0];
    await page.fill('input[aria-label="Antwort"]', val);
  } else {
    for (const [l, r] of ex.pairs) {
      await page.locator(`main button:text-is(${JSON.stringify(l)})`).click();
      await page.locator(`main button:text-is(${JSON.stringify(r)})`).click();
    }
  }
  await page.getByRole('button', { name: 'Prüfen', exact: true }).click();
  const fb = page.getByRole('status');
  await fb.waitFor();
  const text = await fb.innerText();
  const wasCorrect = !/Nicht ganz|Fast!|Fehler sind/.test(text);
  if (wasCorrect !== correct) throw new Error(`Antwort falsch bewertet: ${JSON.stringify(ex).slice(0, 120)}`);
  await page.getByRole('button', { name: 'Weiter', exact: true }).click();
}

async function shot(page: Page, name: string) {
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && !m.text().includes('fonts.g') && errors.push(m.text()));

await page.goto(URL);
await page.getByText('Willkommen bei Excel Quest!').waitFor();
await shot(page, '01-dashboard-start');

// Download prüfen
const [dl] = await Promise.all([page.waitForEvent('download'), page.getByText('Arbeitsbuch (.xlsx)').click()]);
const dlPath = await dl.path();
const fs = await import('node:fs');
const size = fs.statSync(dlPath!).size;
if (dl.suggestedFilename() !== 'Excel_Quest_Arbeitsbuch.xlsx' || size < 10000) throw new Error('Download fehlerhaft');
console.log(`✓ Download: ${dl.suggestedFilename()} (${size} Bytes)`);

await page.fill('input[aria-label="Dein Vorname"]', 'Maria');
await page.getByRole('button', { name: 'Speichern', exact: true }).click();
await page.getByRole('button', { name: /Jetzt starten/ }).click();

let lessonCount = 0;
for (const day of DAYS) {
  for (const lesson of day.lessons) {
    await page.getByRole('heading', { name: lesson.title, exact: true }).waitFor();
    if (lesson.id === '1-1') await shot(page, '02-lesson-learn');
    await page.getByRole('button', { name: /^Weiter/ }).click();
    if (lesson.id === '6-1') await shot(page, '03-lesson-example');
    await page.getByRole('button', { name: /Jetzt üben/ }).click();
    // Lektion 1-2: drei Fehler → Herzen leer → Pause-Bildschirm
    const firstWrong = lesson.id === '1-2';
    if (firstWrong) {
      await answer(page, lesson.exercises[0], false);
      await answer(page, lesson.exercises[1], false);
      await answer(page, lesson.exercises[2], false);
      await page.getByText('Kurze Verschnaufpause!').waitFor();
      await shot(page, '04-hearts-empty');
      await page.getByRole('button', { name: 'Weiter üben' }).click();
      for (const i of [3, 0, 1, 2]) await answer(page, lesson.exercises[i]);
    } else {
      for (const [i, ex] of lesson.exercises.entries()) {
        if (lesson.id === '4-2' && i === 1) await shot(page, '05-exercise');
        await answer(page, ex);
      }
    }
    await page.getByText('Jetzt bist du in Excel dran!').waitFor();
    await page.getByRole('button', { name: /Lösung anzeigen/ }).click();
    if (lesson.id === '3-3') await shot(page, '06-excel-task');
    const skipExcel = lesson.id === '2-1';
    if (skipExcel) await page.getByRole('button', { name: 'Später in Excel' }).click();
    else {
      await page.getByRole('checkbox').check();
      await page.getByRole('button', { name: 'Lektion abschließen' }).click();
    }
    await page.getByText('Lektion geschafft!').waitFor();
    if (lesson.id === '1-1') await shot(page, '07-reward');
    lessonCount++;
    await page.getByRole('button', { name: /Nächste Lektion/ }).click();
  }
}
console.log(`✓ ${lessonCount} Lektionen durchgespielt`);

// Prüfung: erst durchfallen (7/10), dann bestehen (9/10)
await page.getByRole('button', { name: 'Prüfung starten' }).click();
for (const [i, q] of EXAM.entries()) await answer(page, q.exercise, i >= 3);
await page.getByText('Noch nicht ganz geschafft').waitFor();
if (await page.getByRole('button', { name: /Zertifikat ansehen/ }).count()) throw new Error('Zertifikat trotz Nichtbestehen');
await page.getByText('Empfehlung zum Wiederholen').waitFor();
await shot(page, '08-exam-failed');
await page.getByRole('button', { name: /Nochmal versuchen/ }).click();
for (const [i, q] of EXAM.entries()) await answer(page, q.exercise, i !== 4);
await page.getByText('Bestanden – gratuliere!').waitFor();
console.log('✓ Prüfung: Nichtbestehen und Bestehen korrekt');
await page.getByRole('button', { name: /Zertifikat ansehen/ }).click();
await page.getByText('Hiermit wird bestätigt').waitFor();
await shot(page, '09-certificate');
await page.getByRole('button', { name: /Zurück/ }).click();

const xpText = async () => (await page.locator('header span[title="Erfahrungspunkte"]').innerText()).trim();
const xpBefore = await xpText();
await page.reload();
await page.getByText('Willkommen zurück, Maria!').waitFor();
const xpAfterReload = await xpText();
if (xpBefore !== xpAfterReload) throw new Error('Fortschritt nach Reload verloren');
console.log(`✓ Fortschritt nach Reload erhalten (XP ${xpAfterReload})`);
await shot(page, '10-dashboard-done');

// Excel-Aufgabe nachholen (Lektion 2-1) → +15 XP, Wiederholung sonst ohne XP
await page.getByRole('button', { name: 'Tag 2: Formatieren' }).first().click();
await page.getByRole('button', { name: /Schrift, Fett & Ausrichtung/ }).click();
await page.getByRole('button', { name: /^Weiter/ }).click();
await page.getByRole('button', { name: /Jetzt üben/ }).click();
for (const ex of DAYS[1].lessons[0].exercises) await answer(page, ex);
await page.getByRole('checkbox').check();
await page.getByRole('button', { name: 'Lektion abschließen' }).click();
await page.getByText('Excel-Aufgabe nachgeholt').waitFor();
await page.getByRole('button', { name: 'Zum Lernpfad' }).click();
if (Number(await xpText()) !== Number(xpBefore) + 15) throw new Error('Nachgeholte Excel-XP falsch');
console.log('✓ Excel-Aufgabe nachgeholt: genau +15 XP');

// Responsive Screenshots
for (const [name, dev] of [
  ['tablet', devices['iPad (gen 7)']],
  ['phone', devices['iPhone 13']],
] as const) {
  const c = await browser.newContext({ ...dev });
  const pg = await c.newPage();
  pg.on('pageerror', (e) => errors.push(String(e)));
  await pg.goto(URL);
  await pg.getByText('Willkommen bei Excel Quest!').waitFor();
  const overflow = await pg.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  if (overflow) errors.push(`${name}: horizontales Scrollen auf dem Dashboard`);
  await shot(pg, `11-${name}-dashboard`);
  await pg.getByRole('button', { name: /Jetzt starten/ }).click();
  await pg.getByRole('button', { name: /^Weiter/ }).click();
  await pg.getByRole('button', { name: /Jetzt üben/ }).click();
  await pg.locator('main button', { has: pg.locator('span[data-option]:text-is("Arbeitsmappe")') }).click();
  await shot(pg, `12-${name}-exercise`);
  await c.close();
}

await browser.close();
if (errors.length) {
  console.error('Fehler:', errors);
  process.exit(1);
}
console.log('✓ Keine Konsolen-/Laufzeitfehler');
