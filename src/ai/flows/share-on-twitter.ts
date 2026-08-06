
'use server';

/**
 * @fileOverview A Genkit flow for sharing a blog post on Twitter (X).
 *
 * This flow is designed to be triggered when a blog post is published.
 * It generates a tweet from the post title and URL.
 */

import { ai } from '@/ai/genkit';
import { getIntegration } from '@/lib/integration-service';
import { z } from 'genkit';
import { TwitterApi } from 'twitter-api-v2';

const ShareOnTwitterInputSchema = z.object({
  postTitle: z.string().describe('The title of the blog post.'),
  postUrl: z.string().url().describe('The URL of the blog post.'),
});
export type ShareOnTwitterInput = z.infer<typeof ShareOnTwitterInputSchema>;

const ShareOnTwitterOutputSchema = z.object({
  success: z.boolean().describe('Whether the tweet was successfully posted.'),
  message: z.string().describe('A message indicating the result of the action.'),
  tweetUrl: z.string().url().optional().describe('The URL of the created tweet.'),
});
export type ShareOnTwitterOutput = z.infer<typeof ShareOnTwitterOutputSchema>;

export async function shareOnTwitter(input: ShareOnTwitterInput): Promise<ShareOnTwitterOutput> {
  return shareOnTwitterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateTweetPrompt',
  input: { schema: ShareOnTwitterInputSchema },
  prompt: `You are a social media manager. Create a short, engaging tweet for the following blog post. 
  Include relevant hashtags. The tweet must not exceed 280 characters.
  
  Post Title: {{{postTitle}}}
  Link: {{{postUrl}}}
  
  Tweet:`,
});


const shareOnTwitterFlow = ai.defineFlow(
  {
    name: 'shareOnTwitterFlow',
    inputSchema: ShareOnTwitterInputSchema,
    outputSchema: ShareOnTwitterOutputSchema,
  },
  async (input) => {
    const twitterIntegration = await getIntegration('twitter');
    if (!twitterIntegration?.connected || !twitterIntegration.credentials) {
      return {
        success: false,
        message: 'Twitter integration is not connected. Cannot share post.',
      };
    }
    
    const llmResponse = await prompt(input);
    const tweetText = llmResponse.text;

    try {
      // Note: This requires an app with write permissions (v2).
      const twitterClient = new TwitterApi({
        appKey: twitterIntegration.credentials.apiKey,
        appSecret: twitterIntegration.credentials.apiSecret,
        accessToken: twitterIntegration.credentials.accessToken,
        accessSecret: twitterIntegration.credentials.accessSecret,
      });

      const { data: createdTweet } = await twitterClient.v2.tweet(tweetText);
      console.log('Tweet posted:', createdTweet.id);

      return {
        success: true,
        message: `Post successfully shared to X/Twitter.`,
        tweetUrl: `https://twitter.com/user/status/${createdTweet.id}`
      };

    } catch (error: any) {
        console.error('Error posting to Twitter:', error);
        return {
            success: false,
            message: `Failed to share to Twitter: ${error.message}`,
        }
    }
  }
);
