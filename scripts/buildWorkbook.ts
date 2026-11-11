/**
 * Erzeugt public/Excel_Quest_Arbeitsbuch.xlsx mit ExcelJS.
 * Formeln werden (wie von Excel intern erwartet) mit englischen Funktionsnamen
 * und Kommas gespeichert. Eine deutsche Excel-Version zeigt sie automatisch als
 * SUMME/MITTELWERT/WENN mit Strichpunkt an.
 * Lösungsformeln, die als TEXT angezeigt werden, sind in deutscher Schreibweise.
 */
import ExcelJS from 'exceljs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/Excel_Quest_Arbeitsbuch.xlsx');

// ---------- Stil-Konstanten ----------
const C = {
  green: 'FF16A34A',
  greenLight: 'FFD1FADF',
  input: 'FFFFF2CC', // gelb = Eingabefeld
  example: 'FFDBEAFE', // blau = Beispiel
  solution: 'FFF3F4F6', // grau = Lösung
  head: 'FF1F2937',
  white: 'FFFFFFFF',
  grey: 'FF6B7280',
  border: 'FFBFC5CD',
};
const EUR = '#,##0.00 "€"';
const PCT = '0%';
const PCT2 = '0.00%';

type Ws = ExcelJS.Worksheet;
const thin = { style: 'thin' as const, color: { argb: C.border } };
const allBorders = { top: thin, left: thin, bottom: thin, right: thin };
const fill = (argb: string): ExcelJS.Fill => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });

function title(ws: Ws, text: string, sub: string) {
  ws.getCell('A1').value = text;
  ws.getCell('A1').font = { size: 18, bold: true, color: { argb: C.green } };
  ws.getRow(1).height = 28;
  ws.getCell('A2').value = sub;
  ws.getCell('A2').font = { italic: true, color: { argb: C.grey } };
}

function section(ws: Ws, row: number, text: string, cols = 8) {
  const r = ws.getRow(row);
  for (let c = 1; c <= cols; c++) r.getCell(c).fill = fill(C.green);
  r.getCell(1).value = text;
  r.getCell(1).font = { bold: true, size: 13, color: { argb: C.white } };
  r.height = 22;
}

function note(ws: Ws, row: number, lines: string[], col = 1) {
  lines.forEach((l, i) => {
    const cell = ws.getRow(row + i).getCell(col);
    cell.value = l;
    cell.font = { color: { argb: C.head } };
  });
  return row + lines.length;
}

function header(ws: Ws, row: number, startCol: number, labels: string[], argb = C.head) {
  labels.forEach((l, i) => {
    const cell = ws.getRow(row).getCell(startCol + i);
    cell.value = l;
    cell.font = { bold: true, color: { argb: C.white } };
    cell.fill = fill(argb);
    cell.border = allBorders;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });
  ws.getRow(row).height = 30;
}

function put(ws: Ws, row: number, col: number, value: ExcelJS.CellValue, opts: { fmt?: string; kind?: 'input' | 'example' | 'solution' | 'plain' } = {}) {
  const cell = ws.getRow(row).getCell(col);
  cell.value = value;
  cell.border = allBorders;
  if (opts.fmt) cell.numFmt = opts.fmt;
  if (opts.kind === 'input') cell.fill = fill(C.input);
  if (opts.kind === 'example') cell.fill = fill(C.example);
  if (opts.kind === 'solution') {
    cell.fill = fill(C.solution);
    cell.font = { color: { argb: C.grey } };
  }
  return cell;
}

/** Eingabefeld (gelb, leer). */
const input = (ws: Ws, row: number, col: number, fmt?: string) => put(ws, row, col, null, { kind: 'input', fmt });

/** Selbstcheck-Zelle: zeigt ✓/✗, sobald etwas eingetragen wurde. */
function check(ws: Ws, row: number, col: number, cells: string[], conds: string[]) {
  const empty = cells.length === 1 ? `${cells[0]}=""` : `OR(${cells.map((c) => `${c}=""`).join(',')})`;
  const ok = conds.length === 1 ? conds[0] : `AND(${conds.join(',')})`;
  const cell = put(ws, row, col, { formula: `IF(${empty},"",IF(${ok},"✓ richtig","✗ prüfen"))`, result: '' });
  cell.alignment = { horizontal: 'center' };
  cell.font = { bold: true, color: { argb: C.green } };
}
const numEq = (ref: string, v: number, d = 2) => `ROUND(${ref},${d})=ROUND(${v},${d})`;

function solutionHeader(ws: Ws, row: number, col: number, labels: string[]) {
  header(ws, row, col, labels, 'FF9CA3AF');
}

/** Lösungsschlüssel (englische Formeln) für den automatischen Test in scripts/verifyWorkbook.py */
const KEY: { sheet: string; cell: string; v: string }[] = [];
const key = (ws: Ws, row: number, col: number, v: string | number) => KEY.push({ sheet: ws.name, cell: `${colLetter(col)}${row}`, v: String(v) });

const colLetter = (n: number) => String.fromCharCode(64 + n);
const r2 = (x: number) => Math.round((x + 1e-9) * 100) / 100;

// =====================================================================
const wb = new ExcelJS.Workbook();
wb.creator = 'Excel Quest';
wb.title = 'Excel Quest – Arbeitsbuch';
wb.created = new Date('2026-11-11T08:00:00Z');
wb.modified = wb.created;
wb.calcProperties.fullCalcOnLoad = true;

const SHEETS = ['01_Start', '02_Grundlagen', '03_Formatierung', '04_Formeln', '05_Funktionen', '06_Kalkulation', '07_Abschluss'];
const sheet = (name: string, tab: string) =>
  wb.addWorksheet(name, {
    properties: { tabColor: { argb: tab } },
    views: [{ showGridLines: true, zoomScale: 110 }],
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, paperSize: 9 },
  });

