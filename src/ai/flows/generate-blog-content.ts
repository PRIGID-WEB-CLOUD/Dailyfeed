
'use server';

/**
 * @fileOverview An AI flow to generate full blog post content from a topic.
 *
 * - generateBlogContent - A function that generates a multi-paragraph blog post.
 * - GenerateBlogContentInput - The input type for the function.
 * - GenerateBlogContentOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateBlogContentInputSchema = z.object({
  topic: z.string().describe('The topic or headline for the blog post.'),
});
export type GenerateBlogContentInput = z.infer<typeof GenerateBlogContentInputSchema>;

const GenerateBlogContentOutputSchema = z.object({
  content: z
    .string()
    .describe('The generated blog post content, formatted in Markdown with paragraphs separated by newlines.'),
});
export type GenerateBlogContentOutput = z.infer<typeof GenerateBlogContentOutputSchema>;

export async function generateBlogContent(
  input: GenerateBlogContentInput
): Promise<GenerateBlogContentOutput> {
  return generateBlogContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateBlogContentPrompt',
  input: { schema: GenerateBlogContentInputSchema },
  output: { schema: GenerateBlogContentOutputSchema },
  prompt: `You are an expert blog writer. Write an engaging, well-structured, and informative blog post about the following topic.
  The post should be several paragraphs long. Use Markdown for formatting if necessary (e.g., for lists or emphasis).
  Ensure paragraphs are separated by a double newline.

  Topic: {{{topic}}}
  `,
});

const generateBlogContentFlow = ai.defineFlow(
  {
    name: 'generateBlogContentFlow',
    inputSchema: GenerateBlogContentInputSchema,
    outputSchema: GenerateBlogContentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    
    if (output) {
      // Ensure content has paragraph breaks
      const formattedContent = output.content.replace(/(\n\s*\n)/g, '<p>').replace(/\n/g, '<br>');
      return { content: `<p>${formattedContent.split('<p>').join('</p><p>')}</p>` };
    }

    return { content: '' };
  }
);
