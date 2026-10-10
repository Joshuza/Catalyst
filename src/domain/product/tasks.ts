import type { AiContext, ProposedStep } from './providers';
import { z } from 'zod';
export const proposalSchema = z
  .array(
    z
      .object({
        title: z.string().min(1).max(300),
        minutes: z.number().int().min(5).max(480),
      })
      .strict(),
  )
  .min(1)
  .max(50);
export function validateProposal(value: unknown): ProposedStep[] {
  return proposalSchema.parse(value);
}
export function taskPrompt(context: AiContext): string {
  return `Break this single task into realistic steps. Return JSON: [{"title":"...","minutes":30}].\nTitle: ${context.title}\nDeadline: ${context.details.deadline ?? 'Not set'}\nRubric: ${context.details.rubric}\nNotes: ${context.notes}\nResources: ${context.details.resources.map((r) => `${r.title}: ${r.url}`).join('\n')}\nConversation: ${context.details.conversation}\nWork shifts: ${JSON.stringify(context.workingWeek)}\nDo not schedule calendar events. The user must approve the plan.`;
}