// ---------------------------------------------------------------- 01_Start
{
  const ws = sheet('01_Start', 'FF16A34A');
  ws.columns = [{ width: 4 }, { width: 26 }, { width: 44 }, { width: 22 }, { width: 18 }];
  title(ws, 'Excel Quest – dein Arbeitsbuch', 'Ein 7-Tage-Praxiskurs mit Beispielen aus der Gastronomie');
  section(ws, 4, 'Aufgabe 1.1 – Willkommen! Trag dich ein', 5);
  note(ws, 5, ['Klicke auf die gelbe Zelle C6, tippe deinen Namen und drücke Enter. Mach dasselbe in C7 mit dem heutigen Datum (z. B. 12.11.2026).']);
  put(ws, 6, 2, 'Dein Name:');
  input(ws, 6, 3);
  put(ws, 7, 2, 'Startdatum:');
  input(ws, 7, 3, 'DD.MM.YYYY');
  ws.getCell('B6').font = { bold: true };
  ws.getCell('B7').font = { bold: true };

  section(ws, 9, 'So arbeitest du mit diesem Arbeitsbuch', 5);
  note(ws, 10, [
    '1. Lies zuerst die Lektion auf der Excel-Quest-Website.',
    '2. Wechsle dann zu Excel (Alt+Tab bzw. Cmd+Tab) und öffne das Blatt, das die Website nennt.',
    '3. Fülle die gelben Felder selbst aus – tippe Formeln immer selbst ein!',
    '4. In der Spalte „Check“ erscheint ✓ richtig oder ✗ prüfen, sobald du etwas eingetragen hast.',
    '5. Die grauen Lösungsbereiche rechts erst NACH deinem eigenen Versuch ansehen.',
    '6. Speichere regelmäßig mit Strg+S (Mac: Cmd+S).',
  ]);

  section(ws, 17, 'Farb-Legende', 5);
  const legend: [string, string, string][] = [
    ['Eingabefeld', C.input, 'Hier trägst du Werte oder Formeln ein.'],
    ['Beispiel', C.example, 'Ein fertig gelöstes Beispiel zum Nachschauen.'],
    ['Lösung', C.solution, 'Lösungsformel und erwartetes Ergebnis.'],
  ];
  legend.forEach(([name, color, text], i) => {
    const cell = put(ws, 18 + i, 2, name);
    cell.fill = fill(color);
    put(ws, 18 + i, 3, text);
  });

  section(ws, 22, 'Kursübersicht', 5);
  header(ws, 23, 2, ['Tag', 'Thema', 'Arbeitsblatt']);
  const days: [string, string, string][] = [
    ['Tag 1', 'Excel-Grundlagen', '01_Start + 02_Grundlagen'],
    ['Tag 2', 'Formatieren', '03_Formatierung'],
    ['Tag 3', 'Rechnen mit Formeln', '04_Formeln'],
    ['Tag 4', 'Funktionen: SUMME, MITTELWERT, MIN, MAX', '05_Funktionen'],
    ['Tag 5', 'Prozentrechnung', '06_Kalkulation (Teil A)'],
    ['Tag 6', 'Gastro-Kalkulation', '06_Kalkulation (Teil B)'],
    ['Tag 7', 'Abschluss-Challenge', '07_Abschluss'],
  ];
  days.forEach(([d, t, s], i) => {
    put(ws, 24 + i, 2, d);
    put(ws, 24 + i, 3, t);
    const target = s.split(' ')[0];
    const link = put(ws, 24 + i, 4, { text: s, hyperlink: `#'${target}'!A1` });
    link.font = { color: { argb: 'FF0284C7' }, underline: true };
  });
  note(ws, 32, [
    'Hinweis: Excel Quest ist ein ergänzender Praxiskurs und kein offizieller Vorbereitungskurs für die Befähigungsprüfung.',
    'Alle Zahlen sind vereinfachte Übungsbeispiele (keine Steuer- oder Rechtsberatung).',
  ]);
  ws.getCell('A32').font = { italic: true, color: { argb: C.grey } };
  ws.getCell('A33').font = { italic: true, color: { argb: C.grey } };
}

// ---------------------------------------------------------------- 02_Grundlagen
{
  const ws = sheet('02_Grundlagen', 'FF0EA5E9');
  ws.columns = [{ width: 4 }, { width: 18 }, { width: 14 }, { width: 10 }, { width: 4 }, { width: 30 }, { width: 16 }, { width: 13 }, { width: 4 }, { width: 18 }];
  title(ws, 'Tag 1 – Excel-Grundlagen', 'Zellen, Zeilen, Spalten · Daten eingeben · Getränkeinventur');

  section(ws, 4, 'Aufgabe 1.2 – Zellen finden', 10);
  note(ws, 5, ['Schau dir die kleine Tabelle an und beantworte die Fragen in den gelben Feldern (Spalte G).']);
  header(ws, 6, 2, ['Getränk', 'Einheit', 'Preis']);
  const mini: [string, string, number][] = [
    ['Melange', 'Tasse', 3.9],
    ['Cola', '0,33 l', 3.6],
    ['Mineralwasser', '0,33 l', 3],
    ['Bier', '0,5 l', 4.8],
  ];
  mini.forEach((r, i) => r.forEach((v, j) => put(ws, 7 + i, 2 + j, v)));
  header(ws, 6, 6, ['Frage', 'Deine Antwort', 'Check']);
  const q: [string, string][] = [
    ['Was steht in Zelle B9?', 'G7="Mineralwasser"'],
    ['Was steht in Zelle D10?', 'G8=4.8'],
    ['In welcher Zelle steht „Cola“?', 'G9="B8"'],
  ];
  q.forEach(([text, cond], i) => {
    put(ws, 7 + i, 6, text);
    input(ws, 7 + i, 7);
    key(ws, 7 + i, 7, ['Mineralwasser', 4.8, 'B8'][i]);
    check(ws, 7 + i, 8, [`G${7 + i}`], [cond]);
  });
  solutionHeader(ws, 6, 10, ['Lösung']);
  ['Mineralwasser', '4,8', 'B8'].forEach((s, i) => put(ws, 7 + i, 10, s, { kind: 'solution' }));

  section(ws, 12, 'Aufgabe 1.3 – Getränkeinventur anlegen', 10);
  note(ws, 13, [
    'Notizen vom Lagerrundgang: Cola 0,33 l – 48 Flaschen · Mineralwasser 0,33 l – 60 Flaschen · Apfelsaft 1 l – 12 Flaschen',
    'Bier 50-l-Fass – 3 Fässer · Weißwein 0,75 l – 18 Flaschen · Kaffeebohnen 1 kg – 5 Packungen',
    'Übertrage die Notizen in die Tabelle: Artikel, Einheit und Bestand (nur die Zahl!). Tipp: Enter = nach unten, Tab = nach rechts.',
  ]);
  header(ws, 16, 2, ['Artikel', 'Einheit', 'Bestand', '', 'Check (Bestand)']);
  ws.getRow(16).getCell(5).fill = fill(C.white);
  const inv: [string, string, number][] = [
    ['Cola', '0,33 l', 48],
    ['Mineralwasser', '0,33 l', 60],
    ['Apfelsaft', '1 l', 12],
    ['Bier', '50-l-Fass', 3],
    ['Weißwein', '0,75 l', 18],
    ['Kaffeebohnen', '1 kg', 5],
  ];
  inv.forEach(([, , n], i) => {
    const row = 17 + i;
    input(ws, row, 2);
    input(ws, row, 3);
    input(ws, row, 4);
    key(ws, row, 4, n);
    check(ws, row, 6, [`D${row}`], [`D${row}=${n}`]);
  });
  solutionHeader(ws, 16, 8, ['Lösung', '', 'Bestand']);
  inv.forEach(([a, e, n], i) => {
    put(ws, 17 + i, 8, a, { kind: 'solution' });
    put(ws, 17 + i, 9, e, { kind: 'solution' });
    put(ws, 17 + i, 10, n, { kind: 'solution' });
  });

  section(ws, 24, 'Aufgabe 1.4 – Navigieren & Speichern', 10);
  note(ws, 25, [
    '1. Drücke Strg+Pos1 (Mac: Fn+Ctrl+←) – du springst zu Zelle A1.',
    '2. Wechsle mit Strg+Bild↓ ins nächste Blatt und mit Strg+Bild↑ zurück (oder klick unten auf die Blattregister).',
    '3. Klicke in B17 und drücke Strg+↓ – du springst zum Ende deiner Inventurliste.',
    '4. Korrigiere den Fehler: Doppelklick (oder F2) auf eine Zelle, ändern, Enter. Rückgängig machen: Strg+Z.',
    '5. Speichere die Datei über Datei → Speichern unter als „Excel_Quest_DeinName.xlsx“. Danach reicht Strg+S.',
  ]);
}

