import { z } from 'zod';
import type { Questions } from '@typesafe-ai/sdk';

// Match SDK EntryType, including nullable and structured descriptions.
const entry = z.union([
  z.string(), z.record(z.string(), z.json()), z.array(z.json()), z.null(),
]);
const instructions = entry.optional();
const question = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('noul'),
    instructions,
    criteria: z.strictObject({ true: entry.optional(), false: entry.optional() }).nullish(),
  }),
  z.strictObject({
    type: z.literal('choice'),
    instructions,
    criteria: z.record(z.string(), entry).refine(
      value => Object.keys(value).length > 0 && Object.keys(value).length <= 255,
      'Choice criteria must contain 1–255 options (TypeSafe API).',
    ),
  }),
  z.strictObject({
    type: z.literal('score'),
    instructions,
    criteria: z.tuple([entry, entry], entry).refine(
      value => value.length <= 10, 'Score criteria support 2–10 levels (TypeSafe API).',
    ),
  }),
]);

export const evaluationInput = z.strictObject({
  state: entry.describe('The actual context to evaluate; text, JSON object/array, or null.'),
  questions: z.record(z.string(), question).refine(
    value => Object.keys(value).length > 0, 'At least one question is required.',
  ).describe('Independent typed questions over shared state. IDs identify answers only.'),
  model: z.string().optional().describe('Optional override of the configured Jev model.'),
});
export type EvaluationInput = z.infer<typeof evaluationInput>;

const probability = z.number().min(0).max(1);
const distribution = z.record(z.string(), probability);
const answer = z.discriminatedUnion('type', [
  z.looseObject({ type: z.literal('noul'), noul: probability }),
  z.looseObject({
    type: z.literal('choice'), choice: z.string(),
    probabilities: distribution, confidence: probability,
  }),
  z.looseObject({
    type: z.literal('score'), score: z.number(), legend: z.record(z.string(), entry),
    probabilities: distribution, confidence: probability,
  }),
]);

const evaluationOutput = z.looseObject({
  model: z.string(),
  answers: z.record(z.string(), answer),
  usage: z.looseObject({
    input_tokens: z.number().int().nonnegative(),
    output_tokens: z.number().int().nonnegative(),
  }),
});

function requireKeys(value: object, expected: string[], path: string): void {
  if (Object.keys(value).length !== expected.length ||
      expected.some(key => !Object.hasOwn(value, key))) {
    throw new Error(`TypeSafe response ${path} does not match the request keys.`);
  }
}

export function validateResult(value: unknown, questions: Questions) {
  const parsed = evaluationOutput.safeParse(value);
  if (!parsed.success) {
    const detail = parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Invalid TypeSafe response: ${detail.join('; ')}`);
  }
  const result = parsed.data;
  requireKeys(result.answers, Object.keys(questions), 'answers');
  for (const [id, question] of Object.entries(questions)) {
    const current = result.answers[id];
    if (!current || current.type !== question.type) {
      throw new Error(`TypeSafe response answers.${id}.type does not match its question.`);
    }
    if (current.type === 'choice' && question.type === 'choice') {
      requireKeys(current.probabilities, Object.keys(question.criteria), `answers.${id}.probabilities`);
      if (!Object.hasOwn(question.criteria, current.choice)) {
        throw new Error(`TypeSafe response answers.${id}.choice is not a supplied option.`);
      }
    }
    if (current.type === 'score' && question.type === 'score') {
      const levels = question.criteria.map((_, index) => String(index));
      requireKeys(current.probabilities, levels, `answers.${id}.probabilities`);
      requireKeys(current.legend, levels, `answers.${id}.legend`);
      if (current.score < 0 || current.score > levels.length - 1) {
        throw new Error(`TypeSafe response answers.${id}.score is outside its rubric.`);
      }
    }
  }
  return result;
}
