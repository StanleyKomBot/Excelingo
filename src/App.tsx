import { useEffect, useRef, useState } from 'react';
import { Certificate } from './components/Certificate';
import { Dashboard } from './components/Dashboard';
import { ExamPlayer } from './components/ExamPlayer';
import { LessonPlayer } from './components/LessonPlayer';
import { DAYS } from './data/course';
import { clearProgress, completeExam, completeLesson, emptyProgress, isDayUnlocked, loadProgress, saveProgress, type Progress, type Reward } from './lib/progress';

type View = { name: 'dashboard' } | { name: 'lesson'; day: number; lesson: number } | { name: 'exam' } | { name: 'certificate' };

export default function App() {
  const [progress, setProgress] = useState<Progress>(loadProgress);
  const [view, setView] = useState<View>({ name: 'dashboard' });
  const [saveError, setSaveError] = useState(false);
  const progressRef = useRef(progress);
  progressRef.current = progress;

  useEffect(() => {
    setSaveError(!saveProgress(progress));
  }, [progress]);

  // Fortschritt aus einem anderen Tab übernehmen
  useEffect(() => {
    const onStorage = () => setProgress(loadProgress());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);

  const home = () => setView({ name: 'dashboard' });
  const setName = (name: string) => setProgress((p) => ({ ...p, name: name.slice(0, 60) }));

  function apply(fn: (p: Progress) => { progress: Progress; reward: Reward }): Reward {
    const res = fn(progressRef.current);
    progressRef.current = res.progress;
    setProgress(res.progress);
    return res.reward;
  }

  let content;
  if (view.name === 'lesson') {
    const day = DAYS[view.day - 1];
    const lesson = day.lessons[view.lesson];
    const nextLesson = view.lesson + 1 < day.lessons.length ? { day: day.id, lesson: view.lesson + 1 } : day.id < 7 ? { day: day.id + 1, lesson: 0 } : null;
    content = (
      <LessonPlayer
        key={lesson.id}
        day={day}
        lesson={lesson}
        lessonIndex={view.lesson}
        onComplete={(r) => apply((p) => completeLesson(p, lesson.id, r))}
        onExit={home}
        onNext={nextLesson && isDayUnlocked(progress, nextLesson.day) ? () => setView({ name: 'lesson', ...nextLesson }) : day.id === 7 ? () => setView({ name: 'exam' }) : null}
      />
    );
  } else if (view.name === 'exam') {
    content = <ExamPlayer onFinish={(score) => apply((p) => completeExam(p, score))} onExit={home} onCertificate={() => setView({ name: 'certificate' })} />;
  } else if (view.name === 'certificate' && progress.exam.passed) {
    content = <Certificate progress={progress} onName={setName} onBack={home} />;
  } else {
    content = (
      <Dashboard
        progress={progress}
        onStart={(day, lesson) => setView({ name: 'lesson', day, lesson })}
        onExam={() => setView({ name: 'exam' })}
        onCertificate={() => setView({ name: 'certificate' })}
        onName={setName}
        onReset={() => {
          clearProgress();
          setProgress(emptyProgress());
        }}
      />
    );
  }

  return (
    <>
      {saveError && (
        <div className="no-print bg-berry-500 px-4 py-2 text-center text-sm font-bold text-white">
          Achtung: Dein Browser erlaubt kein Speichern (z. B. privater Modus). Dein Fortschritt geht beim Schließen verloren.
        </div>
      )}
      {content}
    </>
  );
}
