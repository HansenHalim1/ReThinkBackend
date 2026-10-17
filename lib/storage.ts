import { concepts, getQuestion } from './content.ts';
import { grade, type Session } from './engine.ts';
export const STORAGE_KEY = 'rethink-mvp-v1';
export type Saved = { version: 1; sessions: Partial<Record<Session['concept'], Session>> };
export function readSaved(raw: string): Saved | null {
  try {
    if (raw.length > 300000) return null;
    const v = JSON.parse(raw);
    if (v.version !== 1 || !v.sessions || typeof v.sessions !== 'object') return null;
    const sessions: Saved['sessions'] = {};
    for (const c of concepts) {
      const s = v.sessions[c.id];
      if (!s) continue;
      if (s.concept !== c.id || !['diagnosis', 'probe', 'visual', 'worked', 'practice', 'retry', 'transfer', 'complete'].includes(s.stage) || !['unassessed', 'suspected', 'confirmed', 'rejected', 'uncertain'].includes(s.diagnosis) || !['unassessed', 'needs-reinforcement', 'procedural-only', 'understood'].includes(s.mastery) || !Array.isArray(s.attempts) || s.attempts.length > 100) return null;
      const current = typeof s.currentQuestionId === 'string' ? getQuestion(s.currentQuestionId) : undefined;
      if (s.currentQuestionId !== undefined && (!current || current.concept !== c.id || current.role !== 'probe' || s.stage !== 'probe')) return null;
      if (s.hypothesis !== undefined && !['possible-slip', 'possible-conceptual-gap', 'possible-understanding', 'uncertain'].includes(s.hypothesis)) return null;
      const attempts: Session['attempts'] = [];
      for (const a of s.attempts) {
        const q = getQuestion(a.questionId);
        if (!q || q.concept !== c.id || typeof a.answer !== 'string' || a.answer.length > 160 || typeof a.reasoning !== 'string' || a.reasoning.length > 1200 || typeof a.at !== 'string' || !Number.isFinite(Date.parse(a.at))) return null;
        const g = grade(q, a.answer);
        if (!g || g.correct !== a.correct || g.knownError !== a.knownError || (a.errorType !== undefined && a.errorType !== g.errorType)) return null;
        attempts.push({ questionId: a.questionId, answer: a.answer, reasoning: a.reasoning, correct: a.correct, knownError: a.knownError, ...(a.errorType || g.errorType ? { errorType: a.errorType || g.errorType } : {}), at: a.at });
      }
      sessions[c.id] = { concept: c.id, stage: s.stage, diagnosis: s.diagnosis, mastery: s.mastery, ...(s.currentQuestionId ? { currentQuestionId: s.currentQuestionId } : {}), ...(s.hypothesis ? { hypothesis: s.hypothesis } : {}), attempts };
    }
    return { version: 1, sessions };
  } catch { return null; }
}
