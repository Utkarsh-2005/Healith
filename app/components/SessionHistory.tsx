"use client";

import { useEffect, useState } from "react";
import { listSessions, type SessionListItem } from "../actions";

interface SessionHistoryProps {
  isDarkMode?: boolean;
  onSelect?: (item: SessionListItem) => void;
  onNewSession?: () => void;
  currentSessionId?: string | null;
  currentSessionNumber?: number | null;
  currentSessionHasMessages?: boolean; // true if messages >= 3
  refreshKey?: number; // increment to trigger refresh
  isCreatingSession?: boolean; // true when creating a new session
}

export default function SessionHistory({
  isDarkMode,
  onSelect,
  onNewSession,
  currentSessionId,
  currentSessionNumber,
  currentSessionHasMessages,
  refreshKey,
  isCreatingSession,
}: SessionHistoryProps) {
  const [items, setItems] = useState<SessionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await listSessions(200);
        if (mounted) setItems(data);
      } catch (e) {
        console.error("Failed to load sessions", e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [refreshKey]);

  // Auto-select the current session when it becomes active
  useEffect(() => {
    if (currentSessionId) {
      setSelectedId(currentSessionId);
    }
  }, [currentSessionId]);

  const cx = {
    panel: isDarkMode
      ? "bg-[#0a0f0c] text-[#E8F3EE]"
      : "bg-[#FAFBF9] text-[#2F3E33]",
    header: isDarkMode ? "text-[#6B8A7A]" : "text-[#7A9182]",
    item: isDarkMode
      ? "hover:bg-[#151d18]"
      : "hover:bg-[#F0F3EF]",
    itemSelected: isDarkMode
      ? "bg-[#1a251e]"
      : "bg-[#E8EDE9]",
    meta: isDarkMode ? "text-[#6B8A7A]" : "text-[#7A9182]",
    newSessionBtn: isDarkMode
      ? "hover:bg-[#151d18] text-[#E8F3EE]"
      : "hover:bg-[#F0F3EF] text-[#2F3E33]",
    scrollbar: isDarkMode
      ? "scrollbar-thin scrollbar-thumb-[#1a251e] scrollbar-track-transparent"
      : "scrollbar-thin scrollbar-thumb-[#D8E0DA] scrollbar-track-transparent",
  };

  const handleSelect = (item: SessionListItem) => {
    setSelectedId(item.id);
    onSelect?.(item);
  };

  const handleNewSession = () => {
    setSelectedId(null);
    onNewSession?.();
  };

  // Check if the current active session should appear in the list (has meaningful conversation >= 3 messages)
  const showCurrentSessionInList = currentSessionId && currentSessionHasMessages;

  return (
    <aside className={`w-72 shrink-0 flex flex-col h-full border-r ${isDarkMode ? "border-[#1a251e]" : "border-[#E8EDE9]"} ${cx.panel}`}>
      <div className="px-4 pt-4 pb-2">
        {/* <div className={`text-[11px] font-medium uppercase tracking-wider mb-3 ${cx.header}`}>
          Sessions
        </div> */}
        
        {/* New Session Button - ChatGPT style */}
        <button
          onClick={handleNewSession}
          disabled={isCreatingSession}
          className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${cx.newSessionBtn}`}
        >
          {isCreatingSession ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
              <circle cx="12" cy="12" r="10" strokeDasharray="32" strokeDashoffset="12" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          )}
          <span className="text-sm">{isCreatingSession ? "Creating..." : "New Session"}</span>
        </button>
      </div>

      {/* Scrollable Session List */}
      <div className={`flex-1 overflow-y-auto px-2 pb-4 ${cx.scrollbar}`}>
        {loading ? (
          <div className={`text-sm px-2 py-4 ${cx.meta}`}>Loading…</div>
        ) : (
          <ul className="space-y-0.5">
            {/* Current active session (shown as "New Session" if it has >= 3 messages) */}
            {showCurrentSessionInList && (
              <li
                key={currentSessionId}
                className={`rounded-lg px-3 py-2.5 transition-colors cursor-pointer ${
                  selectedId === currentSessionId ? cx.itemSelected : cx.item
                }`}
                onClick={() => {
                  setSelectedId(currentSessionId);
                  onSelect?.({
                    id: currentSessionId,
                    sessionNumber: currentSessionNumber ?? 0,
                    startedAt: new Date().toISOString(),
                    endedAt: null,
                    intensityScore: null,
                    summary: null,
                  });
                }}
              >
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cx.meta}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span className="text-sm truncate">New Session</span>
                  <span className={`ml-auto text-[10px] ${cx.meta}`}>•</span>
                </div>
              </li>
            )}

            {/* Past sessions - ChatGPT minimal style */}
            {items.map((s) => (
              <li
                key={s.id}
                className={`rounded-lg px-3 py-2.5 transition-colors cursor-pointer group ${
                  selectedId === s.id ? cx.itemSelected : cx.item
                }`}
                onClick={() => handleSelect(s)}
              >
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cx.meta}>
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  </svg>
                  <span className="text-sm truncate flex-1">
                    {s.summary ? s.summary.slice(0, 30) + (s.summary.length > 30 ? "..." : "") : `Session ${String(s.sessionNumber).padStart(2, "0")}`}
                  </span>
                </div>
              </li>
            ))}

            {items.length === 0 && !showCurrentSessionInList && (
              <div className={`text-sm px-2 py-4 ${cx.meta}`}>No sessions yet</div>
            )}
          </ul>
        )}
      </div>
    </aside>
  );
}
