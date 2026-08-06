
'use server';
/**
 * @fileOverview An AI flow for converting speech audio into text.
 *
 * - speechToText - A function that transcribes audio.
 * - SpeechToTextInput - The input type for the function.
 * - SpeechToTextOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { MediaPart } from 'genkit';

const SpeechToTextInputSchema = z.object({
  audio: z.string().describe("A chunk of audio as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type SpeechToTextInput = z.infer<typeof SpeechToTextInputSchema>;

const SpeechToTextOutputSchema = z.object({
  transcription: z.string().describe('The transcribed text from the audio.'),
});
export type SpeechToTextOutput = z.infer<typeof SpeechToTextOutputSchema>;

export async function speechToText(
  input: SpeechToTextInput
): Promise<SpeechToTextOutput> {
  return speechToTextFlow(input);
}

const speechToTextFlow = ai.defineFlow(
  {
    name: 'speechToTextFlow',
    inputSchema: SpeechToTextInputSchema,
    outputSchema: SpeechToTextOutputSchema,
  },
  async (input) => {
    const audioPart: MediaPart = {
        media: { url: input.audio },
    };

    const result = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      prompt: [
        audioPart,
        { text: 'Transcribe this audio recording.' },
      ],
    });

    return { transcription: result.text };
  }
);
