import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/lib/authContext";
import { Loader2, X } from "lucide-react";

// Single-tenant default. The backend falls back to local storage for any
// orgId that isn't registered in the multi-tenant Supabase registry.
export const DEFAULT_ORG_ID = "00000000-0000-0000-0000-000000000000";

type SuggestedAction = {
  id: string;
  label: string;
  actionType: "create_task" | "open_link" | "file_ticket" | "assign_buddy" | "schedule_checkin";
  actionPayload: Record<string, any>;
};

type Citation = {
  docId: string;
  title: string;
  snippet: string;
  url?: string | null;
  score?: number | null;
};

type AskResponse = {
  answer: string;
  plan?: string | null;
  citations: Citation[];
  suggestedActions: SuggestedAction[];
  needsEscalation: boolean;
};

export type ChatMessage =
  | { role: "user"; text: string }
  | { role: "assistant"; text: string; plan?: string | null; citations?: Citation[]; actions?: SuggestedAction[] };

export function ChatWidget(props: {
  orgId?: string;
  userEmail?: string;
  page?: string;
  /** Render as a floating panel (used during onboarding steps). */
  isOnboarding?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
  initialMessages?: ChatMessage[];
  onFirstMessage?: (question: string, answer: string) => void;
  onMessagesChange?: (messages: ChatMessage[]) => void;
  /** Persist each exchanged message (e.g. to the conversations API). */
  onMessageSent?: (message: ChatMessage) => void;
}) {
  const { user } = useAuth();
  const orgId = props.orgId ?? DEFAULT_ORG_ID;
  const userEmail = props.userEmail ?? user?.email ?? "guest@cadet.local";

  const [messages, setMessages] = useState<ChatMessage[]>(props.initialMessages ?? []);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [hasNotifiedFirst, setHasNotifiedFirst] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    props.onMessagesChange?.(messages);
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Toggles
  const [showPlanning, setShowPlanning] = useState(false);

  // Always use human approval mode - actions require explicit user approval
  const humanApproval = true;
  const actionMode = "approval";

  const canSend = input.trim().length > 0 && !isThinking;

  async function ask(question: string) {
    const res = await fetch("/api/help-center/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orgId,
        userEmail,
        page: props.page,
        question,
        actionMode,
        debug: { includePlan: showPlanning },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error ?? "Failed to ask help center");
    }
    return (await res.json()) as AskResponse;
  }

  async function approveAction(a: SuggestedAction) {
    const res = await fetch("/api/help-center/action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orgId,
        userEmail,
        actionType: a.actionType,
        actionPayload: a.actionPayload,
      }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error ?? "Failed to execute action");
    }
    return await res.json();
  }

  async function sendMessage() {
    const q = input.trim();
    if (!q || isThinking) return;
    setInput("");
    const userMessage: ChatMessage = { role: "user", text: q };
    setMessages((prev) => [...prev, userMessage]);
    props.onMessageSent?.(userMessage);
    setIsThinking(true);
    try {
      const out = await ask(q);
      const assistantMessage: ChatMessage = {
        role: "assistant",
        text: out.answer,
        plan: out.plan ?? null,
        citations: out.citations ?? [],
        actions: out.suggestedActions ?? [],
      };
      setMessages((prev) => [...prev, assistantMessage]);
      props.onMessageSent?.(assistantMessage);
      if (!hasNotifiedFirst && props.onFirstMessage) {
        setHasNotifiedFirst(true);
        props.onFirstMessage(q, out.answer);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: err?.message ?? "Sorry — something went wrong." },
      ]);
    } finally {
      setIsThinking(false);
    }
  }

  const lastAssistant = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return messages[i] as any;
    }
    return null;
  }, [messages]);

  if (props.isOnboarding && props.isOpen === false) return null;

  const containerClass = props.isOnboarding
    ? "fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-3rem)] rounded-2xl border bg-white shadow-xl"
    : "w-full max-w-2xl rounded-2xl border bg-white shadow-sm";

  return (
    <div className={containerClass}>
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="font-semibold">AI Assistant</div>

        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <Checkbox checked={showPlanning} onCheckedChange={(v) => setShowPlanning(Boolean(v))} />
            Show planning
          </label>
          {props.onClose ? (
            <button
              onClick={props.onClose}
              className="rounded-full p-1 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              aria-label="Close assistant"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      <div ref={scrollRef} className={(props.isOnboarding ? "max-h-[380px]" : "max-h-[520px]") + " overflow-auto px-4 py-3"}>
        {messages.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            Ask anything about policies, benefits, tooling, processes — and Cadet can also propose actions like creating
            tasks or filing tickets.
          </div>
        ) : null}

        <div className="space-y-4">
          {messages.map((m, idx) => (
            <div key={idx} className={m.role === "user" ? "text-right" : "text-left"}>
              <div
                className={
                  "inline-block max-w-[90%] rounded-2xl px-3 py-2 text-sm " +
                  (m.role === "user" ? "bg-black text-white" : "bg-gray-100 text-gray-900")
                }
              >
                {m.text}
              </div>

              {"plan" in m && m.plan && showPlanning ? (
                <div className="mt-2 rounded-xl border bg-white p-3 text-xs text-gray-700">
                  <div className="mb-1 font-semibold">Planning</div>
                  <pre className="whitespace-pre-wrap">{m.plan}</pre>
                </div>
              ) : null}

              {"citations" in m && m.citations && m.citations.length > 0 ? (
                <div className="mt-2 rounded-xl border bg-white p-3 text-xs">
                  <div className="mb-2 font-semibold">Sources</div>
                  <ul className="space-y-2">
                    {m.citations.slice(0, 4).map((c, i) => (
                      <li key={i}>
                        {c.url ? (
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-blue-600 hover:underline"
                          >
                            {c.title}
                          </a>
                        ) : (
                          <div className="font-medium">{c.title}</div>
                        )}
                        <div className="text-muted-foreground">{c.snippet}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {"actions" in m && m.actions && m.actions.length > 0 ? (
                <div className="mt-2 rounded-xl border bg-white p-3 text-xs">
                  <div className="mb-2 font-semibold">Suggested actions</div>
                  <div className="space-y-2">
                    {m.actions.map((a) => (
                      <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                        <div className="text-sm">{a.label}</div>
                        <div className="flex items-center gap-2">
                          {humanApproval ? (
                            <>
                              <Button
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const result = await approveAction(a);
                                    // Links open immediately; other actions just confirm.
                                    if (result?.kind === "link" && result?.url) {
                                      window.open(result.url, "_blank");
                                    }
                                    setMessages((prev) =>
                                      prev.map((pm) => {
                                        if (pm.role !== "assistant") return pm;
                                        if (pm !== m) return pm;
                                        return {
                                          ...pm,
                                          actions: (pm.actions ?? []).filter((x: any) => x.id !== a.id),
                                        };
                                      }),
                                    );
                                  } catch (e: any) {
                                    alert(e?.message ?? "Failed to approve action");
                                  }
                                }}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => {
                                  // Deny = just remove from UI
                                  setMessages((prev) =>
                                    prev.map((pm) => {
                                      if (pm.role !== "assistant") return pm;
                                      if (pm !== m) return pm;
                                      return {
                                        ...pm,
                                        actions: (pm.actions ?? []).filter((x: any) => x.id !== a.id),
                                      };
                                    }),
                                  );
                                }}
                              >
                                Dismiss
                              </Button>
                            </>
                          ) : (
                            <div className="text-muted-foreground">Auto mode</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}

          {isThinking ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cadet is thinking…
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex gap-2 border-t p-3">
        <input
          className="flex-1 rounded-xl border px-3 py-2 text-sm"
          placeholder="Ask Cadet…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && canSend) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <Button disabled={!canSend} onClick={sendMessage}>
          Send
        </Button>
      </div>

      {lastAssistant?.needsEscalation ? (
        <div className="border-t bg-yellow-50 px-4 py-3 text-sm">
          Cadet thinks this may need escalation. Consider filing a ticket or asking your manager/HR.
        </div>
      ) : null}
    </div>
  );
}
