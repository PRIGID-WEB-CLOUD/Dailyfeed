'use server';

/**
 * @fileOverview A flow for generating blog post titles using AI.
 *
 * - generateBlogTitle - A function that generates blog post titles from a topic or short description.
 * - GenerateBlogTitleInput - The input type for the generateBlogTitle function.
 * - GenerateBlogTitleOutput - The return type for the generateBlogTitle function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateBlogTitleInputSchema = z.object({
  topic: z
    .string()
    .describe('The topic or short description of the blog post.'),
});
export type GenerateBlogTitleInput = z.infer<typeof GenerateBlogTitleInputSchema>;

const GenerateBlogTitleOutputSchema = z.object({
  title: z.string().describe('The generated blog post title.'),
});
export type GenerateBlogTitleOutput = z.infer<typeof GenerateBlogTitleOutputSchema>;

export async function generateBlogTitle(input: GenerateBlogTitleInput): Promise<GenerateBlogTitleOutput> {
  return generateBlogTitleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBlogTitlePrompt',
  input: {schema: GenerateBlogTitleInputSchema},
  output: {schema: GenerateBlogTitleOutputSchema},
  prompt: `You are an expert blog title generator. Generate an engaging and SEO-friendly title for a blog post based on the following topic or description:\n\nTopic: {{{topic}}}`,
});

const generateBlogTitleFlow = ai.defineFlow(
  {
    name: 'generateBlogTitleFlow',
    inputSchema: GenerateBlogTitleInputSchema,
    outputSchema: GenerateBlogTitleOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
