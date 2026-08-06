'use server';

/**
 * @fileOverview A flow for generating SEO meta descriptions for blog posts using AI.
 *
 * - generateSEOMetaDescriptions - A function that generates SEO-optimized meta descriptions from blog post content.
 * - GenerateSEOMetaDescriptionsInput - The input type for the generateSEOMetaDescriptions function.
 * - GenerateSEOMetaDescriptionsOutput - The return type for the generateSEOMetaDescriptions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSEOMetaDescriptionsInputSchema = z.object({
  blogPostContent: z
    .string()
    .describe('The complete content of the blog post for which to generate a meta description.'),
  keywords: z
    .string()
    .describe('Comma separated keywords relevant to the blog post.'),
  maxLength: z
    .number()
    .default(160)
    .describe('The maximum length of the meta description in characters.'),
});
export type GenerateSEOMetaDescriptionsInput = z.infer<typeof GenerateSEOMetaDescriptionsInputSchema>;

const GenerateSEOMetaDescriptionsOutputSchema = z.object({
  metaDescription: z
    .string()
    .describe('The generated SEO-optimized meta description for the blog post.'),
});
export type GenerateSEOMetaDescriptionsOutput = z.infer<typeof GenerateSEOMetaDescriptionsOutputSchema>;

export async function generateSEOMetaDescriptions(
  input: GenerateSEOMetaDescriptionsInput
): Promise<GenerateSEOMetaDescriptionsOutput> {
  return generateSEOMetaDescriptionsFlow(input);
}

const generateSEOMetaDescriptionsPrompt = ai.definePrompt({
  name: 'generateSEOMetaDescriptionsPrompt',
  input: {schema: GenerateSEOMetaDescriptionsInputSchema},
  output: {schema: GenerateSEOMetaDescriptionsOutputSchema},
  prompt: `You are an AI assistant specializing in creating SEO-optimized meta descriptions for blog posts.

  Given the content of a blog post and a set of keywords, generate a compelling meta description that adheres to SEO best practices.
  The meta description should be concise, engaging, and accurately reflect the content of the blog post.
  It should also incorporate the provided keywords to improve search engine ranking.

  Blog Post Content:
  {{blogPostContent}}

  Keywords:
  {{keywords}}

  Maximum Length: {{maxLength}} characters

  Meta Description:`,
});

const generateSEOMetaDescriptionsFlow = ai.defineFlow(
  {
    name: 'generateSEOMetaDescriptionsFlow',
    inputSchema: GenerateSEOMetaDescriptionsInputSchema,
    outputSchema: GenerateSEOMetaDescriptionsOutputSchema,
  },
  async input => {
    const {output} = await generateSEOMetaDescriptionsPrompt(input);
    return output!;
  }
);
