import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function Settings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
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

  // Handle OAuth popup callbacks
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('microsoft_connected') === 'true') {
      toast({
        title: "Microsoft Teams Connected!",
        description: "You can now send messages to employees via Teams.",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh messaging status
      queryClient.invalidateQueries({ queryKey: ['messaging-status'] });
    } else if (urlParams.get('microsoft_error') === 'true') {
      toast({
        title: "Connection Failed",
        description: "Failed to connect Microsoft Teams. Please try again.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('slack_connected') === 'true') {
      toast({
        title: "Slack Connected!",
        description: "You can now send messages to employees via Slack.",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
      // Refresh messaging status
      queryClient.invalidateQueries({ queryKey: ['messaging-status'] });
    } else if (urlParams.get('slack_error') === 'true') {
      toast({
        title: "Connection Failed",
        description: "Failed to connect Slack. Please try again.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast, queryClient]);

  // Listen for popup messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'MICROSOFT_AUTH_SUCCESS') {
        toast({
          title: "Microsoft Teams Connected!",
          description: "You can now send messages to employees via Teams.",
        });
        queryClient.invalidateQueries({ queryKey: ['messaging-status'] });
      } else if (event.data.type === 'MICROSOFT_AUTH_ERROR') {
        toast({
          title: "Connection Failed",
          description: "Failed to connect Microsoft Teams. Please try again.",
          variant: "destructive",
        });
      } else if (event.data.type === 'SLACK_AUTH_SUCCESS') {
        toast({
          title: "Slack Connected!",
          description: "You can now send messages to employees via Slack.",
        });
        queryClient.invalidateQueries({ queryKey: ['messaging-status'] });
      } else if (event.data.type === 'SLACK_AUTH_ERROR') {
        toast({
          title: "Connection Failed",
          description: "Failed to connect Slack. Please try again.",
          variant: "destructive",
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [toast, queryClient]);

  const handleConnectMicrosoft = () => {
    // Open OAuth in popup window
    window.open(
      '/api/auth/microsoft',
      'microsoft-oauth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );
  };

  const handleConnectSlack = () => {
    // Open OAuth in popup window
    window.open(
      '/api/auth/slack',
      'slack-oauth',
      'width=500,height=600,scrollbars=yes,resizable=yes'
    );
  };

  return (
    <div className="p-6 space-y-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Settings</h1>
      <p className="text-neutral-600 mb-6">Customize your Cadet experience.</p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Notifications</h2>
        <label className="flex justify-between border-b py-2">
          <span>Email notifications</span>
          <input type="checkbox" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} />
        </label>
        <label className="flex justify-between border-b py-2">
          <span>SMS notifications</span>
          <input type="checkbox" checked={smsNotifications} onChange={(e) => setSmsNotifications(e.target.checked)} />
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Messaging Integrations</h2>
        <p className="text-sm text-gray-600 mb-4">Configure messaging platforms for employee communications</p>
        
        {/* Slack */}
        <div className="flex justify-between items-center border-b py-3">
          <div className="flex items-center gap-3">
            <span className="font-medium">Slack</span>
            {messagingStatus?.slack?.connected ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800">Connected</Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">Not connected</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {messagingStatus?.slack?.connected ? (
              <span className="text-sm text-green-600">✓ Ready to send messages</span>
            ) : (
              <button 
                onClick={handleConnectSlack}
                className="px-3 py-1 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
              >
                Connect Slack Account
              </button>
            )}
          </div>
        </div>

        {/* Microsoft Teams */}
        <div className="flex justify-between items-center border-b py-3">
          <div className="flex items-center gap-3">
            <span className="font-medium">Microsoft Teams</span>
            {messagingStatus?.teams?.connected ? (
              <Badge variant="secondary" className="bg-green-100 text-green-800">Connected</Badge>
            ) : (
              <Badge variant="secondary" className="bg-gray-100 text-gray-600">Not connected</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {messagingStatus?.teams?.connected ? (
              <span className="text-sm text-green-600">✓ Ready to send messages</span>
            ) : (
              <button 
                onClick={handleConnectMicrosoft}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Connect Microsoft Account
              </button>
            )}
          </div>
        </div>

        {!messagingStatus?.slack?.connected && !messagingStatus?.teams?.connected && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Setup Required:</strong> To enable employee messaging, configure at least one messaging platform with the appropriate API keys in your environment variables.
                </p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}