// ---------------------------------------------------------------- 03_Formatierung
{
  const ws = sheet('03_Formatierung', 'FFEAB308');
  // absichtlich zu schmale Spalten für die Übung „Spaltenbreite“
  ws.columns = [{ width: 4 }, { width: 9 }, { width: 7 }, { width: 8 }, { width: 8 }, { width: 4 }, { width: 22 }, { width: 10 }, { width: 14 }, { width: 10 }];
  title(ws, 'Tag 2 – Formatieren', 'Getränkepreisliste professionell gestalten (Aufgaben 2.1 bis 2.4)');
  note(ws, 3, [
    'Links: deine unformatierte Preisliste (B6:E12). Rechts: das Vorbild, so könnte sie am Ende aussehen.',
    'Aufgabe 2.1: Überschriftenzeile (B6:E6) fett, Schriftgröße 12, zentriert.   Aufgabe 2.2: Rahmen um die ganze Tabelle + Füllfarbe für die Überschrift.',
    'Aufgabe 2.3: Preise (D7:D12) als Währung €, USt-Satz (E7:E12) als Prozent.   Aufgabe 2.4: Spaltenbreiten anpassen (Doppelklick auf die Spaltengrenze).',
  ]);
  const rows: [string, string, number, number][] = [
    ['Melange', 'Tasse', 3.9, 0.2],
    ['Verlängerter', 'Tasse', 3.6, 0.2],
    ['Cola', '0,33 l', 3.6, 0.2],
    ['Mineralwasser', '0,33 l', 3, 0.2],
    ['Bier (Krügerl)', '0,5 l', 4.8, 0.2],
    ['Apfelsaft gespritzt', '0,5 l', 3.6, 0.2],
  ];
  const head = ['Getränk', 'Menge', 'Preis (brutto)', 'USt-Satz'];
  head.forEach((h, i) => (ws.getRow(6).getCell(2 + i).value = h));
  rows.forEach((r, i) => r.forEach((v, j) => (ws.getRow(7 + i).getCell(2 + j).value = v)));

  head.forEach((h, i) => {
    const c = ws.getRow(6).getCell(7 + i);
    c.value = h;
    c.font = { bold: true, size: 12, color: { argb: C.white } };
    c.fill = fill(C.green);
    c.alignment = { horizontal: 'center' };
    c.border = allBorders;
  });
  rows.forEach((r, i) =>
    r.forEach((v, j) => {
      const c = ws.getRow(7 + i).getCell(7 + j);
      c.value = v;
      c.border = allBorders;
      if (j === 2) c.numFmt = EUR;
      if (j === 3) {
        c.numFmt = PCT;
        c.alignment = { horizontal: 'center' };
      }
      if (i % 2 === 1) c.fill = fill(C.greenLight);
    }),
  );
}

// ---------------------------------------------------------------- 04_Formeln
{
  const ws = sheet('04_Formeln', 'FFEF4444');
  ws.columns = [{ width: 4 }, { width: 22 }, { width: 16 }, { width: 13 }, { width: 13 }, { width: 13 }, { width: 13 }, { width: 11 }, { width: 4 }, { width: 18 }, { width: 18 }];
  title(ws, 'Tag 3 – Rechnen mit Formeln', 'Jede Formel beginnt mit = · Zellbezüge statt fixer Zahlen');

  section(ws, 4, 'Aufgaben 3.1 + 3.2 – Lagerbewegung', 11);
  note(ws, 5, ['3.1: Verfügbar (F) = Anfangsbestand + Lieferung, z. B. in F8: =C8+D8     3.2: Endbestand (G) = Verfügbar − Verbrauch, z. B. =F8-E8']);
  header(ws, 6, 2, ['Artikel', 'Anfangsbestand', 'Lieferung', 'Verbrauch', 'Verfügbar', 'Endbestand', 'Check']);
  // Beispielzeile
  put(ws, 7, 2, 'Beispiel: Orangensaft', { kind: 'example' });
  put(ws, 7, 3, 10, { kind: 'example' });
  put(ws, 7, 4, 6, { kind: 'example' });
  put(ws, 7, 5, 7, { kind: 'example' });
  put(ws, 7, 6, { formula: 'C7+D7', result: 16 }, { kind: 'example' });
  put(ws, 7, 7, { formula: 'F7-E7', result: 9 }, { kind: 'example' });
  const stock: [string, number, number, number][] = [
    ['Cola', 48, 24, 30],
    ['Mineralwasser', 60, 24, 41],
    ['Apfelsaft', 12, 6, 9],
    ['Weißwein', 18, 12, 14],
    ['Bier (Fässer)', 3, 2, 3],
  ];
  solutionHeader(ws, 6, 10, ['Lösung Verfügbar', 'Lösung Endbestand']);
  stock.forEach(([a, s, l, v], i) => {
    const row = 8 + i;
    put(ws, row, 2, a);
    put(ws, row, 3, s);
    put(ws, row, 4, l);
    put(ws, row, 5, v);
    input(ws, row, 6);
    input(ws, row, 7);
    key(ws, row, 6, `=C${row}+D${row}`);
    key(ws, row, 7, `=F${row}-E${row}`);
    check(ws, row, 8, [`F${row}`, `G${row}`], [`F${row}=${s + l}`, `G${row}=${s + l - v}`]);
    put(ws, row, 10, `=C${row}+D${row} → ${s + l}`, { kind: 'solution' });
    put(ws, row, 11, `=F${row}-E${row} → ${s + l - v}`, { kind: 'solution' });
  });

  section(ws, 14, 'Aufgaben 3.3 + 3.4 – Getränkeumsatz eines Tages', 11);
  note(ws, 15, [
    '3.3: Umsatz (E) = verkaufte Menge × Preis. Tippe in E17: =C17*D17 und Enter.   3.4: Kopiere die Formel mit dem Ausfüllkästchen bis E22 nach unten.',
  ]);
  header(ws, 16, 2, ['Getränk', 'verkauft (Stk.)', 'Preis (brutto)', 'Umsatz', '', '', 'Check']);
  ws.getRow(16).getCell(6).fill = fill(C.white);
  ws.getRow(16).getCell(7).fill = fill(C.white);
  const sales: [string, number, number][] = [
    ['Melange', 64, 3.9],
    ['Verlängerter', 38, 3.6],
    ['Cola', 45, 3.6],
    ['Mineralwasser', 52, 3],
    ['Bier (Krügerl)', 71, 4.8],
    ['Apfelsaft gespritzt', 40, 3.6],
  ];
  solutionHeader(ws, 16, 10, ['Lösungsformel', 'Ergebnis']);
  sales.forEach(([a, m, p], i) => {
    const row = 17 + i;
    put(ws, row, 2, a);
    put(ws, row, 3, m);
    put(ws, row, 4, p, { fmt: EUR });
    input(ws, row, 5, EUR);
    key(ws, row, 5, `=C${row}*D${row}`);
    check(ws, row, 8, [`E${row}`], [numEq(`E${row}`, r2(m * p))]);
    put(ws, row, 10, `=C${row}*D${row}`, { kind: 'solution' });
    put(ws, row, 11, r2(m * p), { kind: 'solution', fmt: EUR });
  });

  section(ws, 24, 'Aufgabe 3.3 (Teil 2) – Preis pro Liter (Division)', 11);
  note(ws, 25, ['Preis pro Liter = Flaschenpreis ÷ Inhalt. Tippe in E27: =C27/D27 und kopiere nach unten.']);
  header(ws, 26, 2, ['Produkt', 'Flaschenpreis', 'Inhalt (Liter)', 'Preis pro Liter', '', '', 'Check']);
  ws.getRow(26).getCell(6).fill = fill(C.white);
  ws.getRow(26).getCell(7).fill = fill(C.white);
  const liter: [string, number, number][] = [
    ['Apfelsaft 1,5 l', 2.7, 1.5],
    ['Olivenöl 0,75 l', 8.4, 0.75],
    ['Rotwein 0,75 l', 6, 0.75],
  ];
  solutionHeader(ws, 26, 10, ['Lösungsformel', 'Ergebnis']);
  liter.forEach(([a, p, l], i) => {
    const row = 27 + i;
    put(ws, row, 2, a);
    put(ws, row, 3, p, { fmt: EUR });
    put(ws, row, 4, l);
    input(ws, row, 5, EUR);
    key(ws, row, 5, `=C${row}/D${row}`);
    check(ws, row, 8, [`E${row}`], [numEq(`E${row}`, r2(p / l))]);
    put(ws, row, 10, `=C${row}/D${row}`, { kind: 'solution' });
    put(ws, row, 11, r2(p / l), { kind: 'solution', fmt: EUR });
  });
}

