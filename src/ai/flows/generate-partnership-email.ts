
'use server';

/**
 * @fileOverview An AI flow for generating partnership follow-up emails.
 *
 * - generatePartnershipEmail - A function that drafts an email based on the partnership status.
 * - GeneratePartnershipEmailInput - The input type for the function.
 * - GeneratePartnershipEmailOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePartnershipEmailInputSchema = z.object({
  blogName: z.string().describe("The name of the blog the admin represents."),
  companyName: z.string().describe("The name of the partner's company."),
  contactPerson: z.string().describe("The name of the contact person."),
  summary: z.string().describe("A brief summary of the reason for the decision (e.g., 'offer too low', 'great fit, deal closed')."),
  status: z.enum(['Closed', 'Rejected']).describe("The final status of the partnership inquiry."),
});
export type GeneratePartnershipEmailInput = z.infer<typeof GeneratePartnershipEmailInputSchema>;

const GeneratePartnershipEmailOutputSchema = z.object({
  emailBody: z.string().describe('The generated body of the email.'),
});
export type GeneratePartnershipEmailOutput = z.infer<typeof GeneratePartnershipEmailOutputSchema>;

export async function generatePartnershipEmail(input: GeneratePartnershipEmailInput): Promise<GeneratePartnershipEmailOutput> {
  return generatePartnershipEmailFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePartnershipEmailPrompt',
  input: {schema: GeneratePartnershipEmailInputSchema},
  output: {schema: GeneratePartnershipEmailOutputSchema},
  prompt: `You are an AI assistant for the admin of a blog named '{{{blogName}}}'. Your task is to draft a professional and courteous email to a potential partner based on the outcome of their inquiry.

Company Name: {{{companyName}}}
Contact Person: {{{contactPerson}}}
Final Status: {{{status}}}
Reason/Summary: {{{summary}}}

Draft an email body for {{{contactPerson}}}.

- If the status is 'Closed', write a positive email confirming the partnership. Mention that you're excited to work with them and outline the next steps (e.g., "Our team will be in touch shortly with an agreement and onboarding materials.").
- If the status is 'Rejected', write a polite email declining the partnership at this time. Be gracious and professional. Briefly mention the reason from the summary if appropriate (e.g., "While we were impressed with your brand, it's not the right fit for our audience at this moment."). Keep the door open for future collaborations.

The tone should be professional, clear, and friendly. Start the email with "Hi {{{contactPerson}}},". Do not include a subject line or a sign-off (like "Best regards"). Just provide the email body content.
`,
});

const generatePartnershipEmailFlow = ai.defineFlow(
  {
    name: 'generatePartnershipEmailFlow',
    inputSchema: GeneratePartnershipEmailInputSchema,
    outputSchema: GeneratePartnershipEmailOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
