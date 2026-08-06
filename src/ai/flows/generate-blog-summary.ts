'use server';

/**
 * @fileOverview AI-powered blog post summarization flow.
 *
 * - generateBlogSummary - A function that generates a concise summary of a blog post.
 * - GenerateBlogSummaryInput - The input type for the generateBlogSummary function.
 * - GenerateBlogSummaryOutput - The return type for the generateBlogSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBlogSummaryInputSchema = z.object({
  blogPostContent: z
    .string()
    .describe('The complete content of the blog post to be summarized.'),
  maxSentences: z
    .number()
    .default(2)
    .describe(
      'The maximum number of sentences to include in the generated summary.'
    ),
});
export type GenerateBlogSummaryInput = z.infer<typeof GenerateBlogSummaryInputSchema>;

const GenerateBlogSummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the blog post content.'),
});
export type GenerateBlogSummaryOutput = z.infer<typeof GenerateBlogSummaryOutputSchema>;

export async function generateBlogSummary(
  input: GenerateBlogSummaryInput
): Promise<GenerateBlogSummaryOutput> {
  return generateBlogSummaryFlow(input);
}

const generateBlogSummaryPrompt = ai.definePrompt({
  name: 'generateBlogSummaryPrompt',
  input: {schema: GenerateBlogSummaryInputSchema},
  output: {schema: GenerateBlogSummaryOutputSchema},
  prompt: `You are an AI assistant helping a blog editor create content.

  Please generate a concise summary of the following blog post content, suitable for use as an SEO meta description.

  The summary should be no more than {{maxSentences}} sentences long and under 160 characters.

  Blog Post Content:
  {{blogPostContent}}`,
});

const generateBlogSummaryFlow = ai.defineFlow(
  {
    name: 'generateBlogSummaryFlow',
    inputSchema: GenerateBlogSummaryInputSchema,
    outputSchema: GenerateBlogSummaryOutputSchema,
  },
  async input => {
    const {output} = await generateBlogSummaryPrompt(input);
    return output!;
  }
);
