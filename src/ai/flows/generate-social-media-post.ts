'use server';

/**
 * @fileOverview AI flow to generate a social media post from a blog article.
 *
 * - generateSocialMediaPost - A function that creates a social media post from blog content.
 * - GenerateSocialMediaPostInput - The input type for the function.
 * - GenerateSocialMediaPostOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateSocialMediaPostInputSchema = z.object({
  blogPostTitle: z.string().describe('The title of the blog post.'),
  blogPostContent: z
    .string()
    .describe('The full content of the blog post.'),
  platform: z
    .enum(['Twitter', 'Facebook', 'LinkedIn'])
    .describe('The social media platform to target.'),
});
export type GenerateSocialMediaPostInput = z.infer<typeof GenerateSocialMediaPostInputSchema>;

const GenerateSocialMediaPostOutputSchema = z.object({
  socialPost: z
    .string()
    .describe('The generated social media post content, including hashtags.'),
});
export type GenerateSocialMediaPostOutput = z.infer<typeof GenerateSocialMediaPostOutputSchema>;

export async function generateSocialMediaPost(
  input: GenerateSocialMediaPostInput
): Promise<GenerateSocialMediaPostOutput> {
  return generateSocialMediaPostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSocialMediaPostPrompt',
  input: {schema: GenerateSocialMediaPostInputSchema},
  output: {schema: GenerateSocialMediaPostOutputSchema},
  prompt: `You are a social media marketing expert. Your task is to create a compelling social media post to promote a blog article on a specific platform.

  Blog Post Title: {{{blogPostTitle}}}
  Blog Post Content:
  {{{blogPostContent}}}

  Target Platform: {{{platform}}}

  Based on the content and title, write a short, engaging post for {{{platform}}}. The post should grab attention, summarize the key value of the article, and include 3-5 relevant hashtags.
  The tone should be appropriate for the specified platform.
  For example, LinkedIn should be more professional, while Twitter should be more concise and conversational.
  `,
});

const generateSocialMediaPostFlow = ai.defineFlow(
  {
    name: 'generateSocialMediaPostFlow',
    inputSchema: GenerateSocialMediaPostInputSchema,
    outputSchema: GenerateSocialMediaPostOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
