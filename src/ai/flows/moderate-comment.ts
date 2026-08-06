
'use server';

/**
 * @fileOverview An AI flow for moderating user-submitted comments.
 *
 * - moderateComment - A function that classifies a comment as Approved, Rejected, or Spam.
 * - ModerateCommentInput - The input type for the function.
 * - ModerateCommentOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ModerateCommentInputSchema = z.object({
  author: z.string().describe('The name of the person who wrote the comment.'),
  commentText: z.string().describe('The full text of the comment to be moderated.'),
});
export type ModerateCommentInput = z.infer<typeof ModerateCommentInputSchema>;

const ModerateCommentOutputSchema = z.object({
  status: z.enum(['Approved', 'Rejected', 'Spam']).describe('The moderation status of the comment.'),
  reasoning: z.string().describe('A brief explanation for the moderation decision.'),
});
export type ModerateCommentOutput = z.infer<typeof ModerateCommentOutputSchema>;

export async function moderateComment(input: ModerateCommentInput): Promise<ModerateCommentOutput> {
  return moderateCommentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moderateCommentPrompt',
  input: { schema: ModerateCommentInputSchema },
  output: { schema: ModerateCommentOutputSchema },
  prompt: `You are an expert content moderator for a blog. Your task is to classify a user-submitted comment based on a set of rules and provide a brief reasoning for your decision.

Here are the classification rules:
- Approved: The comment is appropriate, on-topic, and ready to be displayed publicly. It contributes to the discussion in a meaningful way.
- Spam: The comment is unwanted, unsolicited, and typically posted by automated bots. It often contains irrelevant links or malicious content. Comments that are just advertisements should be marked as Spam.
- Rejected: The comment is not spam but is still inappropriate for the blog. This includes comments with abusive language, personal attacks, hate speech, or content that is completely off-topic from the blog post.

Analyze the following comment and classify it according to these rules.

Author: {{{author}}}
Comment Text: {{{commentText}}}

Provide your classification and a short, one-sentence reasoning.
`,
});

const moderateCommentFlow = ai.defineFlow(
  {
    name: 'moderateCommentFlow',
    inputSchema: ModerateCommentInputSchema,
    outputSchema: ModerateCommentOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
