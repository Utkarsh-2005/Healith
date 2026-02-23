"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

interface Session {
  id: string;
  sessionNumber: number;
  summary?: string | null;
  companion?: string | null;
}

interface MobileSidebarProps {
  sessions: Session[];
  currentSessionId?: string;
  isDarkMode: boolean;
  sessionsLoading?: boolean;
  onNewSession?: () => void;
}

export default function MobileSidebar({ sessions, currentSessionId, isDarkMode, sessionsLoading, onNewSession }: MobileSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [portalRoot, setPortalRoot] = useState<HTMLElement | null>(null);

  // Grab document.body on mount for portal rendering
  useEffect(() => {
    setPortalRoot(document.body);
  }, []);

  const cx = {
    panelBg: isDarkMode ? "#0a100d" : "#FDFCF8",
    panel: isDarkMode ? "text-[#E8F3EE]" : "text-[#2F3E33]",
    item: isDarkMode ? "hover:bg-[#1a251e] text-[#c5d4cb]" : "hover:bg-[#E8EDE9] text-[#3a4a3e]",
    itemSelected: isDarkMode ? "bg-[#1a251e] text-[#E8F3EE]" : "bg-[#E8EDE9] text-[#2F3E33]",
    meta: isDarkMode ? "text-[#4a5f50]" : "text-[#8a9a8e]",
  };

  const drawerContent = (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 md:hidden"
          style={{ zIndex: 9998 }}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 transform transition-transform duration-300 md:hidden shadow-2xl ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } ${cx.panel}`}
        style={{ backgroundColor: cx.panelBg, zIndex: 9999 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-current/10">
          <span className={`font-medium ${isDarkMode ? "text-[#E8F3EE]" : "text-[#2F3E33]"}`}>
            Sessions
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className={`p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-[#1F3326]" : "hover:bg-[#E8EDE9]"}`}
            aria-label="Close menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* New Session Button */}
        <div className="p-4">
          {onNewSession ? (
            <button
              onClick={() => { setIsOpen(false); onNewSession(); }}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${isDarkMode ? "bg-[#1F3326] hover:bg-[#2C4A3B] text-[#E8F3EE]" : "bg-[#E6F5E9] hover:bg-[#D4E7D9] text-[#2F3E33]"}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="text-sm">New Session</span>
            </button>
          ) : (
            <Link
              href="/chats/new"
              onClick={() => setIsOpen(false)}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${isDarkMode ? "bg-[#1F3326] hover:bg-[#2C4A3B] text-[#E8F3EE]" : "bg-[#E6F5E9] hover:bg-[#D4E7D9] text-[#2F3E33]"}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="text-sm">New Session</span>
            </Link>
          )}
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto px-2 pb-4">
          {sessionsLoading ? (
            <div className={`text-sm px-2 py-4 ${cx.meta}`}>Loading…</div>
          ) : (
            <ul className="space-y-0.5">
              {sessions.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/chats/${s.id}`}
                    onClick={() => setIsOpen(false)}
                    className={`block rounded-lg px-3 py-2.5 transition-colors ${s.id === currentSessionId ? cx.itemSelected : cx.item}`}
                  >
                    <div className="flex items-center gap-2">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cx.meta}>
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                      </svg>
                      <span className="text-sm truncate flex-1">
                        {s.summary ? s.summary.slice(0, 25) + (s.summary.length > 25 ? "..." : "") : `Session ${String(s.sessionNumber).padStart(2, "0")}`}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}

              {sessions.length === 0 && (
                <div className={`text-sm px-2 py-4 ${cx.meta}`}>No sessions yet</div>
              )}
            </ul>
          )}
        </div>
      </aside>
    </>
  );

  return (
    <>
      {/* Hamburger Button — rendered inline in header */}
      <button
        onClick={() => setIsOpen(true)}
        className={`md:hidden p-2 rounded-lg transition-colors ${isDarkMode ? "hover:bg-[#1F3326]" : "hover:bg-[#E8EDE9]"}`}
        aria-label="Open menu"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Overlay + Drawer portaled to body to escape header stacking context */}
      {portalRoot && createPortal(drawerContent, portalRoot)}
    </>
  );
}
