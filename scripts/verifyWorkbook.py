"""Prüft das Arbeitsbuch: gültiges XLSX, 7 Blätter, und dass alle Selbstcheck-Formeln
mit der Musterlösung "✓ richtig" anzeigen (Neuberechnung via LibreOffice).
Aufruf: KEY_OUT=key.json npm run workbook && python3 scripts/verifyWorkbook.py key.json <tmpdir>"""
import json, sys, zipfile, subprocess, os, openpyxl
key_path, tmp = sys.argv[1], sys.argv[2]
src = os.path.join(os.path.dirname(__file__), '..', 'public', 'Excel_Quest_Arbeitsbuch.xlsx')
assert zipfile.is_zipfile(src) and zipfile.ZipFile(src).testzip() is None, 'kein gültiges ZIP'
wb = openpyxl.load_workbook(src)
expected = ['01_Start','02_Grundlagen','03_Formatierung','04_Formeln','05_Funktionen','06_Kalkulation','07_Abschluss']
assert wb.sheetnames == expected, wb.sheetnames
checks = [(ws.title, c.coordinate) for ws in wb for row in ws.iter_rows() for c in row if isinstance(c.value, str) and 'richtig' in c.value and c.value.startswith('=')]
for k in json.load(open(key_path)):
    v = k['v']
    try: v = float(v)
    except ValueError: pass
    wb[k['sheet']][k['cell']] = v
filled = os.path.join(tmp, 'filled.xlsx')
wb.save(filled)
out = os.path.join(tmp, 'out')
subprocess.run(['soffice', '--headless', '--convert-to', 'xlsx', '--outdir', out, filled], check=True, capture_output=True)
res = openpyxl.load_workbook(os.path.join(out, 'filled.xlsx'), data_only=True)
bad = [(s, c, res[s][c].value) for s, c in checks if res[s][c].value != '✓ richtig']
print(f'Blätter OK: {len(expected)} · Check-Zellen: {len(checks)} · Lösungseinträge: {len(json.load(open(key_path)))}')
print('FEHLER:', bad) if bad else print('✓ Alle Selbstchecks zeigen mit der Musterlösung "✓ richtig"')
# leere Originaldatei: Checks müssen leer sein (außer 4.4 Fehler-Aufgabe)
subprocess.run(['soffice', '--headless', '--convert-to', 'xlsx', '--outdir', os.path.join(tmp, 'orig'), src], check=True, capture_output=True)
orig = openpyxl.load_workbook(os.path.join(tmp, 'orig', 'Excel_Quest_Arbeitsbuch.xlsx'), data_only=True)
nonempty = [(s, c, orig[s][c].value) for s, c in checks if orig[s][c].value not in (None, '')]
print('Leere Datei – nicht-leere Checks (erwartet nur 05_Funktionen E28):', nonempty)
sys.exit(1 if bad else 0)
