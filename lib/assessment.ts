import bank from './data/foundation-bank.v1.json' with { type: 'json' };
import { ApiError } from './auth.ts';

export const BANK_VERSION = bank.contentVersion;
export const topics = bank.topics;
// One mixed test: every entry item, then routine items, then applications.
// Difficulty is an editorial estimate, not a calibrated ability score.
export const questions = [...bank.questions].sort((a, b) => a.difficulty - b.difficulty || topics.findIndex(t => t.id === a.topicId) - topics.findIndex(t => t.id === b.topicId));
export type AssessmentSession = { bankVersion: string; answers: { questionId: string; optionId: string }[]; knownTopicIds: string[] | null };
export const freshAssessment = (): AssessmentSession => ({ bankVersion: BANK_VERSION, answers: [], knownTopicIds: null });
export function readAssessment(value: unknown): AssessmentSession {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new ApiError(400, 'Data pretest tidak valid.');
  const s = value as AssessmentSession;
  if (s.bankVersion !== BANK_VERSION) throw new ApiError(409, 'Versi pretest berubah. Hubungi tim ReThink untuk memperbarui sesi.');
  if (!Array.isArray(s.answers) || s.answers.length > questions.length || s.answers.some((a, i) => !a || a.questionId !== questions[i].id || (a.optionId !== '__unsure' && !questions[i].options.some(o => o.id === a.optionId)))) throw new ApiError(400, 'Urutan jawaban pretest tidak valid.');
  if (s.knownTopicIds !== null && (!Array.isArray(s.knownTopicIds) || s.knownTopicIds.some(id => !topics.some(t => t.id === id)) || new Set(s.knownTopicIds).size !== s.knownTopicIds.length || s.answers.length !== questions.length)) throw new ApiError(400, 'Checklist topik tidak valid.');
  return { bankVersion: BANK_VERSION, answers: s.answers.map(a => ({ questionId: a.questionId, optionId: a.optionId })), knownTopicIds: s.knownTopicIds === null ? null : [...s.knownTopicIds] };
}
export function assessmentCommand(session: AssessmentSession, body: Record<string, unknown>): AssessmentSession {
  const s = readAssessment(session);
  if (body.action === 'answer') {
    const q = questions[s.answers.length];
    if (!q || body.questionId !== q.id || typeof body.optionId !== 'string' || (body.optionId !== '__unsure' && !q.options.some(o => o.id === body.optionId))) throw new ApiError(400, 'Jawab soal yang sedang ditampilkan.');
    return { ...s, answers: [...s.answers, { questionId: q.id, optionId: body.optionId }] };
  }
  if (body.action === 'review' && s.answers.length === questions.length) return readAssessment({ ...s, knownTopicIds: body.knownTopicIds });
  throw new ApiError(400, 'Tindakan pretest tidak valid.');
}
export function assessmentView(s: AssessmentSession, revision: number) {
  const complete = s.answers.length === questions.length;
  const q = questions[s.answers.length];
  const summary = complete ? topics.map(t => {
    const entries = s.answers.filter(a => questions.find(q => q.id === a.questionId)?.topicId === t.id);
    const correct = entries.filter(a => questions.find(q => q.id === a.questionId)!.answer.optionId === a.optionId).length;
    const suggestedKnown = correct >= 2;
    return { id: t.id, title: t.title, correct, total: entries.length, suggestedKnown, checked: s.knownTopicIds === null ? suggestedKnown : s.knownTopicIds.includes(t.id) };
  }) : [];
  return {
    schemaVersion: 1, bankVersion: BANK_VERSION, revision, status: complete ? 'complete' : s.answers.length ? 'in-progress' : 'not-started',
    answered: s.answers.length, total: questions.length, topicCount: topics.length, checklistSaved: s.knownTopicIds !== null,
    // Explicit projection: keys, explanations and misconception tags stay on the server.
    question: q ? { id: q.id, topicId: q.topicId, topicTitle: topics.find(t => t.id === q.topicId)!.title, difficulty: q.difficulty, prompt: q.prompt, options: q.options.map(o => ({ id: o.id, text: o.text })) } : null,
    topics: summary,
  };
}
