"use client";

import { useState } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ExportButtonProps {
  messages: Message[];
  sessionNumber?: number;
  isDarkMode: boolean;
}

export default function ExportButton({ messages, sessionNumber, isDarkMode }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const buttonClass = isDarkMode
    ? "text-[#9ECDB8] hover:text-[#E8F3EE] hover:bg-[#1F3326]"
    : "text-[#5A6B5D] hover:text-[#2F3E33] hover:bg-[#E8EDE9]";

  const dropdownClass = isDarkMode
    ? "bg-[#0f1a14] border-[#1F3326]"
    : "bg-white border-[#D8E6DB]";

  const itemClass = isDarkMode
    ? "hover:bg-[#1F3326] text-[#c5d4cb]"
    : "hover:bg-[#F5F9F6] text-[#3a4a3e]";

  const disclaimer = `
---
DISCLAIMER: This conversation was with Healith, an AI wellness companion.
Healith is NOT a licensed therapist or medical professional and cannot 
diagnose conditions or provide medical advice. If you are in crisis, 
please contact a mental health professional or crisis helpline.
---
`;

  function exportAsText() {
    const title = sessionNumber ? `Healith Session ${sessionNumber}` : "Healith Conversation";
    const date = new Date().toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });

    let content = `${title}\nExported: ${date}\n${disclaimer}\n`;
    
    messages.forEach((m) => {
      const speaker = m.role === "user" ? "You" : "Healith";
      content += `\n${speaker}:\n${m.content}\n`;
    });

    downloadFile(content, `healith-session-${sessionNumber || "export"}.txt`, "text/plain");
    setIsOpen(false);
  }

  function exportAsMarkdown() {
    const title = sessionNumber ? `Healith Session ${sessionNumber}` : "Healith Conversation";
    const date = new Date().toLocaleDateString("en-US", { 
      year: "numeric", 
      month: "long", 
      day: "numeric" 
    });

    let content = `# ${title}\n\n*Exported: ${date}*\n${disclaimer}\n---\n\n`;
    
    messages.forEach((m) => {
      const speaker = m.role === "user" ? "**You**" : "**Healith**";
      content += `${speaker}\n\n${m.content}\n\n---\n\n`;
    });

    downloadFile(content, `healith-session-${sessionNumber || "export"}.md`, "text/markdown");
    setIsOpen(false);
  }

  function exportAsJSON() {
    const data = {
      title: sessionNumber ? `Healith Session ${sessionNumber}` : "Healith Conversation",
      exportedAt: new Date().toISOString(),
      disclaimer: "This conversation was with Healith, an AI wellness companion. Healith is NOT a licensed therapist or medical professional.",
      messages: messages.map((m) => ({
        speaker: m.role === "user" ? "user" : "healith",
        content: m.content,
      })),
    };

    downloadFile(JSON.stringify(data, null, 2), `healith-session-${sessionNumber || "export"}.json`, "application/json");
    setIsOpen(false);
  }

  function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-colors ${buttonClass}`}
        aria-label="Export conversation"
        title="Export conversation"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          
          {/* Dropdown menu */}
          <div className={`absolute right-0 mt-2 w-48 rounded-lg border shadow-lg z-50 ${dropdownClass}`}>
            <div className="py-1">
              <button
                onClick={exportAsText}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${itemClass}`}
              >
                📄 Plain Text (.txt)
              </button>
              <button
                onClick={exportAsMarkdown}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${itemClass}`}
              >
                📝 Markdown (.md)
              </button>
              <button
                onClick={exportAsJSON}
                className={`w-full px-4 py-2 text-left text-sm transition-colors ${itemClass}`}
              >
                📊 JSON (.json)
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
