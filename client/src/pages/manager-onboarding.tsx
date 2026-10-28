import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface Message {
  id: number;
  content: string;
  isUser: boolean;
  timestamp: Date;
}

export default function ManagerOnboarding() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      content: "Welcome to the manager onboarding system! I'm here to help you understand your management responsibilities, team onboarding processes, and how to effectively guide your new employees through their journey.",
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('POST', '/api/onboarding-chat', { message, role: 'manager' });
      return (await response.json()) as { response: string };
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: data.response,
        isUser: false,
        timestamp: new Date()
      }]);
    },
    onError: (error) => {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        content: "Sorry, I'm having trouble responding right now. Please try again.",
        isUser: false,
        timestamp: new Date()
      }]);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sendMessage.isPending) return;

    const newMessage: Message = {
      id: Date.now(),
      content: input,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    sendMessage.mutate(input);
    setInput('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl h-[80vh] flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto mb-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                  message.isUser
                    ? 'bg-green-600 text-white ml-4'
                    : 'bg-white text-gray-800 mr-4 shadow-sm'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me about managing team onboarding..."
              className="w-full px-6 py-4 pr-12 rounded-full border-2 border-gray-200 focus:border-green-400 focus:outline-none bg-white shadow-lg text-gray-800 placeholder-gray-500"
              disabled={sendMessage.isPending}
            />
            <button
              type="submit"
              disabled={!input.trim() || sendMessage.isPending}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-green-600 text-white rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}