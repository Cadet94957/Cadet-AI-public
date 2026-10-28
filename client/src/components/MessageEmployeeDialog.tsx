import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, CheckCircle, AlertCircle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface MessageEmployeeDialogProps {
  employee: {
    id: number;
    displayName: string;
    email: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  managerName: string;
}

export function MessageEmployeeDialog({ employee, isOpen, onClose, managerName }: MessageEmployeeDialogProps) {
  const [message, setMessage] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messagingStatus } = useQuery({
    queryKey: ['messaging-status'],
    queryFn: async () => {
      const res = await fetch('/api/messaging/status');
      if (!res.ok) throw new Error('Failed to fetch messaging status');
      return res.json();
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const response = await apiRequest('POST', '/api/messaging/send', messageData);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Message sent successfully!",
        description: `Message delivered via ${data.platform === 'slack' ? 'Slack' : 'Microsoft Teams'}`,
      });
      setMessage('');
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Please check your messaging integration settings",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = () => {
    if (!employee || !message.trim()) return;

    sendMessageMutation.mutate({
      employeeId: employee.id,
      employeeName: employee.displayName,
      employeeEmail: employee.email,
      message: message.trim(),
      managerName: managerName,
    });
  };

  const isMessagingAvailable = messagingStatus?.slack?.connected || messagingStatus?.teams?.connected;
  const availablePlatform = messagingStatus?.slack?.connected ? 'Slack' : 
                           messagingStatus?.teams?.connected ? 'Microsoft Teams' : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Send Message to {employee?.displayName}
          </DialogTitle>
          <DialogDescription>
            Send a direct message to this employee through your connected messaging platform.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Platform Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm font-medium">Platform:</span>
            {isMessagingAvailable ? (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {availablePlatform}
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-red-100 text-red-800">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not configured
                </Badge>
              </div>
            )}
          </div>

          {/* Employee Info */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-sm">
              <span className="font-medium">To:</span> {employee?.displayName}
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-medium">Email:</span> {employee?.email}
            </div>
          </div>

          {/* Message Input */}
          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              Message
            </label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[100px]"
              disabled={!isMessagingAvailable}
            />
            <div className="text-xs text-gray-500">
              {message.length}/500 characters
            </div>
          </div>

          {!isMessagingAvailable && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
              <p className="text-sm text-yellow-700">
                No messaging platforms are configured. Please set up Slack or Microsoft Teams in Settings to send messages.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendMessage}
            disabled={!message.trim() || !isMessagingAvailable || sendMessageMutation.isPending}
          >
            {sendMessageMutation.isPending ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}