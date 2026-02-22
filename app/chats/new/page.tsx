"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { startSession, sendMessage, endSession, deleteSession, listSessions, saveEncryptedMessages, saveEncryptedSummary, saveEncryptedMemory, getEncryptedMemory, getTrailingSessionContext, type SessionListItem } from "../../actions";
import { useTheme } from "../../context/ThemeContext";
import { useEncryption } from "../../context/EncryptionContext";
import { encrypt, decrypt, encryptMessages } from "@/lib/encryption";
import Link from "next/link";
import CrisisResourcesBanner from "../../components/CrisisResourcesBanner";
import MarkdownRenderer from "../../components/MarkdownRenderer";
import MeditationOfferModal from "../../components/MeditationOfferModal";
import MobileSidebar from "../../components/MobileSidebar";

type ChatMessage = { role: "user" | "assistant"; content: string };
type CrisisLevel = "none" | "concern" | "crisis";

export default function NewChatPage() {
  const router = useRouter();
  const { isDarkMode, toggleTheme, theme } = useTheme();
  const { encryptionKey } = useEncryption();
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionNumber, setSessionNumber] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [sessions, setSessions] = useState<SessionListItem[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [crisisLevel, setCrisisLevel] = useState<CrisisLevel>("none");
  const [decryptedMemory, setDecryptedMemory] = useState<string>("");
  const [trailingSummaries, setTrailingSummaries] = useState<Array<{ sessionNumber: number; summary: string | null }>>([]);
  const [showMeditationModal, setShowMeditationModal] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [meditationReady, setMeditationReady] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialize a new session on mount
  useEffect(() => {
    let mounted = true;
    
    async function init() {
      try {
        const { sessionId: newId, sessionNumber: newNum, initialMessage } = await startSession();
        if (mounted) {
          setSessionId(newId);
          setSessionNumber(newNum);
          if (initialMessage) {
            setMessages([{ role: "assistant", content: initialMessage }]);
          }
          setIsInitializing(false);
        }
      } catch (e) {
        console.error("Failed to start session", e);
        if (mounted) setIsInitializing(false);
      }
    }
    
    init();
    return () => { mounted = false; };
  }, []);

  // Load session list for sidebar (only IDs and metadata, not full chats)
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

        // Decrypt memory
        if (encMem) {
          const mem = await decrypt(encMem, encryptionKey!);
          setDecryptedMemory(mem);
        }

        // Decrypt trailing summaries
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

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  // Focus input when session is ready
  useEffect(() => {
    if (sessionId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [sessionId]);

  async function handleSend() {
    if (!sessionId || !input.trim() || isThinking || !encryptionKey) return;

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

  const handleNewSession = async () => {
    if (!sessionId || !encryptionKey) return;

    try {
      // If fewer than 3 user messages, just delete the session — no summary/memory work
      const userMsgCount = messages.filter(m => m.role === "user").length;
      if (userMsgCount < 3) {
        await deleteSession(sessionId);
        window.location.reload();
        return;
      }

      // End current session first with encryption
      const result = await endSession({ sessionId, messages, existingMemory: decryptedMemory });

      // Encrypt and save summary
      if (result.summary) {
        const encSummary = await encrypt(result.summary, encryptionKey);
        await saveEncryptedSummary({ sessionId, encryptedSummary: encSummary, intensityScore: result.intensityScore ?? null });
      }

      // Encrypt and save long-term memory
      if (result.longTermMemory) {
        const encMemory = await encrypt(result.longTermMemory, encryptionKey);
        await saveEncryptedMemory(encMemory);
      }

      // Start fresh by reloading the page
      window.location.reload();
    } catch (e) {
      console.error("Failed to create new session", e);
    }
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

  if (isInitializing) {
    return (
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className={`text-lg ${theme.textMuted}`}>Preparing your space...</div>
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
            isDarkMode={isDarkMode}
            sessionsLoading={sessionsLoading}
            onNewSession={handleNewSession}
          />
          <div className={`text-xs font-sans tracking-widest uppercase opacity-70 ${theme.textMuted}`}>
            Session {sessionNumber ? String(sessionNumber).padStart(2, "0") : "--"}
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
            onClick={handleEndSession}
            className={`p-2 rounded-full transition-all duration-500 hover:scale-110 sm:hidden ${isDarkMode ? "bg-[#1F3326] text-[#E8F3EE]" : "bg-[#EAF2EC] text-[#2F3E33]"} hover:cursor-pointer`}
            title="Close Session"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <button
            onClick={handleEndSession}
            className={`text-xs font-sans hover:opacity-100 transition-all underline-offset-4 hover:underline hidden sm:block ${theme.textMuted} hover:cursor-pointer`}
          >
            Close Session
          </button>
        </div>
      </header>

      {/* Layout: Sidebar + Chat */}
      <div className="flex mt-16 h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <aside className={`w-72 shrink-0 hidden md:flex flex-col h-full border-r ${isDarkMode ? "border-[#1a251e]" : "border-[#E8EDE9]"} ${cx.panel}`}>
          <div className="px-4 pt-4 pb-2">
            <button
              onClick={handleNewSession}
              className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors cursor-pointer ${cx.newSessionBtn}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span className="text-sm">New Session</span>
            </button>
          </div>

          <div className={`flex-1 overflow-y-auto px-2 pb-4 ${cx.scrollbar}`}>
            {sessionsLoading ? (
              <div className={`text-sm px-2 py-4 ${cx.meta}`}>Loading…</div>
            ) : (
              <ul className="space-y-0.5">
                {/* Current session indicator */}
                <li className={`rounded-lg px-3 py-2.5 ${cx.itemSelected}`}>
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={cx.meta}>
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span className="text-sm truncate">New Session</span>
                    <span className={`ml-auto text-[10px] ${cx.meta}`}>•</span>
                  </div>
                </li>

                {/* Past sessions - link to /chats/[id] */}
                {sessions.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`/chats/${s.id}`}
                      className={`block rounded-lg px-3 py-2.5 transition-colors ${cx.item}`}
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
                  <div className={`text-sm px-2 py-4 ${cx.meta}`}>No previous sessions</div>
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
                  The space is open. How are you holding up?
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
    </div>
  );
}
