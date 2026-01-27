'use server';
/**
 * @fileOverview An AI assistant to help users navigate and understand the CampusPulse app.
 *
 * - appAssistant - A function that provides answers to user questions about the app.
 * - AppAssistantInput - The input type for the appAssistant function.
 * - AppAssistantOutput - The return type for the appAssistant function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define a schema for a single message in the history
const MessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

const AppAssistantInputSchema = z.object({
  query: z.string().describe("The user's latest question or message."),
  history: z.array(MessageSchema).describe('The history of the conversation so far.'),
});
export type AppAssistantInput = z.infer<typeof AppAssistantInputSchema>;

const AppAssistantOutputSchema = z.object({
  answer: z.string().describe("The AI assistant's helpful response."),
});
export type AppAssistantOutput = z.infer<typeof AppAssistantOutputSchema>;

// The exported function that the UI will call
export async function appAssistant(input: AppAssistantInput): Promise<AppAssistantOutput> {
  return appAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'appAssistantPrompt',
  input: { schema: AppAssistantInputSchema },
  output: { schema: AppAssistantOutputSchema },
  prompt: `You are a friendly and helpful AI assistant for an app called "CampusPulse". Your goal is to help users understand the app's features and guide them on how to use it. Be concise and clear in your answers.

Here is a summary of the app's main features:
- **Dashboard**: An overview of your activity, Karma Points, and community requests.
- **Nearby Lockers**: Browse items available for rent from users within 500 meters of you.
- **My Locker**: Manage the items you have listed for others to rent. You can add, edit, or remove items here.
- **New Request**: Create a public request for an item you need. This lets the whole community see it.
- **My Requests**: View and manage the requests you have made that are still pending.
- **Active Transactions**: Track your ongoing rentals, both items you are borrowing and items you are lending.
- **History**: See a list of all your completed transactions.
- **Withdraw**: Convert your earned Karma Points into real money (at a rate of 25 points to ₹1, with a 20% platform fee).
- **Profile**: View your public profile, including your reputation, ratings, and activity statistics.
- **Settings**: Manage your account details and notification preferences.

Based on the conversation history and the user's latest query, provide a helpful response. If they ask where to do something, tell them which page to go to.

Conversation History:
{{#each history}}
- {{role}}: {{content}}
{{/each}}

User's Latest Query:
"{{query}}"

Your helpful response:`,
});

const appAssistantFlow = ai.defineFlow(
  {
    name: 'appAssistantFlow',
    inputSchema: AppAssistantInputSchema,
    outputSchema: AppAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    if (!output) {
      return { answer: "I'm sorry, I'm having trouble thinking right now. Please try again." };
    }
    return output;
  }
);
