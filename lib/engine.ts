import { getConcept, type ConceptId, type Question } from './content.ts';
import { equivalent } from './math.ts';
export type Stage = 'diagnosis' | 'probe' | 'visual' | 'worked' | 'practice' | 'retry' | 'transfer' | 'complete';
export type Diagnosis = 'unassessed' | 'suspected' | 'confirmed' | 'rejected' | 'uncertain';
export type Mastery = 'unassessed' | 'needs-reinforcement' | 'procedural-only' | 'understood';
export type Attempt = { questionId: string; answer: string; reasoning: string; correct: boolean; knownError: boolean; at: string };
export type Session = { concept: ConceptId; stage: Stage; diagnosis: Diagnosis; mastery: Mastery; attempts: Attempt[] };
export const newSession = (concept: ConceptId): Session => ({ concept, stage: 'diagnosis', diagnosis: 'unassessed', mastery: 'unassessed', attempts: [] });
export function grade(q: Question, answer: string): { correct: boolean; knownError: boolean } | null {
  // These curated expression items explicitly require expanded answers.
  if (q.kind === 'expression' && /[()]/.test(answer)) return null;
  const correct = equivalent(answer, q.expected, q.kind);
  if (correct === null) return null;
  return { correct, knownError: !correct && q.knownErrors.some(e => equivalent(answer, e, q.kind) === true) };
}
export function submit(session: Session, answer: string, reasoning: string, at = new Date().toISOString()): Session | null {
  if (!['diagnosis', 'probe', 'practice', 'retry', 'transfer'].includes(session.stage)) return null;
  const c = getConcept(session.concept);
  const q = c.questions[session.stage as keyof typeof c.questions];
  const result = grade(q, answer);
  if (!result) return null;
  const next = { ...session, attempts: [...session.attempts, { questionId: q.id, answer: answer.trim(), reasoning: reasoning.trim(), ...result, at }].slice(-100) };
  switch (session.stage) {
    case 'diagnosis':
      return { ...next, stage: result.correct ? 'retry' : 'probe', diagnosis: result.correct ? 'rejected' : result.knownError ? 'suspected' : 'uncertain' };
    case 'probe': {
      const first = session.attempts.find(a => a.questionId === c.questions.diagnosis.id);
      // Two matching, curated error patterns are required to confirm the blocker.
      const diagnosis = result.correct ? 'rejected' : first?.knownError && result.knownError ? 'confirmed' : 'uncertain';
      return { ...next, diagnosis, stage: diagnosis === 'confirmed' ? 'visual' : result.correct ? 'retry' : 'complete', mastery: diagnosis === 'uncertain' ? 'needs-reinforcement' : 'unassessed' };
    }
    case 'practice': return { ...next, stage: result.correct ? 'retry' : 'practice' };
    case 'retry': return { ...next, stage: result.correct ? 'transfer' : 'complete', mastery: result.correct ? 'unassessed' : 'needs-reinforcement' };
    case 'transfer': return { ...next, stage: 'complete', mastery: result.correct ? 'understood' : 'procedural-only' };
    default: return null;
  }
}
export function advance(session: Session): Session {
  if (session.stage === 'visual') return { ...session, stage: 'worked' };
  if (session.stage === 'worked') return { ...session, stage: 'practice' };
  return session;
}
export function reinforce(session: Session): Session {
  return { ...session, stage: 'visual' };
}
export const masteryLabels: Record<Mastery, string> = {
  unassessed: 'Belum diuji', 'needs-reinforcement': 'Perlu penguatan', 'procedural-only': 'Prosedur dikuasai', understood: 'Pemahaman tervalidasi',
};
export const diagnosisLabels: Record<Diagnosis, string> = {
  unassessed: 'Belum diperiksa', suspected: 'Dugaan hambatan', confirmed: 'Hambatan terkonfirmasi', rejected: 'Dugaan tidak terkonfirmasi', uncertain: 'Bukti belum cukup',
};
