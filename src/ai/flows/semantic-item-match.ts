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

const SemanticItemMatchInputSchema = z.object({
  requestedItemName: z.string().describe('The name of the item being requested by a user.'),
  availableItemNames: z.array(z.string()).describe("A list of item names that the fulfilling user has in their locker and are available for rent."),
});
export type SemanticItemMatchInput = z.infer<typeof SemanticItemMatchInputSchema>;

const SemanticItemMatchOutputSchema = z.object({
  matchedItemName: z.string().nullable().describe('The name of the best-matched item from the available list, or null if no suitable match is found.'),
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

The available items are:
{{#each availableItemNames}}
- {{this}}
{{/each}}

Analyze the requested item and the list of available items. Determine which available item is the most similar or could best fulfill the request. For example, a "phone charger" request could be fulfilled by a "USB-C charger" or "iPhone cable". An "electric iron" could be fulfilled by a "steam iron".

If you find a good match, return the exact name of the matched item from the available list in the 'matchedItemName' field.
If none of the available items are a good semantic match for the requested item, return null for 'matchedItemName'.

Provide a brief reasoning for your decision.`,
});

const semanticItemMatchFlow = ai.defineFlow(
  {
    name: 'semanticItemMatchFlow',
    inputSchema: SemanticItemMatchInputSchema,
    outputSchema: SemanticItemMatchOutputSchema,
  },
  async input => {
    if (input.availableItemNames.length === 0) {
        return {
            matchedItemName: null,
            reasoning: "The user has no items available in their locker to match with."
        }
    }
    const {output} = await prompt(input);
    return output!;
  }
);
