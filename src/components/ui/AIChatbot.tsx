"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAppStore } from "@/lib/store";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions?: string[];
  timestamp: number;
}

interface AIChatbotProps {
  onNavigateSOS: () => void;
  onNavigateDoctors: () => void;
  onNavigatePharmacy: () => void;
}

const QUICK_PROMPTS = [
  { label: "🩺 Find a doctor", prompt: "I need to find a doctor near me" },
  { label: "🆘 Emergency help", prompt: "I need emergency medical help right now" },
  { label: "💊 Find pharmacy", prompt: "Where is the nearest pharmacy?" },
  { label: "🤒 Fever advice", prompt: "I have a fever, what should I do?" },
];

export default function AIChatbot({ onNavigateSOS, onNavigateDoctors, onNavigatePharmacy }: AIChatbotProps) {
  const { user, currentLocation } = useAppStore();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  // Add welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: `Hi${user?.name ? ` ${user.name.split(" ")[0]}` : ""}! 👋 I'm MediBot, your health assistant. I can help you with general health questions, find nearby doctors or pharmacies, or guide you through an emergency. How can I help?`,
          timestamp: Date.now(),
        },
      ]);
    }
  }, [open, messages.length, user?.name]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || loading) return;

      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "user",
        content: text.trim(),
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        // Build conversation history (last 10 messages for context)
        const history = [...messages, userMsg].slice(-10).map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history,
            userLocation: currentLocation,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to get response");
        }

        const botMsg: Message = {
          id: `bot-${Date.now()}`,
          role: "assistant",
          content: data.message,
          actions: data.actions,
          timestamp: Date.now(),
        };

        setMessages((prev) => [...prev, botMsg]);
      } catch (err: any) {
        setMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "assistant",
            content: err.message || "Sorry, I'm having trouble connecting. Please try again.",
            timestamp: Date.now(),
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, currentLocation]
  );

  const handleAction = (action: string) => {
    if (action === "SOS") onNavigateSOS();
    else if (action === "FIND_DOCTORS") onNavigateDoctors();
    else if (action === "FIND_PHARMACY") onNavigatePharmacy();
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-[55] w-14 h-14 bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] rounded-2xl flex items-center justify-center shadow-lg shadow-[#3b82f6]/30 hover:shadow-xl hover:shadow-[#3b82f6]/40 hover:scale-105 transition-all duration-200 group"
        >
          <svg
            className="w-6 h-6 text-white group-hover:scale-110 transition-transform"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.591.659H9.061a2.25 2.25 0 01-1.591-.659L5 14.5m14 0V17a2.25 2.25 0 01-2.25 2.25H7.25A2.25 2.25 0 015 17v-2.5"
            />
          </svg>
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-2xl bg-[#3b82f6]/20 animate-ping" />
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div className="fixed bottom-4 right-4 right-4 md:right-6 md:left-auto md:w-[400px] z-[55] animate-slide-up">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: "min(600px, 80vh)" }}>
            {/* Header */}
            <div className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] px-4 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a2.25 2.25 0 01-1.591.659H9.061a2.25 2.25 0 01-1.591-.659L5 14.5m14 0V17a2.25 2.25 0 01-2.25 2.25H7.25A2.25 2.25 0 015 17v-2.5"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm font-[Outfit]">MediBot</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-[#4ade80] rounded-full" />
                    <p className="text-white/70 text-xs">AI Health Assistant</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setMessages([]);
                  }}
                  className="text-white/60 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                  title="Clear chat"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="text-white/60 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#f8fafc]" style={{ minHeight: 250 }}>
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[85%]">
                    <div
                      className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#3b82f6] text-white rounded-br-md"
                          : "bg-white text-[#1e293b] rounded-bl-md border border-[#e2e8f0] shadow-sm"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>

                    {/* Action buttons from AI response */}
                    {msg.actions && msg.actions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {msg.actions.includes("SOS") && (
                          <button
                            onClick={() => handleAction("SOS")}
                            className="bg-[#ef4444] hover:bg-[#dc2626] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm shadow-[#ef4444]/20"
                          >
                            🚨 Send Emergency SOS
                          </button>
                        )}
                        {msg.actions.includes("FIND_DOCTORS") && (
                          <button
                            onClick={() => handleAction("FIND_DOCTORS")}
                            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm shadow-[#3b82f6]/20"
                          >
                            🩺 Find Nearby Doctors
                          </button>
                        )}
                        {msg.actions.includes("FIND_PHARMACY") && (
                          <button
                            onClick={() => handleAction("FIND_PHARMACY")}
                            className="bg-[#10b981] hover:bg-[#059669] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shadow-sm shadow-[#10b981]/20"
                          >
                            💊 Find Pharmacy
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#e2e8f0] rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 bg-[#94a3b8] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-[#94a3b8] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-[#94a3b8] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick prompts — show when few messages */}
            {messages.length <= 1 && !loading && (
              <div className="px-4 pb-2 flex flex-wrap gap-2 bg-[#f8fafc]">
                {QUICK_PROMPTS.map((qp) => (
                  <button
                    key={qp.label}
                    onClick={() => sendMessage(qp.prompt)}
                    className="bg-white border border-[#e2e8f0] hover:border-[#3b82f6]/40 hover:bg-[#3b82f6]/5 text-[#475569] text-xs px-3 py-1.5 rounded-full transition-colors"
                  >
                    {qp.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="bg-white border-t border-[#e2e8f0] px-3 py-3 flex gap-2 flex-shrink-0">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
                placeholder="Ask about symptoms, first aid…"
                disabled={loading}
                className="flex-1 bg-[#f1f5f9] border border-[#e2e8f0] rounded-xl px-4 py-2.5 text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:border-[#3b82f6] disabled:opacity-50 transition-colors"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-[#3b82f6] to-[#8b5cf6] hover:from-[#2563eb] hover:to-[#7c3aed] disabled:opacity-40 text-white p-2.5 rounded-xl transition-all"
              >
               
<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
</svg>

              </button>
            </div>

            {/* Disclaimer */}
            <div className="bg-[#f8fafc] border-t border-[#e2e8f0] px-4 py-1.5 flex-shrink-0">
              <p className="text-[10px] text-[#94a3b8] text-center">
                MediBot is not a doctor. For emergencies, use SOS or call 144.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}