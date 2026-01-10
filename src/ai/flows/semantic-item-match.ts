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
});

const SemanticItemMatchInputSchema = z.object({
  requestedItemName: z.string().describe('The name of the item being requested by a user.'),
  availableItems: z.array(ItemSchema).describe("A list of items (with their ID and name) that the fulfilling user has in their locker and are available for rent."),
});
export type SemanticItemMatchInput = z.infer<typeof SemanticItemMatchInputSchema>;

const SemanticItemMatchOutputSchema = z.object({
  matchedItemId: z.string().nullable().describe('The ID of the best-matched item from the available list, or null if no suitable match is found.'),
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

The available items are (provided as a list of objects with an id and a name):
{{#each availableItems}}
- { id: '{{id}}', name: '{{name}}' }
{{/each}}

Analyze the requested item and the list of available items. Determine which available item is the most similar or could best fulfill the request. For example, a "phone charger" request could be fulfilled by a "USB-C charger" or "iPhone cable". An "electric iron" could be fulfilled by a "steam iron".

If you find a good match, return the ID of the matched item in the 'matchedItemId' field.
If none of the available items are a good semantic match for the requested item, return null for 'matchedItemId'.

Provide a brief reasoning for your decision.`,
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
            matchedItemId: null,
            reasoning: "The user has no items available in their locker to match with."
        }
    }
    const {output} = await prompt(input);

    if (!output) {
      return {
        matchedItemId: null,
        reasoning: "The AI model could not determine a match.",
      };
    }
    
    // Ensure that if the model returns an empty string, we treat it as null
    if (output.matchedItemId === "") {
        output.matchedItemId = null;
    }
    
    return output;
  }
);
