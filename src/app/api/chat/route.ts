import { NextRequest, NextResponse } from 'next/server';
import { generateAIChatResponse } from '@/lib/ai-chat';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userRole = 'guest', chatHistory = [] } = body;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate user role
    const validRoles = ['customer', 'shopkeeper', 'admin', 'guest'];
    if (!validRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Invalid user role' },
        { status: 400 }
      );
    }

    // Prepare chat history
    const formattedHistory = chatHistory.map((msg: any) => ({
      role: (msg.role || msg.sender) === 'user' ? 'user' : 'bot',
      message: msg.text || msg.message || '',
    }));

    // Call the AI chat response generator
    const response = await generateAIChatResponse(
      message.trim(),
      userRole as 'customer' | 'shopkeeper' | 'admin' | 'guest',
      formattedHistory
    );

    return NextResponse.json({
      success: true,
      response: response,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process chat message',
        response: "I'm sorry, I encountered an error. Please try again or contact support at support@tkmain.com.",
      },
      { status: 500 }
    );
  }
}

