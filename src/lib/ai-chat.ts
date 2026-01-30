/**
 * Simple AI Chat Implementation
 * Uses Google Gemini API directly for better reliability
 */

const GOOGLE_AI_API_KEY = process.env.GOOGLE_GENAI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_GENAI_API_KEY;
const N8N_AGENT_WEBHOOK_URL = process.env.N8N_AGENT_WEBHOOK_URL;
const N8N_AGENT_WEBHOOK_SECRET = process.env.N8N_AGENT_WEBHOOK_SECRET;
// Use gemini-1.5-flash for better compatibility and reliability
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface ChatHistory {
  role: 'user' | 'bot';
  message: string;
}

/**
 * Generate AI response using Google Gemini API directly
 */
export async function generateAIChatResponse(
  message: string,
  userRole: 'customer' | 'shopkeeper' | 'admin' | 'guest',
  chatHistory: ChatHistory[] = []
): Promise<string> {
  // Try n8n agent first if configured
  const agentResponse = await callN8nAgent(message, userRole, chatHistory);
  if (agentResponse) {
    return agentResponse;
  }

  // If no API key, use intelligent fallback responses
  if (!GOOGLE_AI_API_KEY) {
    console.warn('GOOGLE_GENAI_API_KEY not set, using fallback responses');
    return generateFallbackResponse(message, userRole);
  }

  try {
    // Format conversation history
    const conversation: ChatMessage[] = [];

    // Add system context based on role
    const systemContext = getSystemContext(userRole);
    conversation.push({
      role: 'model',
      parts: [{ text: systemContext }],
    });

    // Add chat history (last 10 messages)
    const recentHistory = chatHistory.slice(-10);
    for (const msg of recentHistory) {
      conversation.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.message }],
      });
    }

    // Add current user message
    conversation.push({
      role: 'user',
      parts: [{ text: message }],
    });

    // Call Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GOOGLE_AI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: conversation,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
          stopSequences: [],
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      return generateFallbackResponse(message, userRole);
    }

    const data = await response.json();
    
    if (data.candidates && data.candidates[0] && data.candidates[0].content) {
      const text = data.candidates[0].content.parts?.[0]?.text;
      if (text) {
        return text.trim();
      }
    }

    // If no valid response, use fallback
    console.warn('No valid response from Gemini API, using fallback');
    return generateFallbackResponse(message, userRole);
  } catch (error) {
    console.error('AI chat error:', error);
    return generateFallbackResponse(message, userRole);
  }
}

/**
 * Send conversation to external n8n agent workflow if configured.
 */
