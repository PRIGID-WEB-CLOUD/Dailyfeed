'use server';

/**
 * @fileOverview An AI flow for generating images from a text prompt.
 *
 * - generateImage - A function that generates an image based on a text description.
 * - GenerateImageInput - The input type for the generateImage function.
 * - GenerateImageOutput - The return type for the generateImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('A text description of the image to generate.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe("The data URI of the generated image. Expected format: 'data:image/...;base64,<encoded_data>'."),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImage(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFlow(input);
}

const generateImageFlow = ai.defineFlow(
  {
    name: 'generateImageFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    // Note: This is a placeholder. In a real application, you would call a text-to-image model.
    // For example, using a Genkit plugin for a service like Google's Imagen.
    console.log(`Generating image for prompt: ${input.prompt}`);

    const { media } = await ai.generate({
      model: 'googleai/imagen-4.0-fast-generate-001',
      prompt: input.prompt,
    });
    
    const imageUrl = media.url;
    if (!imageUrl) {
      throw new Error('Image generation failed to return a URL.');
    }

    return { imageUrl };
  }
);