// ---------------------------------------------------------------- 05_Funktionen
{
  const ws = sheet('05_Funktionen', 'FF8B5CF6');
  ws.columns = [{ width: 4 }, { width: 18 }, { width: 16 }, { width: 18 }, { width: 13 }, { width: 4 }, { width: 26 }, { width: 26 }];
  title(ws, 'Tag 4 – Funktionen', 'SUMME · MITTELWERT · MIN · MAX (englisches Excel: SUM, AVERAGE, MIN, MAX)');
  section(ws, 4, 'Aufgaben 4.1 bis 4.3 – Getränkeverkäufe einer Woche', 8);
  note(ws, 5, ['4.1: Zeile 14 mit =SUMME(C7:C13)   4.2: Zeile 15 mit =MITTELWERT(…)   4.3: Zeile 16/17 mit =MIN(…) und =MAX(…). Spalte D genauso!']);
  header(ws, 6, 2, ['Tag', 'verkaufte Getränke', 'Getränkeumsatz', 'Check']);
  const week: [string, number, number][] = [
    ['Montag', 182, 712.4],
    ['Dienstag', 165, 640.2],
    ['Mittwoch', 201, 785.6],
    ['Donnerstag', 224, 874.3],
    ['Freitag', 310, 1215.8],
    ['Samstag', 356, 1398.5],
    ['Sonntag', 248, 968.7],
  ];
  week.forEach(([d, n, u], i) => {
    put(ws, 7 + i, 2, d);
    put(ws, 7 + i, 3, n);
    put(ws, 7 + i, 4, u, { fmt: EUR });
  });
  const nums = week.map((w) => w[1]);
  const eur = week.map((w) => w[2]);
  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const stats: [string, string, string, number, number][] = [
    ['SUMME', 'SUMME', 'SUM', sum(nums), sum(eur)],
    ['MITTELWERT', 'MITTELWERT', 'AVERAGE', sum(nums) / 7, sum(eur) / 7],
    ['MIN', 'MIN', 'MIN', Math.min(...nums), Math.min(...eur)],
    ['MAX', 'MAX', 'MAX', Math.max(...nums), Math.max(...eur)],
  ];
  solutionHeader(ws, 6, 7, ['Lösung verkaufte Getränke', 'Lösung Getränkeumsatz']);
  stats.forEach(([label, de, , a, b], i) => {
    const row = 14 + i;
    const c = put(ws, row, 2, label);
    c.font = { bold: true };
    input(ws, row, 3, i === 1 ? '0.0' : '0');
    input(ws, row, 4, EUR);
    key(ws, row, 3, `=${stats[i][2]}(C7:C13)`);
    key(ws, row, 4, `=${stats[i][2]}(D7:D13)`);
    check(ws, row, 5, [`C${row}`, `D${row}`], [numEq(`C${row}`, a, 1), numEq(`D${row}`, b)]);
    put(ws, row, 7, `=${de}(C7:C13) → ${Number(a.toFixed(1)).toLocaleString('de-AT')}`, { kind: 'solution' });
    put(ws, row, 8, `=${de}(D7:D13) → ${r2(b).toLocaleString('de-AT', { minimumFractionDigits: 2 })} €`, { kind: 'solution' });
  });

  section(ws, 19, 'Aufgabe 4.4 – Finde den Fehler!', 8);
  note(ws, 20, [
    'Die Summe in D28 ist falsch. Klicke auf D28 und drücke F2: Welche Zeile fehlt im Bereich? Korrigiere die Formel, bis im Check ✓ erscheint.',
  ]);
  header(ws, 21, 2, ['Kategorie', '', 'Speisenumsatz', 'Check']);
  ws.getRow(21).getCell(3).fill = fill(C.head);
  const food: [string, number][] = [
    ['Suppen', 186],
    ['Hauptspeisen', 1240.5],
    ['Desserts', 312.4],
    ['Salate', 158.9],
    ['Kindergerichte', 96],
    ['Tagesteller', 410.6],
  ];
  food.forEach(([k, v], i) => {
    put(ws, 22 + i, 2, k);
    put(ws, 22 + i, 3, '');
    put(ws, 22 + i, 4, v, { fmt: EUR });
  });
  const wrong = r2(sum(food.slice(0, 5).map((f) => f[1])));
  const right = r2(sum(food.map((f) => f[1])));
  put(ws, 28, 2, 'Gesamt').font = { bold: true };
  put(ws, 28, 3, '');
  const tot = put(ws, 28, 4, { formula: 'SUM(D22:D26)', result: wrong }, { kind: 'input', fmt: EUR });
  tot.font = { bold: true };
  put(ws, 28, 5, { formula: `IF(ROUND(D28,2)=${right},"✓ richtig","✗ prüfen")`, result: '✗ prüfen' }).font = { bold: true, color: { argb: C.green } };
  key(ws, 28, 4, '=SUM(D22:D27)');
  solutionHeader(ws, 21, 7, ['Lösung']);
  put(ws, 22, 7, `=SUMME(D22:D27) → ${right.toLocaleString('de-AT', { minimumFractionDigits: 2 })} €`, { kind: 'solution' });
  put(ws, 23, 7, 'Fehler: D27 (Tagesteller) fehlte', { kind: 'solution' });
}

