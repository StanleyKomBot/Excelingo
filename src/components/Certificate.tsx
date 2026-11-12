import { ArrowLeft, Printer } from 'lucide-react';
import { EXAM } from '../data/course';
import type { Progress } from '../lib/progress';
import { Zelli } from './Companion';
import { Button } from './ui';

interface Props {
  progress: Progress;
  onName: (name: string) => void;
  onBack: () => void;
}

export function Certificate({ progress, onName, onBack }: Props) {
  const date = progress.exam.passedDate ? new Date(progress.exam.passedDate + 'T12:00:00').toLocaleDateString('de-AT', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  return (
    <div className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6">
      <div className="no-print flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={onBack}>
          <ArrowLeft size={18} /> Zurück
        </Button>
        <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-3 py-2">
          <span className="text-sm font-bold text-ink-400">Name am Zertifikat:</span>
          <input value={progress.name} onChange={(e) => onName(e.target.value)} maxLength={60} placeholder="Dein Name" className="min-w-0 flex-1 bg-transparent font-bold outline-none" />
        </label>
        <Button onClick={() => window.print()}>
          <Printer size={18} /> Drucken / PDF
        </Button>
      </div>

      <div className="print-area relative overflow-hidden rounded-3xl border-[6px] border-leaf-500 bg-white p-8 text-center shadow-xl sm:p-12">
        <div className="absolute inset-3 rounded-2xl border-2 border-dashed border-leaf-400/60" />
        <div className="relative space-y-4">
          <div className="flex justify-center">
            <Zelli mood="cheer" size={90} />
          </div>
          <p className="text-sm font-extrabold uppercase tracking-[0.3em] text-leaf-600">Zertifikat</p>
          <h1 className="text-3xl font-black sm:text-4xl">Excel Quest</h1>
          <p className="text-lg text-ink-600">Hiermit wird bestätigt, dass</p>
          <p className="mx-auto max-w-lg border-b-2 border-ink-900 pb-1 text-3xl font-black sm:text-4xl">{progress.name || '…………………………'}</p>
          <p className="mx-auto max-w-xl text-lg text-ink-600">
            den 7-Tage-Praxiskurs <strong>„Excel für Einsteiger:innen – mit Beispielen aus der Gastronomie“</strong> abgeschlossen und die Abschlussprüfung mit{' '}
            <strong>
              {progress.exam.best} von {EXAM.length}
            </strong>{' '}
            Punkten bestanden hat.
          </p>
          <p className="text-sm text-ink-600">Inhalte: Excel-Grundlagen · Formatierung · Formeln · SUMME, MITTELWERT, MIN, MAX · Prozentrechnung · Gastro-Kalkulation</p>
          <p className="pt-4 font-bold">{date}</p>
          <p className="pt-4 text-xs text-ink-400">Selbstlernkurs ohne Prüfungsaufsicht. Kein offizieller Nachweis und keine offizielle Vorbereitung auf die Befähigungsprüfung.</p>
        </div>
      </div>
    </div>
  );
}
