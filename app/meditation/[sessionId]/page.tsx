"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { useTheme } from "../../context/ThemeContext";

const INTRO_TEXT = "To begin, close your eyes. Sit in a comfortable place. Focus on the sound of my voice.";
const BACKGROUND_MUSIC_URL =
  "https://cdn.pixabay.com/audio/2026/02/09/audio_4c3d3158a1.mp3";

// Random delay between affirmations: 4–5 seconds
function randomDelay() {
  return 4000 + Math.random() * 1000;
}

// ---------- Wave animation CSS (injected once) ----------
const waveStyles = `
@keyframes wave-drift {
  0%   { transform: translateX(0)   scaleY(1);   }
  50%  { transform: translateX(-25%) scaleY(1.15); }
  100% { transform: translateX(-50%) scaleY(1);   }
}
@keyframes wave-drift-slow {
  0%   { transform: translateX(0)   scaleY(1);   }
  50%  { transform: translateX(-15%) scaleY(0.9);  }
  100% { transform: translateX(-30%) scaleY(1);   }
}
@keyframes gentle-pulse {
  0%, 100% { opacity: 0.25; }
  50%      { opacity: 0.45; }
}
@keyframes text-breathe {
  0%, 100% { opacity: 0; transform: scale(0.96) translateY(8px); }
  10%      { opacity: 1; transform: scale(1)    translateY(0);   }
  85%      { opacity: 1; transform: scale(1)    translateY(0);   }
  100%     { opacity: 0; transform: scale(0.96) translateY(-8px);}
}
.wave-layer {
  position: absolute;
  left: -10%;
  width: 220%;
  height: 120px;
  border-radius: 50% 50% 0 0;
  pointer-events: none;
}
.animate-text-breathe {
  animation: text-breathe 5s ease-in-out forwards;
}
.animate-text-breathe-long {
  animation: text-breathe 7s ease-in-out forwards;
}
`;

