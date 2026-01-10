'use server';

/**
 * @fileOverview An AI agent for semantically matching a requested item with available items.
 *
 * - findBestItemMatch - A function that finds the best semantic match for a requested item from a list of available items.
 * - SemanticItemMatchInput - The input type for the findBestItemMatch function.
 * - SemanticItemMatchOutput - The return type for the findBestItemMatch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  imageUrl: z.string(),
  karma: z.number(),
  ownerId: z.string(),
  available: z.boolean(),
});
export type Item = z.infer<typeof ItemSchema>;


const SemanticItemMatchInputSchema = z.object({
  requestedItemName: z.string().describe('The name of the item being requested by a user.'),
  availableItems: z.array(ItemSchema).describe("A list of items (with their full details) that the fulfilling user has in their locker and are available for rent."),
});
export type SemanticItemMatchInput = z.infer<typeof SemanticItemMatchInputSchema>;

const SemanticItemMatchOutputSchema = z.object({
  matchedItem: ItemSchema.nullable().describe('The full object of the best-matched item from the available list, or null if no suitable match is found.'),
  reasoning: z.string().describe('A brief explanation of why the item was matched or why no match was found.'),
});
export type SemanticItemMatchOutput = z.infer<typeof SemanticItemMatchOutputSchema>;

export async function findBestItemMatch(
  input: SemanticItemMatchInput
): Promise<SemanticItemMatchOutput> {
  return semanticItemMatchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'semanticItemMatchPrompt',
  input: {schema: SemanticItemMatchInputSchema},
  output: {schema: SemanticItemMatchOutputSchema},
  prompt: `You are an AI assistant for a campus rental app. Your task is to find the best semantic match for a requested item from a list of items a user has available.

The requested item is: "{{requestedItemName}}".

The available items are (provided as a JSON array of objects):
{{{json availableItems}}}

Analyze the requested item and the list of available items. Determine which available item is the most similar or could best fulfill the request. For example, a "phone charger" request could be fulfilled by a "USB-C charger" or "iPhone cable". An "electric iron" could be fulfilled by a "steam iron".

If you find a good match, return the entire JSON object of the matched item in the 'matchedItem' field.
If none of the available items are a good semantic match for the requested item, you MUST return null for the 'matchedItem' field.

Provide a brief reasoning for your decision in the 'reasoning' field.`,
});

const semanticItemMatchFlow = ai.defineFlow(
  {
    name: 'semanticItemMatchFlow',
    inputSchema: SemanticItemMatchInputSchema,
    outputSchema: SemanticItemMatchOutputSchema,
  },
  async input => {
    if (input.availableItems.length === 0) {
        return {
            matchedItem: null,
            reasoning: "The user has no items available in their locker to match with."
        }
    }
    const {output} = await prompt(input);

    if (!output) {
      return {
        matchedItem: null,
        reasoning: "The AI model could not determine a match.",
      };
    }
    
    // Ensure that if a matched item is returned, it exists in the original availableItems list.
    if (output.matchedItem) {
        const isValidMatch = input.availableItems.some(item => item.id === output.matchedItem!.id);
        if (!isValidMatch) {
            return {
                matchedItem: null,
                reasoning: `The AI suggested a match, but it was not found in the user's available items.`
            }
        }
    }
    
    return output;
  }
);