// ---------------------------------------------------------------- 06_Kalkulation
{
  const ws = sheet('06_Kalkulation', 'FFF97316');
  ws.columns = [{ width: 4 }, { width: 22 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 11 }, { width: 4 }, { width: 26 }, { width: 22 }];
  title(ws, 'Tag 5 + 6 – Prozente & Gastro-Kalkulation', 'Annahmen für alle Beispiele: Getränke 20 % USt, Speisen 10 % USt. Vereinfachte Übungszahlen.');

  // ---- 5.1
  section(ws, 4, 'TEIL A · Aufgabe 5.1 – Prozentwert berechnen (Prozentwert = Grundwert × Prozentsatz)', 13);
  header(ws, 5, 2, ['Situation', 'Grundwert', 'Prozentsatz', 'Prozentwert', '', '', '', '', 'Check']);
  for (let c = 6; c <= 9; c++) ws.getRow(5).getCell(c).fill = fill(C.white);
  const pw: [string, number, number][] = [
    ['Trinkgeld auf Rechnung', 85, 0.1],
    ['Wareneinsatz vom Monatsumsatz', 24000, 0.3],
    ['USt auf Nettopreis', 4, 0.2],
  ];
  solutionHeader(ws, 5, 12, ['Lösungsformel', 'Ergebnis']);
  pw.forEach(([s, g, p], i) => {
    const row = 6 + i;
    put(ws, row, 2, s);
    put(ws, row, 3, g, { fmt: EUR });
    put(ws, row, 4, p, { fmt: PCT });
    input(ws, row, 5, EUR);
    key(ws, row, 5, `=C${row}*D${row}`);
    check(ws, row, 10, [`E${row}`], [numEq(`E${row}`, g * p)]);
    put(ws, row, 12, `=C${row}*D${row}`, { kind: 'solution' });
    put(ws, row, 13, r2(g * p), { kind: 'solution', fmt: EUR });
  });

  // ---- 5.2
  section(ws, 10, 'Aufgabe 5.2 – Anteil berechnen (Anteil = Teil ÷ Ganzes, dann als % formatieren)', 13);
  header(ws, 11, 2, ['Bereich', 'Tagesumsatz', 'Anteil', '', '', '', '', '', 'Check']);
  for (let c = 5; c <= 9; c++) ws.getRow(11).getCell(c).fill = fill(C.white);
  const share: [string, number][] = [
    ['Getränke', 1189.2],
    ['Speisen', 1486.5],
    ['Desserts', 297.3],
  ];
  const total = r2(share.reduce((a, s) => a + s[1], 0));
  solutionHeader(ws, 11, 12, ['Lösungsformel', 'Ergebnis']);
  share.forEach(([b, v], i) => {
    const row = 12 + i;
    put(ws, row, 2, b);
    put(ws, row, 3, v, { fmt: EUR });
    input(ws, row, 4, PCT);
    key(ws, row, 4, `=C${row}/$C$15`);
    check(ws, row, 10, [`D${row}`], [numEq(`D${row}`, v / total, 3)]);
    put(ws, row, 12, `=C${row}/C15`, { kind: 'solution' });
    put(ws, row, 13, v / total, { kind: 'solution', fmt: PCT });
  });
  put(ws, 15, 2, 'Gesamt').font = { bold: true };
  put(ws, 15, 3, { formula: 'SUM(C12:C14)', result: total }, { fmt: EUR }).font = { bold: true };

  // ---- 5.3
  section(ws, 17, 'Aufgabe 5.3 – Preiserhöhung & Happy Hour (mit $-Bezug!)', 13);
  note(ws, 18, ['Neuer Preis = Preis × (1 + Erhöhung). Happy-Hour-Preis = Preis × (1 − Rabatt). Verwende $C$19 bzw. $C$20, damit du die Formel kopieren kannst.']);
  put(ws, 19, 2, 'Preiserhöhung:').font = { bold: true };
  put(ws, 19, 3, 0.05, { fmt: PCT, kind: 'example' });
  put(ws, 20, 2, 'Happy-Hour-Rabatt:').font = { bold: true };
  put(ws, 20, 3, 0.2, { fmt: PCT, kind: 'example' });
  header(ws, 21, 2, ['Artikel', 'Preis aktuell', 'Preis + 5 %', 'Happy Hour − 20 %', '', '', '', '', 'Check']);
  for (let c = 6; c <= 9; c++) ws.getRow(21).getCell(c).fill = fill(C.white);
  const inc: [string, number][] = [
    ['Melange', 3.9],
    ['Cola 0,33 l', 3.6],
    ['Bier (Krügerl)', 4.8],
  ];
  solutionHeader(ws, 21, 12, ['Lösung Preis + 5 %', 'Lösung Happy Hour']);
  inc.forEach(([a, p], i) => {
    const row = 22 + i;
    put(ws, row, 2, a);
    put(ws, row, 3, p, { fmt: EUR });
    input(ws, row, 4, EUR);
    input(ws, row, 5, EUR);
    key(ws, row, 4, `=C${row}*(1+$C$19)`);
    key(ws, row, 5, `=C${row}*(1-$C$20)`);
    check(ws, row, 10, [`D${row}`, `E${row}`], [numEq(`D${row}`, p * 1.05), numEq(`E${row}`, p * 0.8)]);
    put(ws, row, 12, `=C${row}*(1+$C$19) → ${r2(p * 1.05).toFixed(2).replace('.', ',')} €`, { kind: 'solution' });
    put(ws, row, 13, `=C${row}*(1-$C$20) → ${r2(p * 0.8).toFixed(2).replace('.', ',')} €`, { kind: 'solution' });
  });

  // ---- 5.4
  section(ws, 26, 'Aufgabe 5.4 – Aufschlag vs. Spanne', 13);
  note(ws, 27, ['Aufschlag = (VK netto − EK) ÷ EK  (bezogen auf den Einkaufspreis)     Spanne = (VK netto − EK) ÷ VK netto  (bezogen auf den Verkaufspreis)']);
  header(ws, 28, 2, ['Artikel', 'EK netto', 'VK netto', 'Aufschlag %', 'Spanne %', '', '', '', 'Check']);
  for (let c = 7; c <= 9; c++) ws.getRow(28).getCell(c).fill = fill(C.white);
  const mk: [string, number, number][] = [
    ['Cola 0,33 l', 0.6, 3],
    ['Mineralwasser 0,33 l', 0.45, 2.5],
    ['Bier (Krügerl)', 1.2, 4],
  ];
  solutionHeader(ws, 28, 12, ['Lösung Aufschlag', 'Lösung Spanne']);
  mk.forEach(([a, ek, vk], i) => {
    const row = 29 + i;
    put(ws, row, 2, a);
    put(ws, row, 3, ek, { fmt: EUR });
    put(ws, row, 4, vk, { fmt: EUR });
    input(ws, row, 5, PCT2);
    input(ws, row, 6, PCT2);
    key(ws, row, 5, `=(D${row}-C${row})/C${row}`);
    key(ws, row, 6, `=(D${row}-C${row})/D${row}`);
    const auf = (vk - ek) / ek;
    const sp = (vk - ek) / vk;
    check(ws, row, 10, [`E${row}`, `F${row}`], [numEq(`E${row}`, auf, 4), numEq(`F${row}`, sp, 4)]);
    put(ws, row, 12, `=(D${row}-C${row})/C${row} → ${(auf * 100).toFixed(2).replace('.', ',')} %`, { kind: 'solution' });
    put(ws, row, 13, `=(D${row}-C${row})/D${row} → ${(sp * 100).toFixed(2).replace('.', ',')} %`, { kind: 'solution' });
  });

  // ---- 6.1
  section(ws, 33, 'TEIL B · Aufgabe 6.1 – Netto, USt und Brutto', 13);
  note(ws, 34, [
    'a) Netto → Brutto: USt-Betrag = Netto × USt-Satz; Brutto = Netto × (1 + USt-Satz)',
    'b) Brutto → Netto: Netto = Brutto ÷ (1 + USt-Satz)  – NICHT Brutto × 0,8!   USt-Betrag = Brutto − Netto',
  ]);
  header(ws, 36, 2, ['a) Artikel', 'USt-Satz', 'Netto', 'USt-Betrag', 'Brutto', '', '', '', 'Check']);
  for (let c = 7; c <= 9; c++) ws.getRow(36).getCell(c).fill = fill(C.white);
  const nb: [string, number, number][] = [
    ['Kaiserschmarrn', 0.1, 12],
    ['Melange', 0.2, 3.25],
  ];
  solutionHeader(ws, 36, 12, ['Lösung USt-Betrag', 'Lösung Brutto']);
  nb.forEach(([a, u, n], i) => {
    const row = 37 + i;
    put(ws, row, 2, a);
    put(ws, row, 3, u, { fmt: PCT });
    put(ws, row, 4, n, { fmt: EUR });
    input(ws, row, 5, EUR);
    input(ws, row, 6, EUR);
    key(ws, row, 5, `=D${row}*C${row}`);
    key(ws, row, 6, `=D${row}*(1+C${row})`);
    check(ws, row, 10, [`E${row}`, `F${row}`], [numEq(`E${row}`, n * u), numEq(`F${row}`, n * (1 + u))]);
    put(ws, row, 12, `=D${row}*C${row} → ${r2(n * u).toFixed(2).replace('.', ',')} €`, { kind: 'solution' });
    put(ws, row, 13, `=D${row}*(1+C${row}) → ${r2(n * (1 + u)).toFixed(2).replace('.', ',')} €`, { kind: 'solution' });
  });
  header(ws, 40, 2, ['b) Artikel', 'USt-Satz', 'Brutto', 'Netto', 'USt-Betrag', '', '', '', 'Check']);
  for (let c = 7; c <= 9; c++) ws.getRow(40).getCell(c).fill = fill(C.white);
  const bn: [string, number, number][] = [
    ['Bier (Krügerl)', 0.2, 4.8],
    ['Tagesteller', 0.1, 11.9],
  ];
  solutionHeader(ws, 40, 12, ['Lösung Netto', 'Lösung USt-Betrag']);
  bn.forEach(([a, u, b], i) => {
    const row = 41 + i;
    const n = b / (1 + u);
    put(ws, row, 2, a);
    put(ws, row, 3, u, { fmt: PCT });
    put(ws, row, 4, b, { fmt: EUR });
    input(ws, row, 5, EUR);
    input(ws, row, 6, EUR);
    key(ws, row, 5, `=D${row}/(1+C${row})`);
    key(ws, row, 6, `=D${row}-E${row}`);
    check(ws, row, 10, [`E${row}`, `F${row}`], [numEq(`E${row}`, n), numEq(`F${row}`, b - n)]);
    put(ws, row, 12, `=D${row}/(1+C${row}) → ${r2(n).toFixed(2).replace('.', ',')} €`, { kind: 'solution' });
    put(ws, row, 13, `=D${row}-E${row} → ${r2(b - n).toFixed(2).replace('.', ',')} €`, { kind: 'solution' });
  });

  // ---- 6.2
  section(ws, 44, 'Aufgabe 6.2 – Getränkekalkulation', 13);
  note(ws, 45, [
    'EK pro Portion = Gebindepreis ÷ Inhalt × Portion · VK netto = VK brutto ÷ 1,2 · Rohertrag = VK netto − EK pro Portion · Wareneinsatz % = EK pro Portion ÷ VK netto',
  ]);
  header(ws, 46, 2, ['Getränk', 'Gebinde EK netto', 'Inhalt (l)', 'Portion (l)', 'EK pro Portion', 'VK brutto', 'VK netto', 'Rohertrag', 'Wareneinsatz %', 'Check']);
  const bev: [string, number, number, number, number][] = [
    ['Bier vom Fass', 120, 50, 0.5, 4.8],
    ['Hauswein weiß (Achterl)', 40, 10, 0.125, 3.6],
    ['Mineralwasser (Glas)', 0.8, 1, 0.25, 2.4],
  ];
  solutionHeader(ws, 46, 12, ['Lösung EK / VK netto', 'Lösung Rohertrag / WE %']);
  bev.forEach(([a, g, inh, por, vkb], i) => {
    const row = 47 + i;
    const ek = (g / inh) * por;
    const vkn = vkb / 1.2;
    put(ws, row, 2, a);
    put(ws, row, 3, g, { fmt: EUR });
    put(ws, row, 4, inh);
    put(ws, row, 5, por);
    input(ws, row, 6, '#,##0.000 "€"');
    put(ws, row, 7, vkb, { fmt: EUR });
    input(ws, row, 8, EUR);
    input(ws, row, 9, EUR);
    input(ws, row, 10, PCT2);
    key(ws, row, 6, `=C${row}/D${row}*E${row}`);
    key(ws, row, 8, `=G${row}/1.2`);
    key(ws, row, 9, `=H${row}-F${row}`);
    key(ws, row, 10, `=F${row}/H${row}`);
    check(ws, row, 11, [`F${row}`, `H${row}`, `I${row}`, `J${row}`], [numEq(`F${row}`, ek, 3), numEq(`H${row}`, vkn), numEq(`I${row}`, vkn - ek), numEq(`J${row}`, ek / vkn, 4)]);
    put(ws, row, 12, `=C${row}/D${row}*E${row} → ${ek.toFixed(3).replace('.', ',')} € | =G${row}/1,2 → ${vkn.toFixed(2).replace('.', ',')} €`, { kind: 'solution' });
    put(ws, row, 13, `=H${row}-F${row} → ${(vkn - ek).toFixed(2).replace('.', ',')} € | =F${row}/H${row} → ${((ek / vkn) * 100).toFixed(2).replace('.', ',')} %`, { kind: 'solution' });
  });
  ws.getColumn(11).width = 11;

  // ---- 6.3
  section(ws, 51, 'Aufgabe 6.3 – Food Cost: Kaiserschmarrn mit Zwetschkenröster (Rezept für 4 Portionen)', 13);
  note(ws, 52, ['Kosten = Menge × Preis pro Einheit. Danach: Gesamtkosten (SUMME), Kosten pro Portion (÷ 4), Wareneinsatz % (÷ VK netto).']);
  header(ws, 53, 2, ['Zutat', 'Menge', 'Einheit', 'Preis/Einheit', 'Kosten', '', '', '', 'Check']);
  for (let c = 7; c <= 9; c++) ws.getRow(53).getCell(c).fill = fill(C.white);
  const recipe: [string, number, string, number][] = [
    ['Mehl', 0.25, 'kg', 1.2],
    ['Milch', 0.5, 'l', 1.4],
    ['Eier', 6, 'Stk.', 0.35],
    ['Kristallzucker', 0.06, 'kg', 1.5],
    ['Butter', 0.08, 'kg', 9.5],
    ['Rosinen', 0.04, 'kg', 8],
    ['Staubzucker', 0.02, 'kg', 2.2],
    ['Zwetschkenröster', 0.4, 'kg', 6.5],
  ];
  solutionHeader(ws, 53, 12, ['Lösungsformel', 'Ergebnis']);
  recipe.forEach(([z, m, e, p], i) => {
    const row = 54 + i;
    put(ws, row, 2, z);
    put(ws, row, 3, m);
    put(ws, row, 4, e);
    put(ws, row, 5, p, { fmt: EUR });
    input(ws, row, 6, '#,##0.000 "€"');
    key(ws, row, 6, `=C${row}*E${row}`);
    check(ws, row, 10, [`F${row}`], [numEq(`F${row}`, m * p, 3)]);
    put(ws, row, 12, `=C${row}*E${row}`, { kind: 'solution' });
    put(ws, row, 13, m * p, { kind: 'solution', fmt: '#,##0.000 "€"' });
  });
  const totalCost = recipe.reduce((a, r) => a + r[1] * r[3], 0);
  const perPortion = totalCost / 4;
  const vkNetto = 13.2 / 1.1;
  const sumRows: [string, number, string, string, string][] = [
    ['Gesamtkosten (4 Portionen)', totalCost, '#,##0.000 "€"', '=SUMME(F54:F61)', '6,914 €'],
    ['Kosten pro Portion', perPortion, '#,##0.000 "€"', '=F62/4', '1,729 €'],
    ['VK brutto (10 % USt)', 13.2, EUR, '(gegeben)', '13,20 €'],
    ['VK netto', vkNetto, EUR, '=F64/1,1', '12,00 €'],
    ['Wareneinsatz %', perPortion / vkNetto, PCT2, '=F63/F65', '14,40 %'],
  ];
  sumRows.forEach(([l, v, fmt, f, res], i) => {
    const row = 62 + i;
    put(ws, row, 2, l).font = { bold: true };
    if (i === 2) put(ws, row, 6, 13.2, { fmt: EUR });
    else {
      input(ws, row, 6, fmt);
      key(ws, row, 6, ['=SUM(F54:F61)', '=F62/4', '', '=F64/1.1', '=F63/F65'][i]);
      check(ws, row, 10, [`F${row}`], [numEq(`F${row}`, v, i === 4 ? 4 : 3)]);
    }
    put(ws, row, 12, f, { kind: 'solution' });
    put(ws, row, 13, res, { kind: 'solution' });
  });
  note(ws, 67, ['Annahme: Nur Zutatenkosten (Wareneinsatz). Energie, Personal und Miete sind hier NICHT enthalten.']);

  // ---- 6.4
  section(ws, 69, 'Aufgabe 6.4 – Umsatz & Rohertrag vergleichen: Was bringt am meisten?', 13);
  note(ws, 70, ['Umsatz netto = verkauft × VK netto · Rohertrag/Stk. = VK netto − EK · Rohertrag gesamt = verkauft × Rohertrag/Stk.']);
  header(ws, 71, 2, ['Produkt', 'verkauft', 'VK netto', 'EK pro Stk.', 'Umsatz netto', 'Rohertrag/Stk.', 'Rohertrag gesamt', '', 'Check']);
  ws.getRow(71).getCell(9).fill = fill(C.white);
  const prod: [string, number, number, number][] = [
    ['Melange', 64, 3.25, 0.4],
    ['Bier (Krügerl)', 71, 4, 1.2],
    ['Cola 0,33 l', 45, 3, 0.6],
    ['Mineralwasser 0,33 l', 52, 2.5, 0.45],
    ['Kaiserschmarrn', 18, 12, 1.73],
  ];
  solutionHeader(ws, 71, 12, ['Lösung Umsatz | RE/Stk.', 'Lösung RE gesamt']);
  let tU = 0;
  let tR = 0;
  prod.forEach(([a, n, vk, ek], i) => {
    const row = 72 + i;
    put(ws, row, 2, a);
    put(ws, row, 3, n);
    put(ws, row, 4, vk, { fmt: EUR });
    put(ws, row, 5, ek, { fmt: EUR });
    input(ws, row, 6, EUR);
    input(ws, row, 7, EUR);
    input(ws, row, 8, EUR);
    key(ws, row, 6, `=C${row}*D${row}`);
    key(ws, row, 7, `=D${row}-E${row}`);
    key(ws, row, 8, `=C${row}*G${row}`);
    tU += n * vk;
    tR += n * (vk - ek);
    check(ws, row, 10, [`F${row}`, `G${row}`, `H${row}`], [numEq(`F${row}`, n * vk), numEq(`G${row}`, vk - ek), numEq(`H${row}`, n * (vk - ek))]);
    put(ws, row, 12, `=C${row}*D${row} → ${r2(n * vk).toFixed(2).replace('.', ',')} € | =D${row}-E${row}`, { kind: 'solution' });
    put(ws, row, 13, `=C${row}*G${row} → ${r2(n * (vk - ek)).toFixed(2).replace('.', ',')} €`, { kind: 'solution' });
  });
  put(ws, 77, 2, 'Gesamt').font = { bold: true };
  input(ws, 77, 6, EUR);
  input(ws, 77, 8, EUR);
  key(ws, 77, 6, '=SUM(F72:F76)');
  key(ws, 77, 8, '=SUM(H72:H76)');
  check(ws, 77, 10, [`F77`, `H77`], [numEq('F77', tU), numEq('H77', tR)]);
  put(ws, 77, 12, `=SUMME(F72:F76) → ${r2(tU).toFixed(2).replace('.', ',')} €`, { kind: 'solution' });
  put(ws, 77, 13, `=SUMME(H72:H76) → ${r2(tR).toFixed(2).replace('.', ',')} €`, { kind: 'solution' });
  note(ws, 78, ['Frage zum Nachdenken: Welches Produkt bringt pro Stück am meisten Rohertrag – und welches insgesamt? (Lösung: pro Stück Kaiserschmarrn, insgesamt Bier)']);
}

