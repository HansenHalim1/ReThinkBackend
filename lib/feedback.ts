import { grade } from './engine.ts';
import type { Question } from './content.ts';
export function curatedFeedback(q: Question, answer: string): string {
  const g = grade(q, answer);
  if (!g) return 'Format jawaban belum terbaca. Gunakan angka atau ekspresi linear dengan variabel x.';
  if (g.correct) return 'Jawabanmu setara secara matematis. Lanjutkan untuk memeriksa apakah pemahaman ini bisa digunakan secara mandiri.';
  return q.role === 'diagnosis' || q.role === 'probe'
    ? 'Jawaban ini belum setara. Satu kesalahan belum cukup untuk menentukan hambatan konsep; bukti tambahan akan membantu.'
    : q.hint || 'Jawaban belum setara. Hasil ini digunakan untuk menentukan kebutuhan penguatan berikutnya.';
}
export function validFeedback(value: unknown): value is { feedback: string } {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  // Feedback is language-only: reject mathematical expressions/numbers to avoid leaking answers.
  return Object.keys(v).length === 1 && typeof v.feedback === 'string' && v.feedback.length >= 10 && v.feedback.length <= 600 && !/[0-9=+*/<>^{}]|https?:|```/.test(v.feedback);
}
