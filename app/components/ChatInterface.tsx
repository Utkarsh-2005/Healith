"use client";

import { useEffect, useRef } from "react";
import { UserButton } from "@clerk/nextjs";
import SessionHistory from "./SessionHistory";
import type { SessionListItem } from "../actions";

type ChatMessage = { role: "user" | "assistant"; content: string };

interface ChatInterfaceProps {
  sessionId: string;
  sessionNumber: number | null;
  messages: ChatMessage[];
  input: string;
  isThinking: boolean;
  isDarkMode: boolean;
  isTransitioning: boolean;
  refreshKey: number;
  viewSessionId: string | null;
  isViewingEndedSession: boolean;
  theme: {
    headerBg: string;
    textMuted: string;
    userBubble: string;
    aiBubble: string;
    inputBg: string;
    inputGradient: string;
    inputText: string;
    button: string;
  };
  onToggleTheme: () => void;
  onEndSession: () => void;
  onSend: () => void;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSelectSession: (item: SessionListItem) => void;
  onNewSession: () => void;
}

export default function ChatInterface({
  sessionId,
  sessionNumber,
  messages,
  input,
  isThinking,
  isDarkMode,
  isTransitioning,
  refreshKey,
  viewSessionId,
  isViewingEndedSession,
  theme,
  onToggleTheme,
  onEndSession,
  onSend,
  onInputChange,
  onSelectSession,
  onNewSession,
}: ChatInterfaceProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  useEffect(() => {
    if (sessionId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [sessionId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const isInputDisabled = isThinking || (!!viewSessionId && viewSessionId !== sessionId);

  return (
    <div className="relative z-10 flex flex-col min-h-screen animate-in fade-in duration-1000">
      {/* Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 backdrop-blur-md border-b transition-colors duration-1000 ${theme.headerBg}`}
      >
        <div
          className={`text-xs font-sans tracking-widest uppercase opacity-70 ${theme.textMuted}`}
        >
          Session {sessionNumber ? String(sessionNumber).padStart(2, "0") : "--"}
        </div>
        <div className="flex items-center gap-4">
          {/* User Profile Button */}
          <UserButton 
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
                userButtonPopoverCard: isDarkMode ? "bg-[#0f1a14] border-[#1F3326]" : "bg-white border-[#D8E6DB]",
                userButtonPopoverActionButton: isDarkMode ? "text-[#E8F3EE] hover:bg-[#1F3326]" : "text-[#2F3E33] hover:bg-[#E6F5E9]",
              }
            }}
          />
          <button
            onClick={onToggleTheme}
            className={`p-2 rounded-full transition-all duration-500 hover:scale-110 ${
              isDarkMode
                ? "bg-[#1F3326] text-[#E8F3EE]"
                : "bg-[#EAF2EC] text-[#2F3E33]"
            }`}
            title="Toggle Theme"
          >
            {isDarkMode ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <button
            onClick={onEndSession}
            className={`text-xs font-sans hover:opacity-100 transition-all underline-offset-4 hover:underline ${theme.textMuted}`}
          >
            Close Session
          </button>
        </div>
      </header>

      {/* Layout: Sidebar + Chat */}
      <div className="flex mt-16 h-[calc(100vh-4rem)]">
        <SessionHistory
          isDarkMode={isDarkMode}
          onSelect={onSelectSession}
          onNewSession={onNewSession}
          currentSessionId={sessionId}
          currentSessionNumber={sessionNumber}
          currentSessionHasMessages={messages.length >= 3}
          refreshKey={refreshKey}
          isCreatingSession={isTransitioning}
        />
        <main className="flex-1 overflow-y-auto px-6 py-8 pb-32">
          <div className="max-w-2xl mx-auto">
            <div className="space-y-10">
              {messages.length === 0 && (
                <div
                  className={`text-center italic text-sm py-10 animate-in fade-in slide-in-from-bottom-4 ${theme.textMuted}`}
                >
                  The space is open. How are you holding up?
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${
                    m.role === "user" ? "justify-end" : "justify-start"
                  } animate-in fade-in slide-in-from-bottom-2 duration-500`}
                >
                  <div
                    className={`max-w-[85%] leading-relaxed whitespace-pre-wrap shadow-sm transition-colors duration-500 ${
                      m.role === "user"
                        ? `${theme.userBubble} px-6 py-4 rounded-2xl rounded-tr-sm text-base border`
                        : `${theme.aiBubble} px-6 py-4 rounded-2xl rounded-tl-sm text-base border`
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}

              {isThinking && (
                <div className="flex justify-start animate-in fade-in">
                  <div className={`px-2 text-sm italic tracking-wide ${theme.textMuted}`}>
                    Reflecting...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>
          </div>
        </main>
      </div>

      {/* Input Area */}
      <footer
        className={`fixed bottom-0 left-72 right-0 px-4 pb-6 pt-10 bg-gradient-to-t to-transparent z-20 transition-colors duration-1000 ${theme.inputGradient}`}
      >
        <div className="max-w-2xl mx-auto relative">
          {isViewingEndedSession ? (
            <div
              className={`relative flex items-center justify-center p-4 backdrop-blur-sm border rounded-3xl shadow-sm transition-colors duration-500 ${theme.inputBg}`}
            >
              <div className="text-sm opacity-80">This session has ended</div>
            </div>
          ) : (
            <div
              className={`relative flex items-end gap-2 p-2 backdrop-blur-sm border rounded-3xl shadow-sm focus-within:ring-1 focus-within:ring-[#8CA394] transition-colors duration-500 ${theme.inputBg}`}
            >
              <textarea
                ref={inputRef}
                className={`w-full max-h-32 bg-transparent px-4 py-3 text-base focus:outline-none resize-none font-sans ${theme.inputText}`}
                placeholder="Write your thoughts..."
                rows={1}
                value={input}
                onChange={onInputChange}
                onKeyDown={handleKeyDown}
                disabled={isInputDisabled}
              />
              <button
                onClick={onSend}
                disabled={!input.trim() || isInputDisabled}
                className={`mb-1 rounded-full p-2 shadow-sm transition-all transform hover:rotate-[-10deg] disabled:opacity-50 disabled:cursor-not-allowed ${theme.button}`}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
              </button>
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
