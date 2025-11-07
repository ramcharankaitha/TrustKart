'use server';

/**
 * @fileOverview AI Chat Assistant for customer and shopkeeper support
 * 
 * - chatAssistant - An AI function that generates intelligent responses to user queries
 * - Context-aware responses based on user role and chat history
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ChatInputSchema = z.object({
  message: z.string().describe('The user\'s message or question'),
  userRole: z.enum(['customer', 'shopkeeper', 'admin', 'guest']).describe('The role of the user'),
  chatHistory: z.union([
    z.string(),
    z.array(z.object({
      role: z.enum(['user', 'bot']),
      message: z.string(),
    }))
  ]).optional().describe('Previous messages in the conversation for context'),
});

export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  response: z.string().describe('The AI assistant\'s response to the user\'s message'),
  confidence: z.enum(['high', 'medium', 'low']).optional().describe('Confidence level of the response'),
});

export type ChatOutput = z.infer<typeof ChatOutputSchema>;

const chatPrompt = ai.definePrompt({
  name: 'chatAssistantPrompt',
  input: { schema: ChatInputSchema },
  output: { schema: ChatOutputSchema },
  prompt: `You are a helpful and friendly AI support assistant for an e-commerce platform that connects customers with local shops (grocery stores, pharmacies, restaurants, bakeries, dairy shops).

USER CONTEXT:
- User Role: {{{userRole}}}
- Platform: Local shop marketplace for groceries, medicines, food, and daily essentials

PLATFORM INFORMATION:

For Customers/Guest Users:
- Order Tracking: Customers can track orders in the "My Orders" section
- Delivery Options: Standard (2-3 days), Express (same/next day), Scheduled delivery
- Payment Methods: Cash on Delivery (COD), UPI, Credit/Debit Cards, Net Banking
- Returns: 7-day return policy, full refund for damaged items
- Support: support@tkmain.com, Phone: 1800-XXX-XXXX, Live chat available 24/7

For Shopkeepers:
- Product Management: Add/edit products in Dashboard → Products section
- Order Management: View, accept/reject, update order status in Dashboard → Orders
- Shop Settings: Update shop info, business hours, delivery areas in Dashboard → Settings
- Analytics: View sales reports, product performance, customer insights in Dashboard → Analytics
- Order Processing: Orders must be accepted within 15 minutes or auto-cancel

CHAT HISTORY (for context):
{{{chatHistory}}}

CURRENT USER MESSAGE:
{{{message}}}

INSTRUCTIONS:
1. Analyze the user's message and understand their intent
2. Provide helpful, accurate, and friendly responses
3. Be specific and actionable - guide users to the right place in the platform
4. If the question is about platform features, explain how to access them
5. For customers: Focus on shopping, orders, delivery, payments, returns
6. For shopkeepers: Focus on product management, orders, shop settings, analytics
7. If unsure, ask clarifying questions or direct them to support
8. Keep responses concise but informative
9. Use emojis sparingly and appropriately
10. Always be professional and courteous

Generate a helpful response that addresses the user's query.`,
});

const chatAssistantFlow = ai.defineFlow(
  {
    name: 'chatAssistantFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async input => {
    try {
      // Format chat history for prompt
      let historyText = 'No previous conversation history.';
      if (input.chatHistory) {
        if (Array.isArray(input.chatHistory)) {
          historyText = input.chatHistory.length > 0
            ? input.chatHistory.map(msg => `- ${msg.role}: ${msg.message}`).join('\n')
            : 'No previous conversation history.';
        } else if (typeof input.chatHistory === 'string') {
          historyText = input.chatHistory;
        }
      }

      const promptInput = {
        message: input.message,
        userRole: input.userRole,
        chatHistory: historyText,
      };

      const { output } = await chatPrompt(promptInput);
      return {
        response: output?.response || "I'm sorry, I'm having trouble processing that. Could you please rephrase your question?",
        confidence: output?.confidence || 'medium',
      };
    } catch (error) {
      console.error('Chat AI error:', error);
      return {
        response: "I apologize, but I'm experiencing technical difficulties. Please try again in a moment, or contact our support team at support@tkmain.com for immediate assistance.",
        confidence: 'low',
      };
    }
  }
);

export async function chatAssistant(input: ChatInput): Promise<ChatOutput> {
  return chatAssistantFlow(input);
}

