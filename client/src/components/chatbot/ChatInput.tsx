import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
}

export default function ChatInput({ value, onChange, onSubmit, isLoading = false }: ChatInputProps) {
  return (
    <div className="px-6 py-4 border-t border-neutral-200">
      <form className="flex items-center" onSubmit={onSubmit}>
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your question here..."
          className="flex-1 px-4 py-2 border border-neutral-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          disabled={isLoading}
        />
        <Button 
          type="submit" 
          className="px-4 py-2 bg-primary-500 text-white rounded-r-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          disabled={isLoading}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
      <p className="mt-2 text-xs text-neutral-500">
        Powered by Cadet's RAG-based system using internal educational resources.
      </p>
    </div>
  );
}
