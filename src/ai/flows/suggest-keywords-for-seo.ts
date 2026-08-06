'use server';

/**
 * @fileOverview This file defines a Genkit flow to suggest relevant keywords for SEO based on blog post content.
 *
 * The flow takes blog post content as input and returns a list of suggested keywords.
 *
 * @interface SuggestKeywordsForSEOInput - Defines the input schema for the flow.
 * @interface SuggestKeywordsForSEOOutput - Defines the output schema for the flow.
 * @function suggestKeywordsForSEO - The main function that triggers the keyword suggestion flow.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestKeywordsForSEOInputSchema = z.object({
  content: z.string().describe('The content of the blog post.'),
});

export type SuggestKeywordsForSEOInput = z.infer<typeof SuggestKeywordsForSEOInputSchema>;

const SuggestKeywordsForSEOOutputSchema = z.object({
  keywords: z.array(z.string()).describe('An array of suggested keywords for SEO.'),
});

export type SuggestKeywordsForSEOOutput = z.infer<typeof SuggestKeywordsForSEOOutputSchema>;

export async function suggestKeywordsForSEO(input: SuggestKeywordsForSEOInput): Promise<SuggestKeywordsForSEOOutput> {
  return suggestKeywordsForSEOFlow(input);
}

const suggestKeywordsForSEOPrompt = ai.definePrompt({
  name: 'suggestKeywordsForSEOPrompt',
  input: {schema: SuggestKeywordsForSEOInputSchema},
  output: {schema: SuggestKeywordsForSEOOutputSchema},
  prompt: `You are an SEO expert. Suggest keywords for the following blog post content:

  {{content}}

  Return a list of keywords that are relevant to the content and would help improve the search engine ranking of the post. The keywords should be specific, and not broad. Always return 5 keywords.`,
});

const suggestKeywordsForSEOFlow = ai.defineFlow(
  {
    name: 'suggestKeywordsForSEOFlow',
    inputSchema: SuggestKeywordsForSEOInputSchema,
    outputSchema: SuggestKeywordsForSEOOutputSchema,
  },
  async input => {
    const {output} = await suggestKeywordsForSEOPrompt(input);
    return output!;
  }
);