// ---------------------------------------------------------------- 07_Abschluss
{
  const ws = sheet('07_Abschluss', 'FF15803D');
  ws.columns = [{ width: 4 }, { width: 22 }, { width: 10 }, { width: 12 }, { width: 10 }, { width: 14 }, { width: 14 }, { width: 12 }, { width: 15 }, { width: 14 }, { width: 11 }, { width: 4 }, { width: 34 }];
  title(ws, 'Tag 7 – Abschluss-Challenge: Tagesabrechnung Café Sonnenschein', 'Jetzt kombinierst du alles: Formeln, Funktionen, Prozente, Kalkulation und Formatierung.');
  note(ws, 3, [
    'Schritt 1: Umsatz brutto = verkauft × VK brutto      Schritt 2: Umsatz netto = Umsatz brutto ÷ (1 + USt-Satz)',
    'Schritt 3: Wareneinsatz = verkauft × EK pro Stk.      Schritt 4: Rohertrag = Umsatz netto − Wareneinsatz',
    'Schritt 5: Zeile 13 mit SUMME, Zeile 14 MITTELWERT, Zeile 15 MAX.      Schritt 6: Auswertung unten.      Schritt 7: Tabelle schön formatieren!',
  ]);
  header(ws, 6, 2, ['Artikel', 'verkauft', 'VK brutto', 'USt-Satz', 'EK pro Stk.', 'Umsatz brutto', 'Umsatz netto', 'Wareneinsatz', 'Rohertrag', 'Check']);
  const items: [string, number, number, number, number][] = [
    ['Melange', 58, 3.9, 0.2, 0.4],
    ['Cola 0,33 l', 36, 3.6, 0.2, 0.6],
    ['Bier (Krügerl)', 49, 4.8, 0.2, 1.2],
    ['Apfelstrudel', 22, 5.5, 0.1, 1.1],
    ['Gulasch mit Semmel', 27, 13.2, 0.1, 3.4],
    ['Tagessuppe', 19, 5.5, 0.1, 0.9],
  ];
  const rowsCalc = items.map(([a, n, vk, u, ek]) => {
    const ub = n * vk;
    const un = ub / (1 + u);
    const we = n * ek;
    return { a, ub, un, we, re: un - we };
  });
  const sol: string[] = [];
  items.forEach(([a, n, vk, u, ek], i) => {
    const row = 7 + i;
    const r = rowsCalc[i];
    put(ws, row, 2, a);
    put(ws, row, 3, n);
    put(ws, row, 4, vk, { fmt: EUR });
    put(ws, row, 5, u, { fmt: PCT });
    put(ws, row, 6, ek, { fmt: EUR });
    for (let c = 7; c <= 10; c++) input(ws, row, c, EUR);
    key(ws, row, 7, `=C${row}*D${row}`);
    key(ws, row, 8, `=G${row}/(1+E${row})`);
    key(ws, row, 9, `=C${row}*F${row}`);
    key(ws, row, 10, `=H${row}-I${row}`);
    check(ws, row, 11, [`G${row}`, `H${row}`, `I${row}`, `J${row}`], [numEq(`G${row}`, r.ub), numEq(`H${row}`, r.un), numEq(`I${row}`, r.we), numEq(`J${row}`, r.re)]);
    sol.push(`${a}: ${[r.ub, r.un, r.we, r.re].map((x) => r2(x).toFixed(2).replace('.', ',')).join(' | ')}`);
  });
  const col = (k: 'ub' | 'un' | 'we' | 're') => rowsCalc.map((r) => r[k]);
  const s = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const aggs: [string, (a: number[]) => number, string][] = [
    ['SUMME', s, 'SUMME'],
    ['MITTELWERT', (a) => s(a) / a.length, 'MITTELWERT'],
    ['MAX', (a) => Math.max(...a), 'MAX'],
  ];
  aggs.forEach(([label, fn], i) => {
    const row = 13 + i;
    put(ws, row, 2, label).font = { bold: true };
    const keys = ['ub', 'un', 'we', 're'] as const;
    keys.forEach((_, j) => {
      input(ws, row, 7 + j, EUR);
      key(ws, row, 7 + j, `=${['SUM', 'AVERAGE', 'MAX'][i]}(${colLetter(7 + j)}7:${colLetter(7 + j)}12)`);
    });
    check(
      ws,
      row,
      11,
      keys.map((_, j) => `${colLetter(7 + j)}${row}`),
      keys.map((k, j) => numEq(`${colLetter(7 + j)}${row}`, fn(col(k)))),
    );
    sol.push(`${label}: ${keys.map((k) => r2(fn(col(k))).toFixed(2).replace('.', ',')).join(' | ')}  (z. B. =${aggs[i][2]}(G7:G12))`);
  });

  section(ws, 17, 'Auswertung', 11);
  const drinksNet = s(rowsCalc.slice(0, 3).map((r) => r.un));
  const totalNet = s(col('un'));
  const ev: [string, number, string, string][] = [
    ['Umsatz netto Getränke (Zeilen 7–9)', drinksNet, EUR, '=SUMME(H7:H9)'],
    ['Anteil Getränke am Umsatz netto', drinksNet / totalNet, PCT2, '=H18/H13'],
    ['Rohertrag in % vom Umsatz netto (Spanne)', s(col('re')) / totalNet, PCT2, '=J13/H13'],
    ['Wareneinsatz % gesamt', s(col('we')) / totalNet, PCT2, '=I13/H13'],
  ];
  ev.forEach(([l, v, fmt, f], i) => {
    const row = 18 + i;
    put(ws, row, 2, l).font = { bold: true };
    ws.mergeCells(row, 2, row, 7);
    input(ws, row, 8, fmt);
    key(ws, row, 8, ['=SUM(H7:H9)', '=H18/H13', '=J13/H13', '=I13/H13'][i]);
    check(ws, row, 11, [`H${row}`], [numEq(`H${row}`, v, fmt === EUR ? 2 : 4)]);
    sol.push(`${l}: ${f} → ${fmt === EUR ? r2(v).toFixed(2).replace('.', ',') + ' €' : (v * 100).toFixed(2).replace('.', ',') + ' %'}`);
  });
  put(ws, 23, 2, 'Welches Produkt bringt den höchsten Rohertrag?').font = { bold: true };
  ws.mergeCells(23, 2, 23, 7);
  input(ws, 23, 8);
  const best = rowsCalc.reduce((a, b) => (b.re > a.re ? b : a));
  check(ws, 23, 11, ['H23'], [`H23="${best.a}"`]);
  key(ws, 23, 8, best.a);
  sol.push(`Höchster Rohertrag: ${best.a} (${r2(best.re).toFixed(2).replace('.', ',')} €)`);

  section(ws, 25, 'Formatierung (Tag 2 wiederholen)', 11);
  note(ws, 26, ['Überschrift fett · Rahmen um die Tabelle · €-Format für Beträge · Spaltenbreiten passend. Dann speichern!']);

  solutionHeader(ws, 5, 13, ['Lösung: Umsatz brutto | netto | Wareneinsatz | Rohertrag']);
  sol.forEach((t, i) => put(ws, 6 + i, 13, t, { kind: 'solution' }));
  ws.getColumn(13).width = 70;
}

// Reihenfolge prüfen & speichern
const names = wb.worksheets.map((w) => w.name);
if (JSON.stringify(names) !== JSON.stringify(SHEETS)) throw new Error('Blattnamen stimmen nicht: ' + names.join(', '));
await wb.xlsx.writeFile(OUT);
if (process.env.KEY_OUT) (await import('node:fs')).writeFileSync(process.env.KEY_OUT, JSON.stringify(KEY));
console.log('✓ geschrieben:', OUT, '\n  Blätter:', names.join(', '));
