'use server';

/**
 * @fileOverview An AI agent for suggesting optimal pricing for rental items.
 *
 * - suggestOptimalPrice - A function that suggests an optimal price for a rental item.
 * - OptimalPricingInput - The input type for the suggestOptimalPrice function.
 * - OptimalPricingOutput - The return type for the suggestOptimalPrice function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OptimalPricingInputSchema = z.object({
  itemDescription: z
    .string()
    .describe('The description of the item being rented out.'),
  userPreferences: z
    .string()
    .describe('The preferences of the user renting out the item.'),
  itemCharacteristics: z
    .string()
    .describe('The characteristics of the item being rented out.'),
  currentPrice: z.number().describe('The current price of the item.'),
});
export type OptimalPricingInput = z.infer<typeof OptimalPricingInputSchema>;

const OptimalPricingOutputSchema = z.object({
  suggestedPrice: z
    .number()
    .describe('The suggested price for the item based on user preferences and item characteristics.'),
  reasoning: z
    .string()
    .describe('The reasoning behind the suggested price.'),
});
export type OptimalPricingOutput = z.infer<typeof OptimalPricingOutputSchema>;

export async function suggestOptimalPrice(
  input: OptimalPricingInput
): Promise<OptimalPricingOutput> {
  return optimalPricingFlow(input);
}

const prompt = ai.definePrompt({
  name: 'optimalPricingPrompt',
  input: {schema: OptimalPricingInputSchema},
  output: {schema: OptimalPricingOutputSchema},
  prompt: `You are an expert in pricing rental items. Given the item description, user preferences, item characteristics and current price, you will suggest an optimal price for the item. Provide a short explanation for why the price is optimal. 

Item Description: {{{itemDescription}}}
User Preferences: {{{userPreferences}}}
Item Characteristics: {{{itemCharacteristics}}}
Current Price: {{{currentPrice}}}

Suggest an optimal price and explain your reasoning. Consider that every 20 karma points is equal to 1 rupee at the college canteen.

Optimal Price: {{suggestedPrice}}
Reasoning: {{reasoning}}`,
});

const optimalPricingFlow = ai.defineFlow(
  {
    name: 'optimalPricingFlow',
    inputSchema: OptimalPricingInputSchema,
    outputSchema: OptimalPricingOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
