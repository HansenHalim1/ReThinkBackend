import { concepts, type ConceptId } from './content.ts';
import { advance, newSession, reinforce, submit, type AdaptiveSelection, type Session } from './engine.ts';

export type ProgressAction = 'submit' | 'advance' | 'reinforce' | 'reset';
export type ProgressCommand = { concept: ConceptId; action: ProgressAction; expectedRevision: number; answer?: string; reasoning?: string };
export function parseCommand(body: Record<string, unknown>): ProgressCommand | null {
  if (!concepts.some(c => c.id === body.concept) || !['submit', 'advance', 'reinforce', 'reset'].includes(String(body.action)) || !Number.isSafeInteger(body.expectedRevision) || Number(body.expectedRevision) < 0) return null;
  if (body.action === 'submit' && (typeof body.answer !== 'string' || body.answer.length > 160 || typeof body.reasoning !== 'string' || body.reasoning.length > 1200)) return null;
  return { concept: body.concept as ConceptId, action: body.action as ProgressAction, expectedRevision: Number(body.expectedRevision), answer: typeof body.answer === 'string' ? body.answer : undefined, reasoning: typeof body.reasoning === 'string' ? body.reasoning : undefined };
}
export function applyCommand(current: Session | undefined, command: ProgressCommand, selection?: AdaptiveSelection): Session | null {
  const session = current || newSession(command.concept);
  if (session.concept !== command.concept) return null;
  switch (command.action) {
    case 'submit': return submit(session, command.answer!, command.reasoning!, new Date().toISOString(), selection);
    case 'advance': return ['visual', 'worked'].includes(session.stage) ? advance(session) : null;
    case 'reinforce': return session.stage === 'complete' && session.mastery !== 'understood' ? reinforce(session) : null;
    case 'reset': return newSession(command.concept);
  }
}
