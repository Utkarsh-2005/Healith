"use client";

import { useState } from "react";

interface ChatMessageBubbleProps {
  role: "user" | "assistant";
  content: string;
  timestamp?: Date;
  isDarkMode: boolean;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString("en-US", { 
    month: "short", 
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

export default function ChatMessageBubble({ 
  role, 
  content, 
  timestamp,
  isDarkMode 
}: ChatMessageBubbleProps) {
  const [showTimestamp, setShowTimestamp] = useState(false);

  const theme = {
    userBubble: isDarkMode 
      ? "bg-[#161a24] text-[#E8F3EE] border-[#1F3326]" 
      : "bg-[#EAF2EC] text-[#1A2E22] border-[#D8E6DB]",
    aiBubble: isDarkMode 
      ? "bg-[#13241C] text-[#E8F3EE] border-[#1F3326]" 
      : "bg-[#E6F5E9] text-[#1A2E22] border-[#CDE7D6]",
    timestampText: isDarkMode ? "text-[#6B8A76]" : "text-[#8CA394]",
  };

  const bubbleClass = role === "user" ? theme.userBubble : theme.aiBubble;
  const roundedClass = role === "user" 
    ? "rounded-2xl rounded-tr-sm" 
    : "rounded-2xl rounded-tl-sm";

  return (
    <div 
      className={`flex ${role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-500`}
    >
      <div className="flex flex-col gap-1 max-w-[85%]">
        <div
          onClick={() => setShowTimestamp(!showTimestamp)}
          className={`leading-relaxed whitespace-pre-wrap shadow-sm transition-colors duration-500 cursor-pointer ${bubbleClass} px-6 py-4 ${roundedClass} text-base border`}
        >
          {content}
        </div>
        
        {/* Timestamp - shown on tap/click */}
        {showTimestamp && timestamp && (
          <div className={`text-xs ${theme.timestampText} ${role === "user" ? "text-right pr-2" : "text-left pl-2"}`}>
            {formatRelativeTime(timestamp)}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component to render a list of messages with the thinking indicator
interface ChatMessagesListProps {
  messages: Array<{ role: "user" | "assistant"; content: string; timestamp?: Date }>;
  isThinking: boolean;
  isDarkMode: boolean;
}

export function ChatMessagesList({ messages, isThinking, isDarkMode }: ChatMessagesListProps) {
  const thinkingBubbleClass = isDarkMode 
    ? "bg-[#13241C] text-[#6B8A76] border-[#1F3326]" 
    : "bg-[#E6F5E9] text-[#8CA394] border-[#CDE7D6]";

  return (
    <div className="space-y-6">
      {messages.map((m, i) => (
        <ChatMessageBubble
          key={i}
          role={m.role}
          content={m.content}
          timestamp={m.timestamp}
          isDarkMode={isDarkMode}
        />
      ))}
      
      {/* Thinking indicator */}
      {isThinking && (
        <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2">
          <div className={`px-6 py-4 rounded-2xl rounded-tl-sm border ${thinkingBubbleClass}`}>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "0ms" }} />
              <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "150ms" }} />
              <div className="w-2 h-2 rounded-full bg-current animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
