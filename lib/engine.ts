import { getConcept, getProbeQuestions, getQuestion, type ConceptId, type DiagnosticHypothesis, type Question } from './content.ts';
import { equivalent } from './math.ts';
export type Stage = 'diagnosis' | 'probe' | 'visual' | 'worked' | 'practice' | 'retry' | 'transfer' | 'complete';
export type Diagnosis = 'unassessed' | 'suspected' | 'confirmed' | 'rejected' | 'uncertain';
export type Mastery = 'unassessed' | 'needs-reinforcement' | 'procedural-only' | 'understood';
export type Attempt = { questionId: string; answer: string; reasoning: string; correct: boolean; knownError: boolean; errorType?: string; at: string };
export type Session = { concept: ConceptId; stage: Stage; diagnosis: Diagnosis; mastery: Mastery; attempts: Attempt[]; currentQuestionId?: string; hypothesis?: DiagnosticHypothesis };
export type AdaptiveSelection = { questionId: string; hypothesis: DiagnosticHypothesis };
const hypotheses: DiagnosticHypothesis[] = ['possible-slip', 'possible-conceptual-gap', 'possible-understanding', 'uncertain'];
export const newSession = (concept: ConceptId): Session => ({ concept, stage: 'diagnosis', diagnosis: 'unassessed', mastery: 'unassessed', attempts: [] });
export function currentQuestion(session: Session): Question | undefined {
  if (!['diagnosis', 'probe', 'practice', 'retry', 'transfer'].includes(session.stage)) return undefined;
  const c = getConcept(session.concept);
  return getQuestion(session.currentQuestionId || c.questions[session.stage as keyof typeof c.questions].id);
}
export function grade(q: Question, answer: string): { correct: boolean; knownError: boolean; errorType?: string } | null {
  if (q.kind === 'expression' && /[()]/.test(answer)) return null;
  const correct = equivalent(answer, q.expected, q.kind);
  if (correct === null) return null;
  const errorIndex = correct ? -1 : q.knownErrors.findIndex(e => equivalent(answer, e, q.kind) === true);
  return { correct, knownError: errorIndex >= 0, ...(errorIndex >= 0 && q.knownErrorTypes?.[errorIndex] ? { errorType: q.knownErrorTypes[errorIndex] } : {}) };
}
function resolveDiagnosis(attempts: Attempt[]): 'continue' | 'confirmed' | 'rejected' | 'uncertain' {
  const evidence = attempts.filter(a => ['diagnosis', 'probe'].includes(getQuestion(a.questionId)?.role || ''));
  const counts = new Map<string, number>();
  for (const a of evidence) if (a.errorType) counts.set(a.errorType, (counts.get(a.errorType) || 0) + 1);
  if ([...counts.values()].some(count => count >= 2)) return 'confirmed';
  if (evidence.filter(a => a.correct).length >= 2) return 'rejected';
  const probes = evidence.filter(a => getQuestion(a.questionId)?.role === 'probe').length;
  return probes < 2 ? 'continue' : 'uncertain';
}
function selectProbe(session: Session, result: { correct: boolean; errorType?: string }, selection?: AdaptiveSelection): AdaptiveSelection {
  const pool = getProbeQuestions(session.concept);
  const used = new Set(session.attempts.map(a => a.questionId));
  const available = pool.filter(q => !used.has(q.id));
  const chosen = selection && hypotheses.includes(selection.hypothesis) && available.some(q => q.id === selection.questionId)
    ? selection.questionId
    : (available.find(q => result.errorType && q.knownErrorTypes?.includes(result.errorType)) || available[0])?.id;
  return {
    questionId: chosen || pool[0].id,
    hypothesis: selection && hypotheses.includes(selection.hypothesis) ? selection.hypothesis : result.correct ? 'possible-understanding' : result.errorType ? 'possible-conceptual-gap' : 'uncertain',
  };
}
export function submit(session: Session, answer: string, reasoning: string, at = new Date().toISOString(), selection?: AdaptiveSelection): Session | null {
  const q = currentQuestion(session);
  if (!q) return null;
  const result = grade(q, answer);
  if (!result) return null;
  const attempt: Attempt = { questionId: q.id, answer: answer.trim(), reasoning: reasoning.trim(), ...result, at };
  const attempts = [...session.attempts, attempt].slice(-100);
  if (session.stage === 'diagnosis') {
    const nextProbe = selectProbe(session, result, selection);
    return { ...session, attempts, stage: 'probe', diagnosis: result.errorType ? 'suspected' : result.correct ? 'unassessed' : 'uncertain', currentQuestionId: nextProbe.questionId, hypothesis: nextProbe.hypothesis };
  }
  if (session.stage === 'probe') {
    const outcome = resolveDiagnosis(attempts);
    if (outcome === 'continue') {
      const nextProbe = selectProbe({ ...session, attempts }, result, selection);
      return { ...session, attempts, stage: 'probe', currentQuestionId: nextProbe.questionId, hypothesis: nextProbe.hypothesis };
    }
    const { currentQuestionId: _currentQuestionId, ...base } = session;
    return outcome === 'confirmed'
      ? { ...base, attempts, stage: 'visual', diagnosis: 'confirmed' }
      : outcome === 'rejected'
        ? { ...base, attempts, stage: 'retry', diagnosis: 'rejected' }
        : { ...base, attempts, stage: 'complete', diagnosis: 'uncertain', mastery: 'needs-reinforcement' };
  }
  switch (session.stage) {
    case 'practice': return { ...session, attempts, stage: result.correct ? 'retry' : 'practice' };
    case 'retry': return { ...session, attempts, stage: result.correct ? 'transfer' : 'complete', mastery: result.correct ? 'unassessed' : 'needs-reinforcement' };
    case 'transfer': return { ...session, attempts, stage: 'complete', mastery: result.correct ? 'understood' : 'procedural-only' };
    default: return null;
  }
}
export function advance(session: Session): Session {
  if (session.stage === 'visual') return { ...session, stage: 'worked' };
  if (session.stage === 'worked') return { ...session, stage: 'practice' };
  return session;
}
export function reinforce(session: Session): Session {
  const { currentQuestionId: _currentQuestionId, ...base } = session;
  return { ...base, stage: 'visual' };
}
export const masteryLabels: Record<Mastery, string> = {
  unassessed: 'Belum diuji', 'needs-reinforcement': 'Perlu penguatan', 'procedural-only': 'Prosedur dikuasai', understood: 'Pemahaman tervalidasi',
};
export const diagnosisLabels: Record<Diagnosis, string> = {
  unassessed: 'Belum diperiksa', suspected: 'Dugaan hambatan', confirmed: 'Hambatan terkonfirmasi', rejected: 'Dugaan tidak terkonfirmasi', uncertain: 'Bukti belum cukup',
};
