"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { getSessionChat, getSessionMeta, listSessions, sendMessage, endSession, deleteSession, getEncryptedSessionChat, saveEncryptedMessages, saveEncryptedSummary, saveEncryptedMemory, getEncryptedMemory, getTrailingSessionContext, getCompanion, setCompanion as setCompanionAction, type SessionListItem } from "../../actions";
import { useTheme } from "../../context/ThemeContext";
import { useEncryption } from "../../context/EncryptionContext";
import { encrypt, decrypt, decryptMessages, encryptMessages } from "@/lib/encryption";
import Link from "next/link";
import CrisisResourcesBanner from "../../components/CrisisResourcesBanner";
import MarkdownRenderer from "../../components/MarkdownRenderer";
import MeditationOfferModal from "../../components/MeditationOfferModal";
import MobileSidebar from "../../components/MobileSidebar";
import CompanionSelectModal from "../../components/CompanionSelectModal";
import type { CompanionStyle } from "@/models/user";

type ChatMessage = { role: "user" | "assistant"; content: string };
type CrisisLevel = "none" | "concern" | "crisis";

export default function ChatSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { encryptionKey } = useEncryption();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionMeta, setSessionMeta] = useState<{ sessionNumber: number; endedAt: string | null; companion: string | null } | null>(null);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [crisisLevel, setCrisisLevel] = useState<CrisisLevel>("none");
  const [decryptedMemory, setDecryptedMemory] = useState<string>("");
  const [trailingSummaries, setTrailingSummaries] = useState<Array<{ sessionNumber: number; summary: string | null }>>([]);
  const [showMeditationModal, setShowMeditationModal] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [meditationReady, setMeditationReady] = useState(false);
  const [showCompanionSettings, setShowCompanionSettings] = useState(false);
  const [currentCompanion, setCurrentCompanion] = useState<CompanionStyle | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load companion on mount
  useEffect(() => {
    getCompanion().then(c => setCurrentCompanion(c)).catch(() => {});
  }, []);

  // Load this session's chat messages
  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      if (!encryptionKey) return;
      
      try {
        // Try to load encrypted messages first
        const [encryptedChat, legacyChat, meta] = await Promise.all([
          getEncryptedSessionChat(sessionId),
          getSessionChat(sessionId),
          getSessionMeta(sessionId),
        ]);
        
        if (mounted) {
          // Prefer encrypted messages, fallback to legacy unencrypted
          if (encryptedChat) {
            const decrypted = await decryptMessages(encryptedChat, encryptionKey);
            setMessages(decrypted);
          } else {
            setMessages(legacyChat);
          }
          setSessionMeta(meta);
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Failed to load session", e);
        if (mounted) {
          setIsLoading(false);
          // Session not found, redirect to new chat
          router.push("/chats/new");
        }
      }
    }

    loadSession();
    return () => { mounted = false; };
  }, [sessionId, router, encryptionKey]);

  // Load encrypted context (memory + trailing summaries) for AI prompt building
  useEffect(() => {
    if (!encryptionKey) return;
    let mounted = true;

    async function loadContext() {
      try {
        const [encMem, trailing] = await Promise.all([
          getEncryptedMemory(),
          getTrailingSessionContext(),
        ]);
        if (!mounted) return;

        if (encMem) {
          const mem = await decrypt(encMem, encryptionKey!);
          setDecryptedMemory(mem);
        }

        const decryptedSums = await Promise.all(
          trailing.map(async (s) => {
            if (s.encryptedSummary) {
              const dec = await decrypt(s.encryptedSummary, encryptionKey!);
              return { sessionNumber: s.sessionNumber, summary: dec };
            }
            return { sessionNumber: s.sessionNumber, summary: s.summary };
          })
        );
        setTrailingSummaries(decryptedSums);
      } catch (e) {
        console.error("Failed to load encrypted context", e);
      }
    }

    loadContext();
    return () => { mounted = false; };
  }, [encryptionKey]);

  // Load session list for sidebar
  useEffect(() => {
    let mounted = true;

    async function loadSessions() {
      try {
        const data = await listSessions(200);
        if (mounted) setSessions(data);
      } catch (e) {
        console.error("Failed to load sessions", e);
      } finally {
        if (mounted) setSessionsLoading(false);
      }
    }

    loadSessions();
    return () => { mounted = false; };
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Focus input when ready (only if session is not ended)
  useEffect(() => {
    if (!isLoading && !isEnded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const isEnded = sessionMeta?.endedAt !== null;

  async function handleSend() {
    if (!sessionId || !input.trim() || isThinking || isEnded || !encryptionKey) return;

    const userMsg = input.trim();
    setInput("");

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: userMsg }];
    setMessages(nextMessages);
    setIsThinking(true);

    try {
      const { reply, crisisLevel: detectedLevel, agentRequestedClose } = await sendMessage({
        sessionId,
        messages: nextMessages,
        trailingSummaries,
        persistentMemory: decryptedMemory,
      });
      const updatedMessages: ChatMessage[] = [...nextMessages, { role: "assistant", content: reply }];
      setMessages(updatedMessages);
      
      // Encrypt and save messages to database
      const encrypted = await encryptMessages(updatedMessages, encryptionKey);
      await saveEncryptedMessages({ sessionId, encryptedMessages: encrypted });
      
      if (detectedLevel && detectedLevel !== "none") {
        setCrisisLevel(detectedLevel);
      }

      // Agent signaled session should end — process in background, show inline card
      if (agentRequestedClose) {
        handleAgentEndSession(updatedMessages);
      }
    } catch (e) {
      console.error("Failed to send", e);
    } finally {
      setIsThinking(false);
    }
  }

  // Core end-session logic — called by both agent-initiated close and user-initiated close
  async function performEndSession(msgs?: ChatMessage[]) {
    if (!sessionId || !encryptionKey) return;
    const currentMessages = msgs ?? messages;
    setIsEndingSession(true);
    try {
      const userMsgCount = currentMessages.filter(m => m.role === "user").length;
      if (userMsgCount < 3) {
        await deleteSession(sessionId);
        router.push("/");
        return;
      }

      const result = await endSession({ sessionId, messages: currentMessages, existingMemory: decryptedMemory });

      if (result.summary) {
        const encSummary = await encrypt(result.summary, encryptionKey);
        await saveEncryptedSummary({ sessionId, encryptedSummary: encSummary, intensityScore: result.intensityScore ?? null });
      }

      if (result.longTermMemory) {
        const encMemory = await encrypt(result.longTermMemory, encryptionKey);
        await saveEncryptedMemory(encMemory);
      }

      // Show meditation modal if recommended, otherwise go home
      if (result.meditation?.recommended && result.meditation.affirmations?.length) {
        sessionStorage.setItem(
          `meditation-${sessionId}`,
          JSON.stringify({ affirmations: result.meditation.affirmations }),
        );
        setShowMeditationModal(true);
      } else {
        router.push("/");
      }
    } catch (e) {
      console.error("Failed to end session", e);
    } finally {
      setIsEndingSession(false);
    }
  }

  async function handleEndSession() {
    performEndSession();
  }

  // Agent-initiated close: end session silently, show inline meditation card if available
  async function handleAgentEndSession(msgs: ChatMessage[]) {
    if (!sessionId || !encryptionKey) return;
    setIsEndingSession(true);
    try {
      const userMsgCount = msgs.filter(m => m.role === "user").length;
      if (userMsgCount < 3) {
        await deleteSession(sessionId);
        router.push("/");
        return;
      }

      const result = await endSession({ sessionId, messages: msgs, existingMemory: decryptedMemory });

      if (result.summary) {
        const encSummary = await encrypt(result.summary, encryptionKey);
        await saveEncryptedSummary({ sessionId, encryptedSummary: encSummary, intensityScore: result.intensityScore ?? null });
      }

      if (result.longTermMemory) {
        const encMemory = await encrypt(result.longTermMemory, encryptionKey);
        await saveEncryptedMemory(encMemory);
      }

      // Mark session as ended locally
      setSessionMeta(prev => prev ? { ...prev, endedAt: new Date().toISOString() } : prev);

      if (result.meditation?.recommended && result.meditation.affirmations?.length) {
        sessionStorage.setItem(
          `meditation-${sessionId}`,
          JSON.stringify({ affirmations: result.meditation.affirmations }),
        );
        const offerMsg: ChatMessage = {
          role: "assistant",
          content: "I've prepared a calming meditation with personalized affirmations from our conversation. Take a moment for yourself whenever you're ready.",
        };
        setMessages(prev => [...prev, offerMsg]);
        setMeditationReady(true);

        const withOffer = [...msgs, offerMsg];
        const encrypted = await encryptMessages(withOffer, encryptionKey);
        await saveEncryptedMessages({ sessionId, encryptedMessages: encrypted });
      } else {
        router.push("/");
      }
    } catch (e) {
      console.error("Failed to end session (agent)", e);
    } finally {
      setIsEndingSession(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const cx = {
    panel: isDarkMode
      ? "bg-[#0a0f0c] text-[#E8F3EE]"
      : "bg-[#FAFBF9] text-[#2F3E33]",
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

  if (isLoading) {
    return (
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className={`text-lg ${theme.textMuted}`}>Loading session...</div>
      </div>
    );
  }

  return (
    <div className="relative z-10 flex flex-col min-h-screen animate-in fade-in duration-1000">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 md:px-6 py-4 backdrop-blur-md border-b transition-colors duration-1000 ${theme.headerBg}`}>
        <div className="flex items-center gap-3">
          <MobileSidebar
            sessions={sessions}
            currentSessionId={sessionId}
            isDarkMode={isDarkMode}
            sessionsLoading={sessionsLoading}
          />
          <div className={`text-xs font-sans tracking-widest uppercase opacity-70 ${theme.textMuted}`}>
            Session {sessionMeta?.sessionNumber ? String(sessionMeta.sessionNumber).padStart(2, "0") : "--"} - {sessionMeta?.companion && ` ${sessionMeta.companion === "lua" ? "Lua" : "Leon"}`}
            {isEnded && <span className="ml-2">(Ended)</span>}
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-4">
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
            onClick={toggleTheme}
            className={`p-2 rounded-full transition-all duration-500 hover:scale-110 ${isDarkMode ? "bg-[#1F3326] text-[#E8F3EE]" : "bg-[#EAF2EC] text-[#2F3E33]"} hover:cursor-pointer`}
            title="Toggle Theme"
          >
            {isDarkMode ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
          <button
            onClick={() => setShowCompanionSettings(true)}
            className={`p-2 rounded-full transition-all duration-500 hover:scale-110 ${isDarkMode ? "bg-[#1F3326] text-[#E8F3EE]" : "bg-[#EAF2EC] text-[#2F3E33]"} hover:cursor-pointer`}
            title="Companion Settings"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
            <button
              onClick={isEnded ? () => router.push("/") : handleEndSession}
              className={`p-2 rounded-full transition-all duration-500 hover:scale-110 sm:hidden ${isDarkMode ? "bg-[#1F3326] text-[#E8F3EE]" : "bg-[#EAF2EC] text-[#2F3E33]"} hover:cursor-pointer`}
              title={isEnded ? "Back to Home" : "Close Session"}
            >
              {isEnded ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              )}
            </button>
            <button
              onClick={isEnded ? () => router.push("/") : handleEndSession}
              className={`text-xs font-sans hover:opacity-100 transition-all underline-offset-4 hover:underline hidden sm:block ${theme.textMuted} hover:cursor-pointer`}
            >
              {isEnded ? "Back to Home" : "Close Session"}
            </button>
        </div>
      </header>

      {/* Layout: Sidebar + Chat */}
      <div className="flex mt-16 h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className={`w-72 shrink-0 hidden md:flex flex-col h-full border-r ${isDarkMode ? "border-[#1a251e]" : "border-[#E8EDE9]"} ${cx.panel}`}>
          <div className="px-4 pt-4 pb-2">
            <Link
              href="/chats/new"
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors cursor-pointer ${cx.newSessionBtn}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="text-sm">New Session</span>
            </Link>
          </div>

          <div className={`flex-1 overflow-y-auto px-2 pb-4 ${cx.scrollbar}`}>
            {sessionsLoading ? (
              <div className={`text-sm px-2 py-4 ${cx.meta}`}>Loading…</div>
            ) : (
              <ul className="space-y-0.5">
                {sessions.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/chats/${s.id}`}
                      className={`block rounded-lg px-3 py-2.5 transition-colors ${s.id === sessionId ? cx.itemSelected : cx.item}`}
                    >
                      <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cx.meta}>
                          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        <span className="text-sm truncate flex-1">
                          {s.summary ? s.summary.slice(0, 30) + (s.summary.length > 30 ? "..." : "") : `Session ${String(s.sessionNumber).padStart(2, "0")}`}
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

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto px-4 md:px-6 py-8 pb-32">
          <div className="max-w-2xl mx-auto">
            <div className="space-y-10">
              {messages.length === 0 && (
                <div className={`text-center italic text-sm py-10 animate-in fade-in slide-in-from-bottom-4 ${theme.textMuted}`}>
                  No messages in this session.
                </div>
              )}

              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-500`}
                >
                  <div
                    className={`max-w-[85%] leading-relaxed shadow-sm transition-colors duration-500 ${
                      m.role === "user"
                        ? `${theme.userBubble} px-6 py-4 rounded-2xl rounded-tr-sm text-base border whitespace-pre-wrap`
                        : `${theme.aiBubble} px-6 py-4 rounded-2xl rounded-tl-sm text-base border`
                    }`}
                  >
                    {m.role === "assistant" ? (
                      <MarkdownRenderer content={m.content} isDarkMode={isDarkMode} />
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))}

              {meditationReady && (
                <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <button
                    onClick={() => router.push(`/meditation/${sessionId}`)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-sm font-medium tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl ${theme.button} hover:cursor-pointer`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                    Begin meditation
                  </button>
                </div>
              )}

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
      <footer className={`fixed bottom-0 left-0 md:left-72 right-0 px-4 pb-6 pt-10 bg-gradient-to-t to-transparent z-20 transition-colors duration-1000 ${theme.inputGradient}`}>
        <div className="max-w-2xl mx-auto relative">
          {isEnded ? (
            <div className={`relative flex items-center justify-center p-4 backdrop-blur-sm border rounded-3xl shadow-sm transition-colors duration-500 ${theme.inputBg}`}>
              <span className="text-sm opacity-80">This session has ended</span>
            </div>
          ) : (
            <div className={`relative flex items-end gap-2 p-2 backdrop-blur-sm border rounded-3xl shadow-sm focus-within:ring-1 focus-within:ring-[#8CA394] transition-colors duration-500 ${theme.inputBg}`}>
              <textarea
                ref={inputRef}
                className={`w-full max-h-32 bg-transparent px-4 py-3 text-base focus:outline-none resize-none font-sans ${theme.inputText}`}
                placeholder="Write your thoughts..."
                rows={1}
                value={input}
                onChange={handleInputResize}
                onKeyDown={handleKeyDown}
                disabled={isThinking}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isThinking}
                className={`mb-1 rounded-full p-2 shadow-sm transition-all transform hover:rotate-[-10deg] disabled:opacity-50 disabled:cursor-not-allowed ${theme.button}`}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5"></line>
                  <polyline points="5 12 12 5 19 12"></polyline>
                </svg>
              </button>
            </div>
          )}
        </div>
      </footer>

      {/* Crisis Resources Modal - Fixed Overlay */}
      {crisisLevel !== "none" && (
        <CrisisResourcesBanner 
          level={crisisLevel} 
          onDismiss={() => setCrisisLevel("none")}
          isDarkMode={isDarkMode}
        />
      )}

      {/* Meditation Offer Modal */}
      {showMeditationModal && sessionId && (
        <MeditationOfferModal
          isDarkMode={isDarkMode}
          isProcessing={isEndingSession}
          onAccept={() => router.push(`/meditation/${sessionId}`)}
          onDecline={() => router.push("/")}
        />
      )}

      {/* Companion Settings Modal */}
      {showCompanionSettings && (
        <CompanionSelectModal
          isFirstTime={false}
          initialSelected={currentCompanion}
          onSelect={async (c: CompanionStyle) => {
            await setCompanionAction(c);
            setCurrentCompanion(c);
            setShowCompanionSettings(false);
          }}
        />
      )}
    </div>
  );
}
