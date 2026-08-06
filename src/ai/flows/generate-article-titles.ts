'use server';

/**
 * @fileOverview This file defines a Genkit flow to generate multiple article title options using AI.
 *
 * The flow takes article content as input and returns a list of suggested titles.
 *
 * @interface GenerateArticleTitlesInput - Defines the input schema for the flow.
 * @interface GenerateArticleTitlesOutput - Defines the output schema for the flow.
 * @function generateArticleTitles - The main function that triggers the article title generation flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateArticleTitlesInputSchema = z.object({
  content: z.string().describe('The content of the article.'),
  numTitles: z.number().default(3).describe('The number of titles to generate.'),
});

export type GenerateArticleTitlesInput = z.infer<typeof GenerateArticleTitlesInputSchema>;

const GenerateArticleTitlesOutputSchema = z.object({
  titles: z.array(z.string()).describe('An array of suggested article titles.'),
});

export type GenerateArticleTitlesOutput = z.infer<typeof GenerateArticleTitlesOutputSchema>;

export async function generateArticleTitles(input: GenerateArticleTitlesInput): Promise<GenerateArticleTitlesOutput> {
  return generateArticleTitlesFlow(input);
}

const generateArticleTitlesPrompt = ai.definePrompt({
  name: 'generateArticleTitlesPrompt',
  input: {schema: GenerateArticleTitlesInputSchema},
  output: {schema: GenerateArticleTitlesOutputSchema},
  prompt: `You are an expert in generating catchy and engaging article titles. Generate {{numTitles}} title options for the following article content:\n\n  {{content}}\n\n  The titles should be attention-grabbing and relevant to the content. Return a list of titles that would attract the most readers.`,
});

const generateArticleTitlesFlow = ai.defineFlow(
  {
    name: 'generateArticleTitlesFlow',
    inputSchema: GenerateArticleTitlesInputSchema,
    outputSchema: GenerateArticleTitlesOutputSchema,
  },
  async input => {
    const {output} = await generateArticleTitlesPrompt(input);
    return output!;
  }
);
