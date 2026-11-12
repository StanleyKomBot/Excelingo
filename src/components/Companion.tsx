import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

export type Mood = 'happy' | 'think' | 'cheer' | 'sad';

/** Zelli – eine freundliche Tabellenzelle als Lernbegleitung. */
export function Zelli({ mood = 'happy', size = 72 }: { mood?: Mood; size?: number }) {
  const mouth = {
    happy: 'M22 40 Q32 48 42 40',
    cheer: 'M20 38 Q32 52 44 38 Z',
    think: 'M24 43 L40 41',
    sad: 'M23 45 Q32 38 41 45',
  }[mood];
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
      <rect x="6" y="8" width="52" height="50" rx="14" fill="#16a34a" />
      <rect x="6" y="8" width="52" height="44" rx="14" fill="#22c55e" />
      <path d="M6 24 H58 M24 8 V52" stroke="#16a34a" strokeWidth="2" opacity=".35" />
      <circle cx="23" cy="30" r="5" fill="white" />
      <circle cx="41" cy="30" r="5" fill="white" />
      <circle cx={mood === 'think' ? 25 : 24} cy={mood === 'think' ? 28 : 31} r="2.5" fill="#1f2937" />
      <circle cx={mood === 'think' ? 43 : 42} cy={mood === 'think' ? 28 : 31} r="2.5" fill="#1f2937" />
      <path d={mouth} stroke="#1f2937" strokeWidth="3" fill={mood === 'cheer' ? '#1f2937' : 'none'} strokeLinecap="round" strokeLinejoin="round" />
      {mood !== 'sad' && (
        <>
          <circle cx="15" cy="40" r="3" fill="#facc15" opacity=".6" />
          <circle cx="49" cy="40" r="3" fill="#facc15" opacity=".6" />
        </>
      )}
      <rect x="44" y="2" width="14" height="10" rx="3" fill="#facc15" />
      <text x="51" y="10" fontSize="8" fontWeight="900" textAnchor="middle" fill="#1f2937">
        fx
      </text>
    </svg>
  );
}

export function Companion({ children, mood = 'happy', size = 64 }: { children: ReactNode; mood?: Mood; size?: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-end gap-3">
      <motion.div animate={{ rotate: [0, -4, 4, 0] }} transition={{ duration: 1.2, delay: 0.3 }}>
        <Zelli mood={mood} size={size} />
      </motion.div>
      <div className="relative rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-[15px] leading-snug text-ink-900">
        <span className="absolute -left-2 bottom-4 h-3 w-3 rotate-45 border-b-2 border-l-2 border-slate-200 bg-white" />
        {children}
      </div>
    </motion.div>
  );
}
