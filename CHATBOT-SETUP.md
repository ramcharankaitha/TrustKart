# AI Chatbot Setup Guide - Gemini Integration

This guide explains how to set up and use the AI-powered chatbot integrated with Google Gemini for customer support.

## Features

- ✅ **AI-Powered Responses**: Uses Google Gemini 1.5 Flash for intelligent, context-aware responses
- ✅ **Role-Based Context**: Adapts responses based on user role (customer, shopkeeper, admin, guest)
- ✅ **Conversation History**: Maintains context across conversation turns
- ✅ **Quick Actions**: Pre-defined quick action buttons for common queries
- ✅ **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- ✅ **Real-time Typing Indicators**: Shows when the bot is processing responses
- ✅ **Fallback Responses**: Intelligent fallback when API is unavailable
- ✅ **Safety Settings**: Built-in content filtering and safety measures

## Setup Instructions

### Step 1: Get Google Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### Step 2: Add API Key to Environment Variables

Add the following to your `.env.local` file:

```env
# Google Gemini API Key
GOOGLE_GENAI_API_KEY=your_api_key_here

# Or use NEXT_PUBLIC prefix if you need it in the browser (not recommended for production)
NEXT_PUBLIC_GOOGLE_GENAI_API_KEY=your_api_key_here
```

**Important Security Note:**
- For production, use `GOOGLE_GENAI_API_KEY` (server-side only)
- Never expose your API key in client-side code
- The API key is used server-side in the `/api/chat` route

### Step 3: (Optional) Connect an n8n Agent

If you want the chatbot to use your n8n LangChain workflow instead of talking to Gemini directly:

1. In n8n, copy the public webhook URL of your AI Agent workflow (from the **When chat message received** trigger).
2. Add the following variables to `.env.local`:

```env
N8N_AGENT_WEBHOOK_URL=https://your-n8n-host/webhook/ai-agent
N8N_AGENT_WEBHOOK_SECRET=optional-shared-secret
```

3. (Optional) Configure the workflow to expect `message`, `userRole`, `chatHistory`, and return `{ "response": "text" }`.
4. When the vars are set, the Next.js API posts every chat turn to n8n first and falls back to Gemini only if the webhook fails.

### Step 4: Restart Your Development Server

After adding the environment variable, restart your Next.js development server:

```bash
npm run dev
```

## How It Works

### Architecture

1. **Frontend Component** (`src/components/chatbot.tsx`)
   - Floating chat button (bottom-right corner)
   - Chat interface with message history
   - Quick action buttons
   - Real-time typing indicators

2. **API Route** (`src/app/api/chat/route.ts`)
   - Validates user input
   - Processes chat history
   - Calls AI service

3. **AI Service** (`src/lib/ai-chat.ts`)
   - Integrates with Google Gemini API
   - Provides role-based system context
   - Handles errors gracefully with fallback responses

### Conversation Flow

1. User sends a message
2. Message is sent to `/api/chat` endpoint
3. API formats conversation history and system context
4. Gemini API generates response
5. Response is displayed to user
6. Conversation history is maintained for context

## Customization

### System Context

The chatbot uses role-based system context. You can customize it in `src/lib/ai-chat.ts`:

```typescript
function getSystemContext(role: 'customer' | 'shopkeeper' | 'admin' | 'guest'): string {
  // Customize the system prompt here
  return `You are a helpful assistant for...`;
}
```

### Quick Actions

Add or modify quick actions in `src/components/chatbot.tsx`:

```typescript
const getQuickActions = (role: UserRole): QuickAction[] => {
  // Add your custom quick actions here
  return [
    {
      id: 'custom',
      label: 'Custom Action',
      icon: <YourIcon />,
      query: 'Your query text'
    }
  ];
};
```

### Model Configuration

You can change the Gemini model in `src/lib/ai-chat.ts`:

```typescript
// Current: gemini-1.5-flash (fast and efficient)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// Alternative: gemini-1.5-pro (more capable, slower)
// const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent';
```

## API Configuration

### Generation Settings

Current settings in `src/lib/ai-chat.ts`:

- **Temperature**: 0.7 (balanced creativity)
- **TopK**: 40 (diversity)
- **TopP**: 0.95 (nucleus sampling)
- **Max Output Tokens**: 2048 (response length)

### Safety Settings

The chatbot includes safety filters for:
- Harassment
- Hate speech
- Sexually explicit content
- Dangerous content

All set to `BLOCK_MEDIUM_AND_ABOVE` threshold.

## Usage

### For Customers

The chatbot appears as a floating button in the bottom-right corner. Click it to:
- Ask questions about orders
- Get delivery information
- Learn about payment methods
- Request support
- Get help with returns/refunds

### For Shopkeepers

The chatbot provides help with:
- Product management
- Order processing
- Shop settings
- Analytics and reports

### Quick Actions

Users can click quick action buttons for instant answers to common questions:
- **Get Help**: General assistance
- **Contact Support**: Support contact information
- **My Orders**: Order status and tracking
- **Delivery Info**: Delivery options and timing
- **Payment Help**: Payment methods
- **Returns & Refunds**: Return policy

## Fallback Behavior

If the Gemini API is unavailable or the API key is not set, the chatbot uses intelligent fallback responses based on:
- User role
- Message keywords
- Common query patterns

This ensures the chatbot always provides helpful responses, even without AI.

## Troubleshooting

### Chatbot Not Appearing

1. Check that the chatbot component is imported in `src/app/dashboard/layout.tsx`
2. Verify you're logged in (chatbot appears for all authenticated users)
3. Check browser console for errors

### API Errors

1. **"API key not set"**: Add `GOOGLE_GENAI_API_KEY` to `.env.local`
2. **"Invalid API key"**: Verify your API key is correct
3. **"Rate limit exceeded"**: You've exceeded Gemini API quotas
4. **"Model not found"**: Check the model name in the API URL

### Slow Responses

1. Check your internet connection
2. Verify API key is valid
3. Consider using `gemini-1.5-flash` (faster) instead of `gemini-1.5-pro`
4. Check Gemini API status: https://status.cloud.google.com/

### Fallback Responses Only

If you're only seeing fallback responses:
1. Check that `GOOGLE_GENAI_API_KEY` is set correctly
2. Check server logs for API errors
3. Verify your API key has access to Gemini API
4. Check API quotas and billing

## Best Practices

1. **API Key Security**
   - Never commit API keys to version control
   - Use environment variables
   - Rotate keys regularly
   - Monitor API usage

2. **Rate Limiting**
   - Implement rate limiting for production
   - Monitor API usage
   - Set up alerts for quota limits

3. **Error Handling**
   - The chatbot gracefully handles errors
   - Fallback responses ensure users always get help
   - Log errors for monitoring

4. **User Experience**
   - Keep responses concise
   - Use clear, friendly language
   - Provide actionable guidance
   - Maintain conversation context

## Cost Considerations

- **Gemini 1.5 Flash**: Free tier available, then pay-per-use
- **Pricing**: Check [Google AI Pricing](https://ai.google.dev/pricing)
- **Free Tier**: Usually includes generous free usage
- **Monitor Usage**: Track API calls in Google Cloud Console

## Support

For issues or questions:
- Check server logs for detailed error messages
- Review Gemini API documentation: https://ai.google.dev/docs
- Check Google Cloud Console for API status
- Contact support if issues persist

## Future Enhancements

Potential improvements:
- [ ] Conversation persistence (save chat history)
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Integration with order system (real-time order data)
- [ ] Sentiment analysis
- [ ] Chat history export
- [ ] Admin dashboard for chat analytics

