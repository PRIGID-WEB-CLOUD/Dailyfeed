
'use server';

/**
 * @fileOverview An AI flow to explain a given block of text in simple terms.
 *
 * - explainTextSimply - A function that simplifies complex text.
 * - ExplainTextSimplyInput - The input type for the function.
 * - ExplainTextSimplyOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExplainTextSimplyInputSchema = z.object({
  text: z.string().describe('The text to be explained.'),
});
export type ExplainTextSimplyInput = z.infer<typeof ExplainTextSimplyInputSchema>;

const ExplainTextSimplyOutputSchema = z.object({
  explanation: z.string().describe('The simplified explanation of the text.'),
});
export type ExplainTextSimplyOutput = z.infer<typeof ExplainTextSimplyOutputSchema>;

export async function explainTextSimply(
  input: ExplainTextSimplyInput
): Promise<ExplainTextSimplyOutput> {
  return explainTextSimplyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'explainTextSimplyPrompt',
  input: { schema: ExplainTextSimplyInputSchema },
  output: { schema: ExplainTextSimplyOutputSchema },
  prompt: `You are an expert at simplifying complex topics. Explain the following text in a way that a beginner could easily understand. Break down jargon and use analogies if helpful.

Text to explain:
{{{text}}}
`,
});

const explainTextSimplyFlow = ai.defineFlow(
  {
    name: 'explainTextSimplyFlow',
    inputSchema: ExplainTextSimplyInputSchema,
    outputSchema: ExplainTextSimplyOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
