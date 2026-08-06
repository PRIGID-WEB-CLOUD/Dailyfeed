
'use server';

/**
 * @fileOverview A Genkit flow for sending a newsletter to subscribers.
 * This flow simulates sending an email campaign via an integrated service like Mailchimp.
 */

import { ai } from '@/ai/genkit';
import { getIntegration } from '@/lib/integration-service';
import { z } from 'genkit';
import mailchimp from '@mailchimp/mailchimp_marketing';

const SendNewsletterInputSchema = z.object({
  subject: z.string().describe('The subject line of the newsletter.'),
  content: z.string().describe('The HTML or text content of the newsletter.'),
  subscribers: z.array(z.string().email()).describe('A list of subscriber email addresses.'),
});
export type SendNewsletterInput = z.infer<typeof SendNewsletterInputSchema>;

const SendNewsletterOutputSchema = z.object({
  success: z.boolean().describe('Whether the newsletter was successfully sent.'),
  message: z.string().describe('A message indicating the result of the send action.'),
  campaignId: z.string().optional().describe('The ID of the created campaign in the email service.'),
});
export type SendNewsletterOutput = z.infer<typeof SendNewsletterOutputSchema>;

export async function sendNewsletter(input: SendNewsletterInput): Promise<SendNewsletterOutput> {
  return sendNewsletterFlow(input);
}

const sendNewsletterFlow = ai.defineFlow(
  {
    name: 'sendNewsletterFlow',
    inputSchema: SendNewsletterInputSchema,
    outputSchema: SendNewsletterOutputSchema,
  },
  async (input) => {
    // Check if the Mailchimp integration is connected
    const mailchimpIntegration = await getIntegration('mailchimp');
    
    if (!mailchimpIntegration?.connected || !mailchimpIntegration.credentials?.apiKey) {
      return {
        success: false,
        message: 'Mailchimp integration is not connected. Please connect it in the Marketing settings.',
      };
    }

    try {
        mailchimp.setConfig({
          apiKey: mailchimpIntegration.credentials.apiKey,
          server: mailchimpIntegration.credentials.apiKey.split('-')[1], // The server prefix is the part after the hyphen in the API key
        });

        // This is a simulation. A real implementation would need to get the list ID,
        // create a campaign, set its content, and then send it.
        // For example:
        // const { id: campaignId } = await mailchimp.campaigns.create({ type: 'regular', ... });
        // await mailchimp.campaigns.setContent(campaignId, { html: input.content });
        // await mailchimp.campaigns.send(campaignId);
        
        console.log(`(SIMULATED) Mailchimp client configured for server: ${mailchimp.config.server}`);
        console.log(`(SIMULATED) Creating campaign with subject: "${input.subject}"`);
        console.log(`(SIMULATED) Sending to ${input.subscribers.length} subscribers.`);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const campaignId = `mc_simulated_${Date.now()}`;

        return {
          success: true,
          message: `Newsletter sent to ${input.subscribers.length} subscribers via Mailchimp.`,
          campaignId: campaignId,
        };
    } catch (error: any) {
        console.error("Error with Mailchimp API:", error);
        return {
            success: false,
            message: `Failed to send via Mailchimp: ${error.message || 'Check API key.'}`
        }
    }
  }
);