export default function MeditationPage() {
  const router = useRouter();
  const { sessionId } = useParams();
  const { isDarkMode, toggleTheme, theme } = useTheme();

  // Meditation data from sessionStorage
  const [affirmations, setAffirmations] = useState<string[]>([]);

  // Playback state
  const [phase, setPhase] = useState<"loading" | "ready" | "playing" | "done">("loading");
  const [currentIndex, setCurrentIndex] = useState(-1); // -1 = intro
  const [displayText, setDisplayText] = useState("");
  const [textKey, setTextKey] = useState(0); // force re-mount for animation

  // Audio refs
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);

  // Pre-fetched TTS blobs (keyed by index; -1 = intro)
  const blobCache = useRef<Map<number, string>>(new Map());
  const abortRef = useRef(false);

  // ---- Load affirmations from sessionStorage ----
  useEffect(() => {
    const key = `meditation-${sessionId}`;
    const stored = sessionStorage.getItem(key);
    if (!stored) {
      router.push("/");
      return;
    }
    try {
      const data = JSON.parse(stored) as { affirmations: string[] };
      setAffirmations(data.affirmations);
    } catch {
      router.push("/");
    }
  }, [sessionId, router]);

  // ---- Pre-fetch all TTS blobs once affirmations are loaded ----
  const fetchTTS = useCallback(async (text: string): Promise<string> => {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`TTS fetch failed: ${res.status}`);
    const blob = await res.blob();
    return URL.createObjectURL(blob);
  }, []);

  // ---- Pre-fetch TTS: intro first (makes page "ready"), then rest in background ----
  useEffect(() => {
    if (affirmations.length === 0) return;
    let cancelled = false;

    async function prefetch() {
      // 1. Fetch intro blob (use static Cloudinary URL if available)
      try {
        const staticIntroUrl = process.env.NEXT_PUBLIC_INTRO_AUDIO_URL;
        const introUrl = staticIntroUrl || await fetchTTS(INTRO_TEXT);
        if (cancelled) return;
        blobCache.current.set(-1, introUrl);
      } catch (err) {
        console.error("[Meditation] TTS prefetch failed for intro:", err);
      }

      // Transition to ready as soon as intro is available
      if (!cancelled) setPhase("ready");

      // 2. Fetch remaining affirmation blobs in background
      for (let i = 0; i < affirmations.length; i++) {
        if (cancelled) return;
        try {
          const url = await fetchTTS(affirmations[i]);
          if (cancelled) return;
          blobCache.current.set(i, url);
        } catch (err) {
          console.error(`[Meditation] TTS prefetch failed for index ${i}:`, err);
        }
      }
    }

    prefetch();
    return () => { cancelled = true; };
  }, [affirmations, fetchTTS]);

  // ---- Wait for a blob to be ready (polls cache for progressive fetch) ----
  function waitForBlob(index: number, timeoutMs = 30000): Promise<string | undefined> {
    return new Promise((resolve) => {
      const cached = blobCache.current.get(index);
      if (cached) { resolve(cached); return; }
      const start = Date.now();
      const interval = setInterval(() => {
        const c = blobCache.current.get(index);
        if (c || abortRef.current || Date.now() - start > timeoutMs) {
          clearInterval(interval);
          resolve(c);
        }
      }, 200);
    });
  }

  // ---- Play a single segment and return when it finishes ----
  function playVoice(blobUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const audio = new Audio(blobUrl);
      voiceRef.current = audio;
      audio.onended = () => resolve();
      audio.onerror = () => reject(new Error("voice playback error"));
      audio.play().catch(reject);
    });
  }

  // ---- Main playback loop ----
  async function startMeditation() {
    abortRef.current = false;
    setPhase("playing");

    // Start background music (looped, low volume)
    const bg = new Audio(BACKGROUND_MUSIC_URL);
    bg.loop = true;
    bg.volume = 0.18;
    bgMusicRef.current = bg;
    bg.play().catch(() => {});

    // Play intro
    setCurrentIndex(-1);
    setDisplayText(INTRO_TEXT);
    setTextKey((k) => k + 1);
    const introBlob = blobCache.current.get(-1);
    if (introBlob) {
      try { await playVoice(introBlob); } catch {}
    }

    // Wait a beat after intro
    await sleep(2000);

    // Play each affirmation
    for (let i = 0; i < affirmations.length; i++) {
      if (abortRef.current) break;
      setCurrentIndex(i);
      setDisplayText(affirmations[i]);
      setTextKey((k) => k + 1);

      // Wait for blob if not yet fetched (progressive loading)
      const blob = await waitForBlob(i);
      if (blob) {
        try { await playVoice(blob); } catch {}
      }

      // Random pause between affirmations
      if (i < affirmations.length - 1) {
        await sleep(randomDelay());
      }
    }

    // Fade out music
    if (bgMusicRef.current) {
      await fadeOutAudio(bgMusicRef.current, 2000);
    }

    setPhase("done");
  }

  // ---- Reset abort flag on mount, cleanup on unmount ----
  useEffect(() => {
    abortRef.current = false;
    return () => {
      abortRef.current = true;
      bgMusicRef.current?.pause();
      voiceRef.current?.pause();
      blobCache.current.forEach((url) => {
        if (url.startsWith("blob:")) URL.revokeObjectURL(url);
      });
      blobCache.current.clear();
    };
  }, []);

  function handleFinish() {
    bgMusicRef.current?.pause();
    voiceRef.current?.pause();
    router.push("/");
  }

  // ---- Colour tokens ----
  const wave1 = isDarkMode ? "rgba(31,68,51,0.35)" : "rgba(44,85,66,0.18)";
  const wave2 = isDarkMode ? "rgba(44,85,66,0.25)" : "rgba(31,68,51,0.12)";
  const wave3 = isDarkMode ? "rgba(20,51,38,0.30)" : "rgba(58,97,77,0.10)";
  const glowColor = isDarkMode ? "rgba(158,205,184,0.08)" : "rgba(74,124,89,0.06)";

  return (
    <>
      <style>{waveStyles}</style>

      <div
        className={`relative min-h-screen flex flex-col items-center justify-center overflow-x-hidden transition-colors duration-1000 ${theme.bg}`}
      >
        {/* ---- NAVBAR ---- */}
        <header className={`fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 backdrop-blur-md border-b transition-colors duration-1000 ${theme.headerBg}`}>
          <div className={`text-xs font-sans tracking-widest uppercase opacity-70 ${theme.textMuted}`}>
            Meditation
          </div>
          <div className="flex items-center gap-4">
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
              className={`p-2 rounded-full transition-all duration-500 hover:scale-110 ${isDarkMode ? "bg-[#1F3326] text-[#E8F3EE]" : "bg-[#EAF2EC] text-[#2F3E33]"}`}
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
          </div>
        </header>
        {/* ---- WAVE LAYERS ---- */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
          {/* Glow core */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: 600,
              height: 600,
              background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
              animation: "gentle-pulse 6s ease-in-out infinite",
            }}
          />

          {/* Bottom wave 1 — front, fastest */}
          <div
            className="wave-layer"
            style={{
              bottom: 20,
              background: wave1,
              animation: "wave-drift 8s linear infinite",
              height: 120,
            }}
          />
          {/* Bottom wave 2 — behind, slower */}
          <div
            className="wave-layer"
            style={{
              bottom: 30,
              background: wave2,
              animation: "wave-drift-slow 12s linear infinite",
              height: 100,
            }}
          />
          {/* Bottom wave 3 — deepest, slowest */}
          <div
            className="wave-layer"
            style={{
              bottom: 60,
              background: wave3,
              animation: "wave-drift 16s linear infinite",
              height: 80,
            }}
          />

          {/* Top wave — anchored below navbar, curve faces down */}
          <div
            style={{
              position: "absolute",
              left: "-10%",
              width: "220%",
              top: 56,
              height: 90,
              borderRadius: "0 0 50% 50%",
              background: wave1,
              animation: "wave-drift-slow 14s linear infinite",
              opacity: 0.45,
              pointerEvents: "none",
            }}
          />
        </div>

        {/* ---- CONTENT ---- */}
        <div className="relative z-10 flex flex-col items-center justify-center px-6 pt-20 text-center max-w-xl w-full">
          {/* LOADING STATE */}
          {phase === "loading" && (
            <div className="space-y-4 animate-pulse">
              <div className={`text-lg font-[family-name:var(--font-playfair)] ${theme.textMuted}`}>
                Preparing your meditation…
              </div>
              <div className="flex gap-2 justify-center">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${isDarkMode ? "bg-[#9ECDB8]" : "bg-[#4A7C59]"}`}
                    style={{ animation: `gentle-pulse 1.5s ease-in-out ${i * 0.3}s infinite` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* READY STATE */}
          {phase === "ready" && (
            <div className="space-y-8 animate-in fade-in duration-1000">
              <h1
                className={`text-3xl md:text-4xl font-[family-name:var(--font-playfair)] leading-snug ${theme.textMain}`}
              >
                A moment for you
              </h1>
              <p className={`text-sm md:text-base max-w-md mx-auto leading-relaxed ${theme.textMuted}`}>
                Find a comfortable place, take a deep breath, and when you&apos;re ready, press begin.
              </p>
              <div className="flex gap-4 justify-center pt-2">
                <button
                  onClick={startMeditation}
                  className={`px-8 py-3 rounded-2xl text-sm font-medium tracking-wide transition-all duration-300 ${theme.button} shadow-lg hover:shadow-xl hover:cursor-pointer`}
                >
                  Begin
                </button>
                <button
                  onClick={handleFinish}
                  className={`px-8 py-3 rounded-2xl text-sm tracking-wide transition-colors duration-300 ${theme.textMuted} hover:opacity-70 hover:cursor-pointer`}
                >
                  Skip
                </button>
              </div>
            </div>
          )}

          {/* PLAYING STATE */}
          {phase === "playing" && (
            <div className="space-y-16">
              {/* Affirmation text with breathe animation */}
              <div
                key={textKey}
                className={`text-2xl md:text-3xl font-[family-name:var(--font-playfair)] leading-relaxed ${currentIndex === -1 ? "animate-text-breathe-long" : "animate-text-breathe"} ${theme.textMain}`}
              >
                {displayText}
              </div>

              {/* Progress dots */}
              <div className="flex gap-2 justify-center">
                {affirmations.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-700 ${
                      i <= currentIndex
                        ? isDarkMode
                          ? "bg-[#9ECDB8] scale-110"
                          : "bg-[#4A7C59] scale-110"
                        : isDarkMode
                          ? "bg-[#1F3326]"
                          : "bg-[#D8E6DB]"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={handleFinish}
                className={`text-xs tracking-wide underline-offset-4 hover:underline transition-colors ${theme.textMuted} hover:cursor-pointer`}
              >
                End early
              </button>
            </div>
          )}

          {/* DONE STATE */}
          {phase === "done" && (
            <div className="space-y-8 animate-in fade-in duration-1000">
              <h2
                className={`text-2xl md:text-3xl font-[family-name:var(--font-playfair)] ${theme.textMain}`}
              >
                Take this feeling with you
              </h2>
              <p className={`text-sm max-w-sm mx-auto leading-relaxed ${theme.textMuted}`}>
                Whenever you need a moment of calm, you can always come back.
              </p>
              <button
                onClick={handleFinish}
                className={`px-8 py-3 rounded-2xl text-sm font-medium tracking-wide transition-all duration-300 ${theme.button} shadow-lg hover:shadow-xl hover:cursor-pointer`}
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ---- Utility helpers ----
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fadeOutAudio(audio: HTMLAudioElement, durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    const startVol = audio.volume;
    const steps = 20;
    const stepMs = durationMs / steps;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      audio.volume = Math.max(0, startVol * (1 - step / steps));
      if (step >= steps) {
        clearInterval(interval);
        audio.pause();
        resolve();
      }
    }, stepMs);
  });
}
