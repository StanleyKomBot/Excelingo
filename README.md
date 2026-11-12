# Excel Quest

Ein 7-Tage-Excel-Kurs für Einsteiger:innen mit Beispielen aus der Gastronomie – spielerisch aufgebaut, mit einem echten Excel-Arbeitsbuch zum Üben.

> Excel Quest ist ein **ergänzender Praxiskurs** und kein offizieller Vorbereitungskurs für die Befähigungsprüfung Gastgewerbe. Alle Rechenbeispiele sind vereinfachte Übungen (Annahme: Getränke 20 % USt, Speisen 10 % USt) und keine Steuer- oder Rechtsberatung.

## Starten

Voraussetzung: [Node.js](https://nodejs.org) 18 oder neuer.

```bash
npm install
npm run dev
```

Dann im Browser **http://localhost:5173** öffnen. Kein Login, keine Internetverbindung zu einer KI nötig – der Fortschritt wird im Browser (LocalStorage) gespeichert.

Produktionsversion: `npm run build` und `npm run preview` (oder den Ordner `dist/` auf einen beliebigen Webserver kopieren).

## Das Excel-Arbeitsbuch

- Datei: **`public/Excel_Quest_Arbeitsbuch.xlsx`** (im Dashboard über „Arbeitsbuch (.xlsx)“ herunterladbar)
- 7 Blätter: `01_Start`, `02_Grundlagen`, `03_Formatierung`, `04_Formeln`, `05_Funktionen`, `06_Kalkulation`, `07_Abschluss`
- Gelbe Felder = Eingabe, blaue = Beispiel, graue = Lösung. Die Spalte „Check“ zeigt ✓ / ✗ per WENN-Formel.
- Neu erzeugen: `npm run workbook` (Quelle: `scripts/buildWorkbook.ts`, ExcelJS)

## Kursaufbau

| Tag | Thema | Arbeitsblatt |
| --- | --- | --- |
| 1 | Excel-Grundlagen (Zellen, Eingabe, Navigation, Speichern) | 01_Start, 02_Grundlagen |
| 2 | Formatieren (Schrift, Rahmen, €, %, Spaltenbreite) | 03_Formatierung |
| 3 | Formeln (+ − * /, Punkt vor Strich, Kopieren) | 04_Formeln |
| 4 | Funktionen (SUMME, MITTELWERT, MIN, MAX, Fehler finden) | 05_Funktionen |
| 5 | Prozentrechnung (Anteile, Erhöhung, Rabatt, $-Bezug, Aufschlag vs. Spanne) | 06_Kalkulation (Teil A) |
| 6 | Gastro-Kalkulation (Netto/Brutto/USt, Getränke, Food Cost, Rohertrag) | 06_Kalkulation (Teil B) |
| 7 | Abschluss-Challenge + Prüfung (10 Fragen, Zertifikat ab 8/10) | 07_Abschluss |

Jede Lektion: Einführung → Erklärung → Praxisbeispiel → Übungen mit Sofort-Feedback → Excel-Aufgabe mit Selbstcheck → XP-Belohnung.

## Tests

```bash
npm run check                       # Inhalte, Antwortprüfung, XP/Streak/Prüfungslogik
KEY_OUT=/tmp/key.json npm run workbook && python3 scripts/verifyWorkbook.py /tmp/key.json /tmp
                                    # XLSX gültig, 7 Blätter, alle Check-Formeln mit Musterlösung ✓ (benötigt openpyxl + LibreOffice)
npm run build && npx vite preview --port 4173 &
npx tsx scripts/e2e.ts              # spielt den ganzen Kurs im Browser durch (benötigt Playwright + Chromium)
```

## Technik

React 18 · Vite · TypeScript · Tailwind CSS · Framer Motion · Lucide · ExcelJS. Inhalte in `src/data/course.ts`, Spiellogik in `src/lib/progress.ts`.
