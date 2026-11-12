export type ExerciseLabel =
  | 'Multiple Choice'
  | 'Richtig oder falsch'
  | 'Formel wählen'
  | 'Formel ergänzen'
  | 'Finde den Fehler'
  | 'Zuordnen'
  | 'Rechnen'
  | 'Zellbezug';

/** Mini-Tabelle im Excel-Look. rows[0] ist Zeile `startRow` (Standard 1). */
export interface Grid {
  rows: string[][];
  startRow?: number;
  highlight?: string[]; // z. B. ['B3']
  formula?: string; // Inhalt der Bearbeitungsleiste
  headerRow?: boolean; // erste Zeile als Überschrift darstellen
}

interface Base {
  label?: ExerciseLabel;
  grid?: Grid;
  explanation: string;
  hint?: string;
}

export type Exercise =
  | (Base & { kind: 'choice'; question: string; options: string[]; correct: number })
  | (Base & { kind: 'truefalse'; statement: string; correct: boolean })
  | (Base & {
      kind: 'input';
      question: string;
      prefix?: string; // vorgegebener Formelanfang
      answers?: string[]; // Text/Formel-Antworten
      numeric?: number[]; // Zahl-Antworten
      tolerance?: number;
      percent?: boolean; // 0,25 und 25 gelten beide
      unit?: string;
      placeholder?: string;
    })
  | (Base & { kind: 'match'; question: string; pairs: [string, string][] });

export interface Example {
  title: string;
  grid?: Grid;
  steps?: string[];
  note?: string;
}

export interface ExcelTask {
  sheet: string;
  task: string;
  steps: string[];
  solution: string[];
}

export interface Lesson {
  id: string;
  title: string;
  minutes: number;
  intro: string;
  explain: string[];
  example: Example;
  exercises: Exercise[];
  excel: ExcelTask;
}

export interface Day {
  id: number;
  title: string;
  description: string;
  minutes: number;
  companion: string;
  lessons: Lesson[];
}

export interface ExamQuestion {
  day: number;
  exercise: Exercise;
}
