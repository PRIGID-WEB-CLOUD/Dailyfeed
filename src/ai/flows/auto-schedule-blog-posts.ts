'use server';

/**
 * @fileOverview An AI tool to schedule blog posts automatically based on content and social media engagement.
 *
 * - autoScheduleBlogPosts - A function that handles the automatic scheduling of blog posts.
 * - AutoScheduleBlogPostsInput - The input type for the autoScheduleBlogPosts function.
 * - AutoScheduleBlogPostsOutput - The return type for the autoScheduleBlogPosts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoScheduleBlogPostsInputSchema = z.object({
  blogPostContent: z.string().describe('The content of the blog post.'),
  historicalEngagementData: z.string().describe('Historical social media engagement data (e.g., likes, shares, comments) as a JSON string.'),
  targetAudience: z.string().describe('Description of the target audience for the blog post.'),
});
export type AutoScheduleBlogPostsInput = z.infer<typeof AutoScheduleBlogPostsInputSchema>;

const AutoScheduleBlogPostsOutputSchema = z.object({
  suggestedSchedule: z.string().describe('A suggested date and time to publish the blog post, formatted as ISO date string.'),
  reasoning: z.string().describe('The AI’s reasoning for suggesting the given schedule.'),
});
export type AutoScheduleBlogPostsOutput = z.infer<typeof AutoScheduleBlogPostsOutputSchema>;

export async function autoScheduleBlogPosts(input: AutoScheduleBlogPostsInput): Promise<AutoScheduleBlogPostsOutput> {
  return autoScheduleBlogPostsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autoScheduleBlogPostsPrompt',
  input: {schema: AutoScheduleBlogPostsInputSchema},
  output: {schema: AutoScheduleBlogPostsOutputSchema},
  prompt: `You are an AI assistant that schedules blog posts for maximum reach.  You will determine the best time to publish the content provided by the user, based on historical engagement data, content, and target audience.

Analyze the blog post content, target audience, and historical social media engagement data provided to determine the optimal posting schedule.

Blog Post Content: {{{blogPostContent}}}

Target Audience: {{{targetAudience}}}

Historical Engagement Data: {{{historicalEngagementData}}}

Consider factors such as peak engagement times, audience demographics, and content relevance when determining the schedule.

Return the suggested schedule, formatted as an ISO date string, along with a brief explanation of your reasoning.

Output the schedule and reasoning in JSON format.
`,
});

const autoScheduleBlogPostsFlow = ai.defineFlow(
  {
    name: 'autoScheduleBlogPostsFlow',
    inputSchema: AutoScheduleBlogPostsInputSchema,
    outputSchema: AutoScheduleBlogPostsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
