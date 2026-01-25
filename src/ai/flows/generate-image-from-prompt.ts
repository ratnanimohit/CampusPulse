'use server';
/**
 * @fileOverview A flow to generate an image from a text prompt.
 *
 * - generateImageFromPrompt - A function that handles image generation.
 * - GenerateImageInput - The input type for the generateImageFromPrompt function.
 * - GenerateImageOutput - The return type for the generateImageFromPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateImageInputSchema = z.object({
  prompt: z.string().describe('The text prompt to generate an image from.'),
});
export type GenerateImageInput = z.infer<typeof GenerateImageInputSchema>;

const GenerateImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated image.'),
});
export type GenerateImageOutput = z.infer<typeof GenerateImageOutputSchema>;

export async function generateImageFromPrompt(input: GenerateImageInput): Promise<GenerateImageOutput> {
  return generateImageFromPromptFlow(input);
}

const generateImageFromPromptFlow = ai.defineFlow(
  {
    name: 'generateImageFromPromptFlow',
    inputSchema: GenerateImageInputSchema,
    outputSchema: GenerateImageOutputSchema,
  },
  async (input) => {
    const { media } = await ai.generate({
      model: 'googleai/gemini-2.5-flash-image-preview',
      prompt: `A high-quality, professional product photograph of a single ${input.prompt}, centered on a clean, neutral background.`,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      }
    });

    if (!media?.url) {
        throw new Error('Image generation failed to return an image.');
    }

    return { imageUrl: media.url };
  }
);
