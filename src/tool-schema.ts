import { z } from 'zod';

// Codex 0.153 cannot expose recursive $refs/oneOf inside additionalProperties.
// Describe the native shapes without recursion; contract.ts validates each call.
const entry = z.union([
  z.string(), z.looseObject({}), z.array(z.unknown()), z.null(),
]);

export const toolInput = z.strictObject({
  state: entry.describe('Actual evaluation context: text, JSON object/array, or null.'),
  questions: z.record(z.string(), z.looseObject({
    type: z.enum(['noul', 'choice', 'score']),
    instructions: entry.optional().describe('Complete question meaning; IDs identify answers only.'),
    criteria: z.union([z.looseObject({}), z.array(z.unknown()), z.null()]).optional()
      .describe('Noul: optional true/false map. Choice: option-to-description map. Score: ordered 2–10 descriptions. Descriptions accept text, JSON object/array, or null.'),
  })).describe('Nonempty map of IDs to independent native questions over shared state.'),
  model: z.string().optional().describe('Optional override of the configured Jev model.'),
});
