'use server';

/**
 * @fileOverview A flow for generating newsletter subject lines using AI.
 *
 * - generateNewsletterSubject - A function that generates a newsletter subject line from a topic.
 * - GenerateNewsletterSubjectInput - The input type for the function.
 * - GenerateNewsletterSubjectOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNewsletterSubjectInputSchema = z.object({
  topic: z
    .string()
    .describe('The topic or main idea for the newsletter.'),
});
export type GenerateNewsletterSubjectInput = z.infer<typeof GenerateNewsletterSubjectInputSchema>;

const GenerateNewsletterSubjectOutputSchema = z.object({
  subject: z.string().describe('The generated newsletter subject line.'),
});
export type GenerateNewsletterSubjectOutput = z.infer<typeof GenerateNewsletterSubjectOutputSchema>;

export async function generateNewsletterSubject(input: GenerateNewsletterSubjectInput): Promise<GenerateNewsletterSubjectOutput> {
  return generateNewsletterSubjectFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNewsletterSubjectPrompt',
  input: {schema: GenerateNewsletterSubjectInputSchema},
  output: {schema: GenerateNewsletterSubjectOutputSchema},
  prompt: `You are an expert email marketer. Generate 5 catchy and engaging newsletter subject line options for the following topic. Return only the best one.

Topic: {{{topic}}}`,
});

const generateNewsletterSubjectFlow = ai.defineFlow(
  {
    name: 'generateNewsletterSubjectFlow',
    inputSchema: GenerateNewsletterSubjectInputSchema,
    outputSchema: GenerateNewsletterSubjectOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
