'use server';

/**
 * @fileOverview AI-powered SEO title and meta description suggestion flow.
 * A Genkit flow that suggests SEO titles and meta descriptions for a blog post.
 *
 * - generateSeoSuggestions - A function that generates SEO title and meta description suggestions for a blog post.
 * - GenerateSeoSuggestionsInput - The input type for the generateSeoSuggestions function.
 * - GenerateSeoSuggestionsOutput - The return type for the generateSeoSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSeoSuggestionsInputSchema = z.object({
  blogPostContent: z
    .string()
    .describe('The complete content of the blog post for which to generate SEO suggestions.'),
  keywords: z
    .string()
    .describe('Comma separated keywords relevant to the blog post.'),
});
export type GenerateSeoSuggestionsInput = z.infer<typeof GenerateSeoSuggestionsInputSchema>;

const GenerateSeoSuggestionsOutputSchema = z.object({
  titleSuggestion: z.string().describe('A suggested title for the blog post.'),
  metaDescriptionSuggestion:
    z.string().describe('A suggested meta description for the blog post.'),
});
export type GenerateSeoSuggestionsOutput = z.infer<typeof GenerateSeoSuggestionsOutputSchema>;

export async function generateSeoSuggestions(
  input: GenerateSeoSuggestionsInput
): Promise<GenerateSeoSuggestionsOutput> {
  return generateSeoSuggestionsFlow(input);
}

const generateSeoSuggestionsPrompt = ai.definePrompt({
  name: 'generateSeoSuggestionsPrompt',
  input: {schema: GenerateSeoSuggestionsInputSchema},
  output: {schema: GenerateSeoSuggestionsOutputSchema},
  prompt: `You are an AI assistant specializing in creating SEO-optimized titles and meta descriptions for blog posts.\n
  Given the content of a blog post and a set of keywords, generate a compelling title and meta description that adheres to SEO best practices.\n  The title and meta description should be concise, engaging, and accurately reflect the content of the blog post.\n  They should also incorporate the provided keywords to improve search engine ranking.\n
  Blog Post Content:\n  {{blogPostContent}}\n
  Keywords:\n  {{keywords}}\n
  Title Suggestion:\n
  Meta Description Suggestion:`,
});

const generateSeoSuggestionsFlow = ai.defineFlow(
  {
    name: 'generateSeoSuggestionsFlow',
    inputSchema: GenerateSeoSuggestionsInputSchema,
    outputSchema: GenerateSeoSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await generateSeoSuggestionsPrompt(input);
    return output!;
  }
);
