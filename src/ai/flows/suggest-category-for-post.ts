
'use server';

/**
 * @fileOverview An AI flow to suggest a category for a blog post.
 *
 * - suggestCategoryForPost - A function that suggests a category based on content.
 * - SuggestCategoryForPostInput - The input type for the function.
 * - SuggestCategoryForPostOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestCategoryForPostInputSchema = z.object({
  postContent: z.string().describe('The content of the blog post.'),
  availableCategories: z.array(z.string()).describe('A list of available categories to choose from.'),
});
export type SuggestCategoryForPostInput = z.infer<typeof SuggestCategoryForPostInputSchema>;

const SuggestCategoryForPostOutputSchema = z.object({
  category: z.string().describe('The most relevant category for the post.'),
});
export type SuggestCategoryForPostOutput = z.infer<typeof SuggestCategoryForPostOutputSchema>;

export async function suggestCategoryForPost(
  input: SuggestCategoryForPostInput
): Promise<SuggestCategoryForPostOutput> {
  return suggestCategoryForPostFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestCategoryForPostPrompt',
  input: { schema: SuggestCategoryForPostInputSchema },
  output: { schema: SuggestCategoryForPostOutputSchema },
  prompt: `You are an expert content classifier. Based on the following blog post content, choose the single most relevant category from the provided list.

Available Categories:
{{#each availableCategories}}
- {{this}}
{{/each}}

Blog Post Content:
{{{postContent}}}

Analyze the content and determine which of the available categories is the best fit. Respond with only the name of that single category. If none seem to fit well, suggest a new, more appropriate category name.
`,
});

const suggestCategoryForPostFlow = ai.defineFlow(
  {
    name: 'suggestCategoryForPostFlow',
    inputSchema: SuggestCategoryForPostInputSchema,
    outputSchema: SuggestCategoryForPostOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
