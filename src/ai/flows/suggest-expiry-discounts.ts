'use server';

/**
 * @fileOverview An AI agent that suggests discount percentages for products nearing expiry.
 *
 * - suggestExpiryDiscounts - A function that suggests discount percentages for products nearing expiry.
 * - SuggestExpiryDiscountsInput - The input type for the suggestExpiryDiscounts function.
 * - SuggestExpiryDiscountsOutput - The return type for the suggestExpiryDiscounts function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestExpiryDiscountsInputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  daysToExpiry: z.number().describe('The number of days until the product expires.'),
  currentPrice: z.number().describe('The current price of the product.'),
  averageDailySales: z
    .number()
    .describe('The average number of units of this product sold per day.'),
  shopId: z.string().describe('The ID of the shop selling the product'),
});
export type SuggestExpiryDiscountsInput = z.infer<typeof SuggestExpiryDiscountsInputSchema>;

const SuggestExpiryDiscountsOutputSchema = z.object({
  discountPercentage: z
    .number()
    .describe(
      'The suggested discount percentage to apply to the product, to maximize sales before expiry.'
    ),
  reasoning: z
    .string()
    .describe('The AI reasoning behind the suggested discount percentage.'),
});
export type SuggestExpiryDiscountsOutput = z.infer<typeof SuggestExpiryDiscountsOutputSchema>;

export async function suggestExpiryDiscounts(
  input: SuggestExpiryDiscountsInput
): Promise<SuggestExpiryDiscountsOutput> {
  return suggestExpiryDiscountsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestExpiryDiscountsPrompt',
  input: {schema: SuggestExpiryDiscountsInputSchema},
  output: {schema: SuggestExpiryDiscountsOutputSchema},
  prompt: `You are an AI assistant helping shopkeepers to determine the optimal discount percentage for products nearing their expiry date.

  Consider the following factors when suggesting a discount percentage:
  - The number of days until the product expires.
  - The current price of the product.
  - The average daily sales of the product.
  - The shopId, which can be used to look up shop-specific configuration.

  Suggest a discount percentage that will help the shopkeeper to sell as much of the product as possible before it expires, while still maximizing profit.

  Product Name: {{{productName}}}
  Days to Expiry: {{{daysToExpiry}}}
  Current Price: {{{currentPrice}}}
  Average Daily Sales: {{{averageDailySales}}}
  Shop ID: {{{shopId}}}

  Respond with the discount percentage and a brief explanation of your reasoning.
  `,
});

const suggestExpiryDiscountsFlow = ai.defineFlow(
  {
    name: 'suggestExpiryDiscountsFlow',
    inputSchema: SuggestExpiryDiscountsInputSchema,
    outputSchema: SuggestExpiryDiscountsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
