
'use server';

/**
 * @fileOverview A Genkit flow for sharing a blog post on Facebook.
 *
 * This flow is designed to be triggered when a blog post is published.
 * It shares the post content and a link to a Facebook page.
 */

import { ai } from '@/ai/genkit';
import { getIntegration } from '@/lib/integration-service';
import { z } from 'genkit';

const ShareOnFacebookInputSchema = z.object({
  postTitle: z.string().describe('The title of the blog post.'),
  postUrl: z.string().url().describe('The URL of the blog post.'),
  postExcerpt: z.string().describe('A short excerpt or summary of the post.'),
});
export type ShareOnFacebookInput = z.infer<typeof ShareOnFacebookInputSchema>;

const ShareOnFacebookOutputSchema = z.object({
  success: z.boolean().describe('Whether the post was successfully shared.'),
  message: z.string().describe('A message indicating the result of the share action.'),
  sharedPostUrl: z.string().url().optional().describe('The URL of the created Facebook post.'),
});
export type ShareOnFacebookOutput = z.infer<typeof ShareOnFacebookOutputSchema>;

export async function shareOnFacebook(input: ShareOnFacebookInput): Promise<ShareOnFacebookOutput> {
  return shareOnFacebookFlow(input);
}

const shareOnFacebookFlow = ai.defineFlow(
  {
    name: 'shareOnFacebookFlow',
    inputSchema: ShareOnFacebookInputSchema,
    outputSchema: ShareOnFacebookOutputSchema,
  },
  async (input) => {
    const facebookIntegration = await getIntegration('facebook');
    if (!facebookIntegration?.connected || !facebookIntegration.credentials) {
      return {
        success: false,
        message: 'Facebook integration is not connected. Cannot share post.',
      };
    }
    
    const { pageId, accessToken } = facebookIntegration.credentials;
    const message = `${input.postTitle}\n\n${input.postExcerpt}`;
    
    const graphApiUrl = `https://graph.facebook.com/v19.0/${pageId}/feed`;
    
    try {
        const response = await fetch(graphApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message,
            link: input.postUrl,
            access_token: accessToken,
          }),
        });

        const responseData = await response.json();

        if (!response.ok) {
          throw new Error(responseData.error?.message || 'Facebook API error');
        }
        
        const postId = responseData.id.split('_')[1];
        return {
            success: true,
            message: 'Post successfully shared to Facebook.',
            sharedPostUrl: `https://www.facebook.com/${pageId}/posts/${postId}`
        };

    } catch (error: any) {
        console.error("Error posting to Facebook:", error);
        return {
            success: false,
            message: `Failed to share to Facebook: ${error.message}`
        }
    }
  }
);
