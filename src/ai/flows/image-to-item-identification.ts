'use server';

/**
 * @fileOverview This file defines a Genkit flow for identifying items from images.
 *
 * The flow uses Google Image Recognition to identify the item type from an image uploaded by the user.
 * If the image recognition fails, the user can manually enter the item details.
 *
 * @exports {identifyItemFromImage} - The main function to identify the item from an image.
 * @exports {ImageToItemIdentificationInput} - The input type for the identifyItemFromImage function.
 * @exports {ImageToItemIdentificationOutput} - The return type for the identifyItemFromImage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ImageToItemIdentificationInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of the item, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'." // Corrected typo here
    ),
});

export type ImageToItemIdentificationInput = z.infer<typeof ImageToItemIdentificationInputSchema>;

const ImageToItemIdentificationOutputSchema = z.object({
  itemType: z.string().describe('The identified type of the item, or null if not identified.'),
  manualEntryRequired: z
    .boolean()
    .describe(
      'Whether manual entry of item details is required because image recognition failed.'
    ),
});

export type ImageToItemIdentificationOutput = z.infer<typeof ImageToItemIdentificationOutputSchema>;

export async function identifyItemFromImage(
  input: ImageToItemIdentificationInput
): Promise<ImageToItemIdentificationOutput> {
  return imageToItemIdentificationFlow(input);
}

const imageToItemIdentificationPrompt = ai.definePrompt({
  name: 'imageToItemIdentificationPrompt',
  input: {schema: ImageToItemIdentificationInputSchema},
  output: {schema: ImageToItemIdentificationOutputSchema},
  prompt: `You are an AI assistant that identifies the type of item in an image.

  Analyze the image provided and determine the item type. If you cannot confidently identify the item, set itemType to null and manualEntryRequired to true.

  Image: {{media url=photoDataUri}}
  Response in JSON:`, // Added 'Response in JSON:' to request JSON format.
});

const imageToItemIdentificationFlow = ai.defineFlow(
  {
    name: 'imageToItemIdentificationFlow',
    inputSchema: ImageToItemIdentificationInputSchema,
    outputSchema: ImageToItemIdentificationOutputSchema,
  },
  async input => {
    try {
      const {output} = await imageToItemIdentificationPrompt(input);
      if (output) {
        return output;
      } else {
        // Handle the case where the prompt returns no output.
        return {
          itemType: 'unknown',
          manualEntryRequired: true,
        };
      }
    } catch (error) {
      console.error('Error during image identification:', error);
      // Return a default object indicating failure
      return {
        itemType: 'unknown',
        manualEntryRequired: true,
      };
    }
  }
);
