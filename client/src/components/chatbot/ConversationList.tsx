import { useEffect, useState } from 'react';
import { MessageSquare, Plus, Edit2, Trash2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Conversation } from '@shared/schema';

interface ConversationListProps {
  activeConversationId?: number;
  onSelectConversation: (conversationId: number) => void;
  onNewConversation: () => void;
}

export default function ConversationList({ 
  activeConversationId, 
  onSelectConversation,
  onNewConversation
}: ConversationListProps) {
  const [editingConversation, setEditingConversation] = useState<number | null>(null);
  const [editedTitle, setEditedTitle] = useState('');
  const [deletingConversation, setDeletingConversation] = useState<number | null>(null);

  // Fetch conversations
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
  });

  // Update conversation title mutation
  const updateTitleMutation = useMutation({
    mutationFn: async ({ id, title }: { id: number; title: string }) => {
      const response = await apiRequest('PATCH', `/api/conversations/${id}/title`, { title });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      setEditingConversation(null);
      setEditedTitle('');
    },
  });

  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/conversations/${id}`);
      return id; // Return the deleted ID
    },
    onSuccess: (deletedId) => {
      // Optimistically update the cache by removing the deleted conversation
      queryClient.setQueryData(['/api/conversations'], (oldData: Conversation[] | undefined) => {
        if (!oldData) return [];
        return oldData.filter(conv => conv.id !== deletedId);
      });
      
      // Also invalidate to ensure fresh data on next fetch
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      
      // If we're deleting the active conversation, reset to no conversation
      if (deletedId === activeConversationId) {
        onSelectConversation(0);
      }
      setDeletingConversation(null);
    },
    onError: (error) => {
      console.error('Failed to delete conversation:', error);
      setDeletingConversation(null);
    },
  });

  // Handle title edit
  const handleEditStart = (conversation: Conversation) => {
    setEditingConversation(conversation.id);
    setEditedTitle(conversation.title);
  };

  const handleTitleSave = (id: number) => {
    if (editedTitle.trim()) {
      updateTitleMutation.mutate({ id, title: editedTitle.trim() });
    }
  };

  // Auto-focus input when editing starts
  useEffect(() => {
    if (editingConversation) {
      const inputElement = document.getElementById(`edit-title-${editingConversation}`);
      if (inputElement) {
        inputElement.focus();
      }
    }
  }, [editingConversation]);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-neutral-200">
        <Button 
          variant="outline" 
          className="w-full flex justify-center items-center gap-2"
          onClick={onNewConversation}
        >
          <Plus className="h-4 w-4" />
          New Conversation
        </Button>
      </div>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {conversations.length === 0 ? (
            <div className="text-center py-8 text-neutral-500 text-sm">
              No conversation history
            </div>
          ) : (
            conversations.map((conversation) => (
              <div 
                key={conversation.id}
                className={`group flex items-center py-2 px-3 rounded-lg cursor-pointer transition
                  ${activeConversationId === conversation.id 
                    ? 'bg-primary-50 text-primary-700' 
                    : 'hover:bg-neutral-100 text-neutral-700'}`}
                onClick={() => conversation.id !== editingConversation && onSelectConversation(conversation.id)}
              >
                <div className="flex-shrink-0 mr-3">
                  <MessageSquare className={`h-5 w-5 ${activeConversationId === conversation.id ? 'text-primary-600' : 'text-neutral-500'}`} />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  {editingConversation === conversation.id ? (
                    <div className="flex items-center gap-2">
                      <Input
                        id={`edit-title-${conversation.id}`}
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleTitleSave(conversation.id)}
                        onBlur={() => handleTitleSave(conversation.id)}
                        className="h-7 text-sm py-1"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{conversation.title}</span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          className="text-neutral-400 hover:text-neutral-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditStart(conversation);
                          }}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button 
                          className="text-red-400 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingConversation(conversation.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-neutral-500 truncate">
                    {new Date(conversation.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <AlertDialog open={deletingConversation !== null} onOpenChange={() => setDeletingConversation(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this conversation? This action cannot be undone and all messages will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deletingConversation) {
                  deleteConversationMutation.mutate(deletingConversation);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}