'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  MessageCircle, Send, X, Bot, User, 
  HelpCircle, ShoppingCart, Package, 
  Truck, Settings, CreditCard, MapPin,
  Clock, Shield, CheckCircle, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  isLoading?: boolean;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  query: string;
}

type UserRole = 'customer' | 'shopkeeper' | 'admin' | 'guest';

interface ChatbotProps {
  userRole?: UserRole;
  className?: string;
}

// Quick actions based on user role
const getQuickActions = (role: UserRole): QuickAction[] => {
  const commonActions = [
    {
      id: 'help',
      label: 'Get Help',
      icon: <HelpCircle className="h-4 w-4" />,
      query: 'I need help with my account'
    },
    {
      id: 'contact',
      label: 'Contact Support',
      icon: <MessageCircle className="h-4 w-4" />,
      query: 'How can I contact customer support?'
    }
  ];

  if (role === 'customer') {
    return [
      ...commonActions,
      {
        id: 'orders',
        label: 'My Orders',
        icon: <ShoppingCart className="h-4 w-4" />,
        query: 'Show me my order status'
      },
      {
        id: 'delivery',
        label: 'Delivery Info',
        icon: <Truck className="h-4 w-4" />,
        query: 'Tell me about delivery options and timing'
      },
      {
        id: 'payment',
        label: 'Payment Help',
        icon: <CreditCard className="h-4 w-4" />,
        query: 'How do I pay for my orders?'
      },
      {
        id: 'refund',
        label: 'Returns & Refunds',
        icon: <CheckCircle className="h-4 w-4" />,
        query: 'What is your return and refund policy?'
      }
    ];
  }

  if (role === 'shopkeeper') {
    return [
      ...commonActions,
      {
        id: 'products',
        label: 'Manage Products',
        icon: <Package className="h-4 w-4" />,
        query: 'How do I add or edit products?'
      },
      {
        id: 'orders',
        label: 'Order Management',
        icon: <ShoppingCart className="h-4 w-4" />,
        query: 'How do I manage customer orders?'
      },
      {
        id: 'settings',
        label: 'Shop Settings',
        icon: <Settings className="h-4 w-4" />,
        query: 'Where can I update my shop information?'
      },
      {
        id: 'analytics',
        label: 'Analytics & Reports',
        icon: <Shield className="h-4 w-4" />,
        query: 'How can I view my sales analytics?'
      }
    ];
  }

  return commonActions;
};

// Generate bot response using AI
const generateBotResponse = async (
  query: string, 
  role: UserRole, 
  chatHistory: Array<{ sender: 'user' | 'bot'; text: string }>
): Promise<string> => {
  try {
    // Prepare chat history for AI context
    const history = chatHistory
      .slice(-10) // Only send last 10 messages for context
      .map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'bot',
        message: msg.text,
      }));

    // Call the AI API
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: query,
        userRole: role,
        chatHistory: history,
      }),
    });

    const data = await response.json();

    if (data.success && data.response) {
      return data.response;
    } else {
      // Fallback response if AI fails
      return "I'm sorry, I'm having trouble understanding that right now. Could you please rephrase your question? Or use one of the quick action buttons above for specific help.";
    }
  } catch (error) {
    console.error('Error calling chat API:', error);
    // Fallback response on error
    return "I apologize, but I'm experiencing technical difficulties. Please try again in a moment, or contact our support team at support@tkmain.com for immediate assistance.";
  }
};

export function Chatbot({ userRole = 'guest', className }: ChatbotProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: `Hello! 👋 Welcome to our support chatbot. I'm here to help you with any questions about ${userRole === 'customer' || userRole === 'guest' ? 'shopping, orders, and delivery' : 'your shop management'}. How can I assist you today?`,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickActions = getQuickActions(userRole);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Get chat history for context
      const currentHistory = [...messages, userMessage];
      
      // Call AI to generate response
      const botResponse = await generateBotResponse(text, userRole, currentHistory);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: botResponse,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I encountered an error while processing your message. Please try again or contact our support team.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickAction = (query: string) => {
    handleSend(query);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend(input);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <Button
        onClick={() => setOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110",
          "bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700",
          "md:bottom-8 md:right-8",
          className
        )}
        size="icon"
        aria-label="Open chat support"
      >
        <MessageCircle className="h-6 w-6" />
        {!open && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </Button>

      {/* Chat Sheet */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[85vh] sm:h-[600px] md:h-[650px] flex flex-col p-0 w-full sm:w-full">
          <SheetHeader className="px-6 pt-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center">
                  <Bot className="h-5 w-5 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-xl">Support Chat</SheetTitle>
                  <SheetDescription className="text-sm mt-1">
                    {isTyping ? 'Typing...' : 'We\'re here to help'}
                  </SheetDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Online
              </Badge>
            </div>
          </SheetHeader>

          {/* Quick Actions */}
          {quickActions.length > 0 && (
            <div className="px-6 py-4 border-b bg-slate-50 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">Quick Actions:</p>
              <div className="flex flex-wrap gap-2">
                {quickActions.map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action.query)}
                    className="text-xs h-8"
                    disabled={isTyping}
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Messages Area */}
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-4 sm:px-6 py-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    "flex gap-3",
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.sender === 'bot' && (
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-4 w-4 text-white" />
                    </div>
                  )}
                  <Card
                    className={cn(
                      "max-w-[85%] sm:max-w-[70%] p-4 shadow-sm",
                      message.sender === 'user'
                        ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-sm"
                        : "bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm"
                    )}
                  >
                    <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                      {message.text}
                    </div>
                    <div className={cn(
                      "text-xs mt-2 opacity-70",
                      message.sender === 'user' ? 'text-right' : 'text-left'
                    )}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </Card>
                  {message.sender === 'user' && (
                    <div className="h-8 w-8 rounded-full bg-slate-300 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-slate-600 dark:text-slate-300" />
                    </div>
                  )}
                </div>
              ))}
              
              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 rounded-full bg-gradient-to-r from-primary to-blue-600 flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-white" />
                  </div>
                  <Card className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-sm p-4">
                    <div className="flex gap-1">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-slate-600 dark:text-slate-400">Typing...</span>
                    </div>
                  </Card>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-4 border-t bg-slate-50 dark:bg-slate-900">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 text-sm sm:text-base"
                disabled={isTyping}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                autoFocus={open}
              />
              <Button
                type="submit"
                disabled={!input.trim() || isTyping}
                className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-700 shrink-0"
                size="icon"
              >
                {isTyping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center hidden sm:block">
              Press Enter to send, Shift+Enter for new line
            </p>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