async function callN8nAgent(
  message: string,
  userRole: 'customer' | 'shopkeeper' | 'admin' | 'guest',
  chatHistory: ChatHistory[]
): Promise<string | null> {
  if (!N8N_AGENT_WEBHOOK_URL) {
    return null;
  }

  try {
    const response = await fetch(N8N_AGENT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(N8N_AGENT_WEBHOOK_SECRET ? { 'x-shared-secret': N8N_AGENT_WEBHOOK_SECRET } : {}),
      },
      body: JSON.stringify({
        message,
        userRole,
        chatHistory,
        metadata: {
          source: 'tk-main',
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      console.error('n8n agent webhook error:', await response.text());
      return null;
    }

    const data = await response.json().catch(() => null);
    if (!data) {
      return null;
    }

    const agentResponse =
      (typeof data.response === 'string' && data.response.trim()) ||
      (typeof data.answer === 'string' && data.answer.trim()) ||
      (typeof data.text === 'string' && data.text.trim()) ||
      (typeof data.result === 'string' && data.result.trim()) ||
      (typeof data.ai_output === 'string' && data.ai_output.trim()) ||
      (typeof data.data?.response === 'string' && data.data.response.trim());

    return agentResponse ? agentResponse : null;
  } catch (error) {
    console.error('Failed to reach n8n agent webhook:', error);
    return null;
  }
}

/**
 * Get system context based on user role
 */
function getSystemContext(role: 'customer' | 'shopkeeper' | 'admin' | 'guest'): string {
  const baseContext = `You are a helpful and friendly AI support assistant for an e-commerce platform that connects customers with local shops (grocery stores, pharmacies, restaurants, bakeries, dairy shops).

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

INSTRUCTIONS:
1. Analyze the user's message and understand their intent
2. Provide helpful, accurate, and friendly responses
3. Be specific and actionable - guide users to the right place in the platform
4. If the question is about platform features, explain how to access them
5. Keep responses concise but informative
6. Use emojis sparingly and appropriately
7. Always be professional and courteous

Current User Role: ${role}`;

  return baseContext;
}

/**
 * Intelligent fallback responses when AI API is not available
 */
function generateFallbackResponse(
  message: string,
  role: 'customer' | 'shopkeeper' | 'admin' | 'guest'
): string {
  const lowerMessage = message.toLowerCase().trim();

  // Customer-specific responses
  if (role === 'customer' || role === 'guest') {
    if (lowerMessage.includes('order') && (lowerMessage.includes('status') || lowerMessage.includes('track'))) {
      return "To check your order status, please visit the 'My Orders' section in your dashboard. You can track real-time updates on order processing, preparation, and delivery. For detailed tracking, your order confirmation email contains a tracking link.";
    }
    if (lowerMessage.includes('delivery') || lowerMessage.includes('shipping')) {
      return "We offer fast and reliable delivery options:\n\n• Standard Delivery: 2-3 business days (Free on orders above ₹500)\n• Express Delivery: Same day or next day (₹50-100 fee)\n• Scheduled Delivery: Choose your preferred delivery time\n\nDelivery times depend on your location and shop availability. You can track your delivery in real-time through your order dashboard.";
    }
    if (lowerMessage.includes('payment') || lowerMessage.includes('pay') || lowerMessage.includes('cod')) {
      return "We support multiple payment methods:\n\n• Cash on Delivery (COD): Pay when your order arrives\n• UPI: Quick and secure digital payments\n• Credit/Debit Cards: Visa, Mastercard, RuPay\n• Net Banking: All major banks supported\n\nAll payments are secure and encrypted. COD is available for most locations.";
    }
    if (lowerMessage.includes('refund') || lowerMessage.includes('return') || lowerMessage.includes('cancel')) {
      return "Our return and refund policy:\n\n• Returns accepted within 7 days of delivery\n• Full refund for damaged or incorrect items\n• Partial refund for opened but unused items\n• Cancellation allowed before order preparation starts\n\nTo initiate a return, go to 'My Orders' → Select order → 'Request Return'. Our team will process your refund within 3-5 business days.";
    }
    if (lowerMessage.includes('account') || lowerMessage.includes('profile')) {
      return "To manage your account:\n\n• Update profile: Go to Dashboard → Profile Settings\n• Change password: Settings → Security\n• Update address: Settings → Delivery Addresses\n• View order history: Dashboard → My Orders\n\nYou can also update your preferences, notification settings, and saved payment methods from your account settings.";
    }
  }

  // Shopkeeper-specific responses
  if (role === 'shopkeeper') {
    if (lowerMessage.includes('product') && (lowerMessage.includes('add') || lowerMessage.includes('manage'))) {
      return "To manage products:\n\n• Add Product: Dashboard → Products → 'Add Product'\n• Edit Product: Products → Click on product → Edit\n• Update Stock: Products → Select product → Update Quantity\n• Set Prices: Edit product → Update price and unit\n• Expiry Dates: Add expiry dates for perishable items\n\nYou can also bulk import products, set discounts, and manage categories from the Products section.";
    }
    if (lowerMessage.includes('order') && role === 'shopkeeper') {
      return "To manage customer orders:\n\n• View Orders: Dashboard → Orders section\n• Accept/Reject: Click on order → Accept or Reject\n• Update Status: Pending → Preparing → Ready → Out for Delivery\n• Add Notes: Include preparation time or special instructions\n• Print Invoice: Generate invoices for each order\n\nYou'll receive notifications for new orders. Orders must be accepted within 15 minutes or they auto-cancel.";
    }
    if (lowerMessage.includes('setting') || lowerMessage.includes('shop information')) {
      return "To update shop settings:\n\n• Shop Details: Dashboard → Shop Settings → Edit\n• Business Hours: Set your operating hours\n• Delivery Areas: Manage delivery locations and fees\n• Payment Methods: Choose accepted payment options\n• Shop Status: Update open/closed status\n• Documents: Upload or update business licenses\n\nAll changes are reviewed by admin before going live.";
    }
    if (lowerMessage.includes('analytics') || lowerMessage.includes('report') || lowerMessage.includes('sales')) {
      return "View your analytics and reports:\n\n• Sales Dashboard: Dashboard → Analytics\n• Revenue Reports: View daily, weekly, monthly sales\n• Product Performance: Best sellers and stock levels\n• Customer Insights: Popular products and trends\n• Order Statistics: Order volume and completion rates\n\nYou can export reports, set up alerts for low stock, and track your shop's growth metrics.";
    }
  }

  // General responses
  if (lowerMessage.includes('contact') || lowerMessage.includes('support') || lowerMessage.includes('help')) {
    return "Our support team is here to help you! 📞\n\n• Email: support@tkmain.com\n• Phone: 1800-XXX-XXXX (Toll-free)\n• Live Chat: Available 24/7 (you're using it now!)\n• Response Time: Usually within 1-2 hours\n\nYou can also visit our Help Center for FAQs, tutorials, and guides. Is there something specific I can help you with?";
  }

  // Default response
  const helpTopics = role === 'customer' || role === 'guest'
    ? "• Order tracking and status\n• Delivery information\n• Payment methods\n• Returns and refunds\n• Account management"
    : "• Product management\n• Order processing\n• Shop settings\n• Analytics and reports\n• Account support";

  return `I understand you're asking about "${message}". I'm here to help! I can assist you with:\n\n${helpTopics}\n\nCould you please provide more details about what you need help with? Or try rephrasing your question for a more specific answer.`;
}

