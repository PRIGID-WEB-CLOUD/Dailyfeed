'use server';

/**
 * @fileOverview A Genkit flow for saving a revision of a blog post.
 *
 * - savePostRevision - A function that saves a snapshot of the current post content as a revision.
 * - SavePostRevisionInput - The input type for the savePostRevision function.
 * - SavePostRevisionOutput - The return type for the savePostRevision function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SavePostRevisionInputSchema = z.object({
  postId: z.string().describe('The ID of the post being revised.'),
  content: z.string().describe('The content of the post to save as a revision.'),
  authorId: z.string().describe('The ID of the user saving the revision.'),
});
export type SavePostRevisionInput = z.infer<typeof SavePostRevisionInputSchema>;

const SavePostRevisionOutputSchema = z.object({
  revisionId: z.string().describe('The ID of the newly created revision.'),
  savedAt: z.string().describe('The ISO timestamp when the revision was saved.'),
});
export type SavePostRevisionOutput = z.infer<typeof SavePostRevisionOutputSchema>;

export async function savePostRevision(input: SavePostRevisionInput): Promise<SavePostRevisionOutput> {
  return savePostRevisionFlow(input);
}

const savePostRevisionFlow = ai.defineFlow(
  {
    name: 'savePostRevisionFlow',
    inputSchema: SavePostRevisionInputSchema,
    outputSchema: SavePostRevisionOutputSchema,
  },
  async (input) => {
    console.log(`Simulating save for post ${input.postId} by author ${input.authorId}`);
    // In a real application, you would save the content to a 'revisions' collection in your database.
    const revisionId = `rev_${input.postId}_${Date.now()}`;
    const savedAt = new Date().toISOString();
    
    // For now, we just log and return a success message.
    return {
      revisionId,
      savedAt,
    };
  }
);
