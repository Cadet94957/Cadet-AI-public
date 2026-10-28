import { User, Bot } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  isUserMessage: boolean;
  content: string;
}

export default function ChatMessage({ isUserMessage, content }: ChatMessageProps) {
  return (
    <div className={`flex items-start ${isUserMessage ? 'justify-end' : ''}`}>
      {!isUserMessage && (
        <Avatar className="h-8 w-8 mr-3 flex-shrink-0">
          <AvatarFallback className="bg-primary-100">
            <Bot className="h-4 w-4 text-primary-600" />
          </AvatarFallback>
        </Avatar>
      )}
      
      <div className={`flex-1 max-w-3xl ${isUserMessage ? 'ml-auto' : ''}`}>
        <div className={`px-4 py-3 rounded-lg ${
          isUserMessage 
            ? 'bg-primary-500 text-white chat-message-user rounded-tr-none' 
            : 'bg-neutral-100 text-neutral-800 chat-message-bot rounded-tl-none'
        }`}>
          {isUserMessage ? (
            <p>{content}</p>
          ) : (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown 
                components={{
                  ul: ({ node, ...props }) => <ul className="list-disc list-inside mt-2 space-y-1" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal list-inside mt-2 space-y-1" {...props} />,
                  li: ({ node, ...props }) => <li className="text-neutral-700" {...props} />
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>
      
      {isUserMessage && (
        <Avatar className="h-8 w-8 ml-3 flex-shrink-0">
          <AvatarFallback className="bg-blue-500 text-white">
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
