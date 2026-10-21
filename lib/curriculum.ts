import catalog from './data/curriculum.v2.json' with { type: 'json' };
export type GradeLevel = 10 | 11 | 12;
export type CurriculumTrack = 'general' | 'advanced';
export type Material = {
  id: string; grade: GradeLevel; title: string; summary: string; duration: string;
  track: CurriculumTrack; phase: 'E' | 'F' | 'prerequisite'; gradePlacement: 'suggested'; contentVersion: string;
  prerequisites: string[]; bankTopicIds: string[]; reviewStatus: 'editorial-pilot';
  alignment: { sourceUrl: string | null; section: string; kind: 'cp-topic' | 'prerequisite-support'; verification: 'topic-level' | 'cp-text-checked'; pdfPages?: number[] };
  objectives: string[]; explanation: string[]; formulas: string[];
  example: { problem: string; steps: string[] };
  additionalExamples: { problem: string; steps: string[] }[]; commonMistakes: string[];
  quiz: { prompt: string; options: { id: string; text: string }[]; correctOption: string; explanation: string };
};
// Original ReThink lessons. Phase/track mapping is topic-level, not a claim of exhaustive CP coverage.
export const curriculumVersion = catalog.contentVersion;
export const materials = catalog.materials as Material[];
export const curriculumTracks: { id: CurriculumTrack; title: string; description: string }[] = [
  { id: 'general', title: 'Matematika umum', description: 'Fase E dan F, dengan penguat prasyarat. Penempatan kelas XI/XII adalah saran urutan ReThink.' },
  { id: 'advanced', title: 'Matematika tingkat lanjut', description: 'Jalur pilihan Fase F: aljabar, geometri, distribusi peluang, dan kalkulus. Dipilih sesuai mata pelajaranmu.' },
];
export const gradeLevels: GradeLevel[] = [10, 11, 12];
export const getMaterial = (id: string) => materials.find(material => material.id === id);
export type MaterialProgress = { moduleId: string; completed: boolean; attempts: number; revision: number };
export type CurriculumProgress = Record<string, MaterialProgress>;
export function pretestsComplete(sessions: Partial<Record<'distribution' | 'inverse', { stage: string }>>) {
  return sessions.distribution?.stage === 'complete' && sessions.inverse?.stage === 'complete';
}
export function publicMaterial(material: Material) {
  const { correctOption: _correct, explanation: _explanation, ...quiz } = material.quiz;
  return { ...material, quiz };
}
