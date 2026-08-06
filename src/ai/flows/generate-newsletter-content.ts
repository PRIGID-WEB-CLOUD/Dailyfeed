
'use server';

/**
 * @fileOverview AI flow to generate newsletter content from a topic.
 *
 * - generateNewsletterContent - A function that creates newsletter content.
 * - GenerateNewsletterContentInput - The input type for the function.
 * - GenerateNewsletterContentOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateNewsletterContentInputSchema = z.object({
  topic: z.string().describe('The topic or main idea of the newsletter.'),
  subject: z.string().optional().describe('The subject line of the newsletter, if available.'),
  blogName: z.string().describe("The name of the blog."),
});
export type GenerateNewsletterContentInput = z.infer<typeof GenerateNewsletterContentInputSchema>;

const GenerateNewsletterContentOutputSchema = z.object({
  content: z
    .string()
    .describe('The generated newsletter content, formatted as plain text with line breaks.'),
});
export type GenerateNewsletterContentOutput = z.infer<typeof GenerateNewsletterContentOutputSchema>;

export async function generateNewsletterContent(
  input: GenerateNewsletterContentInput
): Promise<GenerateNewsletterContentOutput> {
  return generateNewsletterContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateNewsletterContentPrompt',
  input: {schema: GenerateNewsletterContentInputSchema},
  output: {schema: GenerateNewsletterContentOutputSchema},
  prompt: `You are an expert copywriter specializing in engaging newsletters for a blog named '{{{blogName}}}'.

  Write compelling newsletter content based on the following topic.
  {{#if subject}}The subject line is "{{{subject}}}".{{/if}}
  
  Topic: {{{topic}}}

  The content should be a few paragraphs long, easy to read, and have a friendly, conversational tone. Use line breaks to separate paragraphs.
  `,
});

const generateNewsletterContentFlow = ai.defineFlow(
  {
    name: 'generateNewsletterContentFlow',
    inputSchema: GenerateNewsletterContentInputSchema,
    outputSchema: GenerateNewsletterContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
