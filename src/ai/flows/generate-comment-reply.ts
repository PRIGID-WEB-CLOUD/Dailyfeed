
'use server';

/**
 * @fileOverview An AI flow to generate a reply to a user's comment.
 *
 * - generateCommentReply - A function that drafts a reply to a comment.
 * - GenerateCommentReplyInput - The input type for the function.
 * - GenerateCommentReplyOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateCommentReplyInputSchema = z.object({
  postTitle: z.string().describe('The title of the blog post being commented on.'),
  postContent: z.string().describe('A snippet of the blog post content for context.'),
  originalCommentAuthor: z.string().describe("The name of the user who wrote the original comment."),
  originalCommentText: z.string().describe("The text of the original comment."),
});
export type GenerateCommentReplyInput = z.infer<typeof GenerateCommentReplyInputSchema>;

const GenerateCommentReplyOutputSchema = z.object({
  replyText: z.string().describe('The generated reply to the comment.'),
});
export type GenerateCommentReplyOutput = z.infer<typeof GenerateCommentReplyOutputSchema>;

export async function generateCommentReply(input: GenerateCommentReplyInput): Promise<GenerateCommentReplyOutput> {
  return generateCommentReplyFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCommentReplyPrompt',
  input: { schema: GenerateCommentReplyInputSchema },
  output: { schema: GenerateCommentReplyOutputSchema },
  prompt: `You are an AI assistant for a blog. The author is currently unavailable. Your task is to write a short, automated reply to acknowledge a user's comment.

The reply should:
1. Thank the user for their comment.
2. Mention that the author is away but the comment will be passed along.
3. Be very concise (1-2 sentences).
4. Address the commenter by name.
5. Do not attempt to answer any questions in the comment. Keep it a simple acknowledgment.

Original comment from "{{{originalCommentAuthor}}}":
"{{{originalCommentText}}}"
`,
});

const generateCommentReplyFlow = ai.defineFlow(
  {
    name: 'generateCommentReplyFlow',
    inputSchema: GenerateCommentReplyInputSchema,
    outputSchema: GenerateCommentReplyOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
