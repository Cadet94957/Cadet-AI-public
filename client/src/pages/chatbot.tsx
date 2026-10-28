import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChatWidget, DEFAULT_ORG_ID, type ChatMessage } from "@/components/ChatWidget";
import { useAuth } from "@/lib/authContext";
import { queryClient } from "@/lib/queryClient";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Conversation = {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
};

type ServerMessage = {
  id: number;
  isUserMessage: boolean;
  content: string;
  createdAt: string;
};

export default function Chatbot() {
  const { user } = useAuth();
  const userEmail = user?.email ?? "guest@cadet.local";

  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [initialMessages, setInitialMessages] = useState<ChatMessage[]>([]);
  const [chatKey, setChatKey] = useState(0);
  // Serialize persistence so the assistant reply never races conversation creation.
  const persistQueue = useRef<Promise<void>>(Promise.resolve());
  const activeConvIdRef = useRef<number | null>(null);

  const conversationsKey = `/api/conversations?userEmail=${encodeURIComponent(userEmail)}`;
  const { data: conversations = [] } = useQuery<Conversation[]>({
    queryKey: [conversationsKey],
  });

  function persistMessage(message: ChatMessage) {
    persistQueue.current = persistQueue.current.then(async () => {
      try {
        let convId = activeConvIdRef.current;
        if (!convId) {
          const title = message.text.length > 40 ? message.text.slice(0, 40) + "…" : message.text;
          const res = await fetch("/api/conversations", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, userEmail }),
          });
          if (!res.ok) return;
          const conversation = (await res.json()) as Conversation;
          convId = conversation.id;
          activeConvIdRef.current = convId;
          setActiveConversationId(convId);
          queryClient.invalidateQueries({ queryKey: [conversationsKey] });
        }

        await fetch(`/api/conversations/${convId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: message.text,
            isUserMessage: message.role === "user",
            userEmail,
          }),
        });
      } catch (err) {
        console.error("Failed to persist chat message:", err);
      }
    });
  }

  function startNewConversation() {
    activeConvIdRef.current = null;
    setActiveConversationId(null);
    setInitialMessages([]);
    setChatKey((k) => k + 1);
  }

  async function selectConversation(id: number) {
    try {
      const res = await fetch(`/api/chat/messages/${id}`);
      const serverMessages = res.ok ? ((await res.json()) as ServerMessage[]) : [];
      const restored: ChatMessage[] = serverMessages.map((m) =>
        m.isUserMessage
          ? { role: "user" as const, text: m.content }
          : { role: "assistant" as const, text: m.content }
      );
      activeConvIdRef.current = id;
      setActiveConversationId(id);
      setInitialMessages(restored);
      setChatKey((k) => k + 1);
    } catch (err) {
      console.error("Failed to load conversation:", err);
    }
  }

  async function deleteConversation(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      queryClient.invalidateQueries({ queryKey: [conversationsKey] });
      if (activeConvIdRef.current === id) {
        startNewConversation();
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold">AI Assistant</h1>
      <p className="mt-2 text-muted-foreground">
        Ask anything about policies, benefits, tooling, processes — and Cadet can propose actions like creating tasks or
        filing tickets.
      </p>

      <div className="mt-6">
        <ChatWidget
          key={chatKey}
          orgId={DEFAULT_ORG_ID}
          userEmail={userEmail}
          page="assistant"
          initialMessages={initialMessages}
          onMessageSent={persistMessage}
        />
      </div>

      {/* Previous conversations */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-muted-foreground">Previous Conversations</h2>
          <Button variant="ghost" size="sm" onClick={startNewConversation} className="gap-1">
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        <div className="rounded-2xl border bg-white/60 backdrop-blur-sm p-4">
          {conversations.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-6">
              No previous conversations yet. Start chatting above!
            </div>
          ) : (
            <div className="space-y-2">
              {conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv.id)}
                  className={
                    "group flex items-start gap-3 rounded-xl p-3 cursor-pointer transition hover:bg-gray-100 " +
                    (activeConversationId === conv.id ? "bg-gray-100 ring-1 ring-black/10" : "")
                  }
                >
                  <MessageSquare className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{conv.title}</div>
                  </div>
                  <div className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(conv.updatedAt).toLocaleDateString()}
                  </div>
                  <button
                    onClick={(e) => deleteConversation(conv.id, e)}
                    className="flex-shrink-0 rounded p-1 text-gray-400 opacity-0 transition group-hover:opacity-100 hover:bg-gray-200 hover:text-red-600"
                    aria-label="Delete conversation"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
