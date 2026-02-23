"use client";

import { useState, useRef, useEffect } from "react";
import { useTheme } from "@/app/context/ThemeContext";
import type { CompanionStyle } from "@/models/user";

const LUA_VIDEO_URL =
  "https://res.cloudinary.com/dcpgejete/video/upload/v1771858264/Lua_qjh3r6.mp4";
const LEON_VIDEO_URL =
  "https://res.cloudinary.com/dcpgejete/video/upload/v1771858313/Leon_ya2vys.mp4";

const LUA_TAGS = ["Empathetic", "Gentle", "Reflective"] as const;
const LEON_TAGS = ["Grounded", "Structured", "Strategic"] as const;

interface CompanionSelectModalProps {
  /** If true the modal headline reads "Choose" (first-time), otherwise "Change". */
  isFirstTime?: boolean;
  /** Pre-select the currently active companion when opening from settings. */
  initialSelected?: CompanionStyle | null;
  onSelect: (companion: CompanionStyle) => void | Promise<void>;
}

export default function CompanionSelectModal({
  isFirstTime = true,
  initialSelected = null,
  onSelect,
}: CompanionSelectModalProps) {
  const { isDarkMode, theme } = useTheme();
  const [selected, setSelected] = useState<CompanionStyle | null>(initialSelected ?? null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const luaVideoRef = useRef<HTMLVideoElement>(null);
  const leonVideoRef = useRef<HTMLVideoElement>(null);

  // Ensure videos autoplay
  useEffect(() => {
    luaVideoRef.current?.play().catch(() => {});
    leonVideoRef.current?.play().catch(() => {});
  }, []);

  async function handleConfirm() {
    if (!selected || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSelect(selected);
    } finally {
      setIsSubmitting(false);
    }
  }

  const cardBase = `relative flex flex-col items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer select-none`;
  const cardIdle = isDarkMode
    ? "border-[#1F3326] bg-[#0a1410]/60 hover:border-[#3A614D]"
    : "border-[#D8E6DB] bg-[#F7FAF8]/80 hover:border-[#2C5542]";
  const cardActive = isDarkMode
    ? "border-[#4A9D6E] bg-[#0f1f17] ring-1 ring-[#4A9D6E]/30"
    : "border-[#2C5542] bg-[#E6F5E9] ring-1 ring-[#2C5542]/20";

  const tagBase = `text-[10px] font-sans tracking-widest uppercase px-2.5 py-1 rounded-full`;
  const tagIdle = isDarkMode
    ? "bg-[#1F3326] text-[#8CA394]"
    : "bg-[#EAF2EC] text-[#5F7466]";
  const tagActive = isDarkMode
    ? "bg-[#1F4433] text-[#9ECDB8]"
    : "bg-[#D0E8D6] text-[#2C5542]";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        className={`${
          isDarkMode ? "bg-[#0a1410] border-[#1F3326]" : "bg-white border-[#D8E6DB]"
        } border rounded-2xl p-6 sm:p-8 shadow-2xl max-w-lg w-full animate-in fade-in zoom-in-95 duration-300`}
      >
        {/* Header */}
        <div className="text-center mb-6">
          <h2
            className={`text-xl font-semibold mb-2 font-[family-name:var(--font-playfair)] ${theme.textMain}`}
          >
            {isFirstTime ? "Choose Your Companion" : "Change Companion Style"}
          </h2>
          <p className={`text-sm ${theme.textMuted}`}>
            Your companion shapes the tone and personality of your conversations.
            <br />
            <span className="opacity-70">You can change this at any time in settings.</span>
          </p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* ---- LUA ---- */}
          <button
            type="button"
            onClick={() => setSelected("lua")}
            className={`${cardBase} ${selected === "lua" ? cardActive : cardIdle}`}
          >
            {/* Circular video avatar */}
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-inherit shrink-0">
              <video
                ref={luaVideoRef}
                src={LUA_VIDEO_URL}
                muted
                loop
                playsInline
                autoPlay
                className="w-full h-full object-cover scale-[1.35]"
              />
            </div>

            <div className="text-center">
              <div className={`text-lg font-semibold font-[family-name:var(--font-playfair)] ${theme.textMain}`}>
                Lua
              </div>
              <div className={`text-[11px] mt-0.5 ${theme.textMuted}`}>Feminine</div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {LUA_TAGS.map((t) => (
                <span
                  key={t}
                  className={`${tagBase} ${selected === "lua" ? tagActive : tagIdle}`}
                >
                  {t}
                </span>
              ))}
            </div>
          </button>

          {/* ---- LEON ---- */}
          <button
            type="button"
            onClick={() => setSelected("leon")}
            className={`${cardBase} ${selected === "leon" ? cardActive : cardIdle}`}
          >
            {/* Circular video avatar */}
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-inherit shrink-0">
              <video
                ref={leonVideoRef}
                src={LEON_VIDEO_URL}
                muted
                loop
                playsInline
                autoPlay
                className="w-full h-full object-cover scale-[1.35]"
              />
            </div>

            <div className="text-center">
              <div className={`text-lg font-semibold font-[family-name:var(--font-playfair)] ${theme.textMain}`}>
                Leon
              </div>
              <div className={`text-[11px] mt-0.5 ${theme.textMuted}`}>Masculine</div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {LEON_TAGS.map((t) => (
                <span
                  key={t}
                  className={`${tagBase} ${selected === "leon" ? tagActive : tagIdle}`}
                >
                  {t}
                </span>
              ))}
            </div>
          </button>
        </div>

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={!selected || isSubmitting}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${theme.button} disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer`}
        >
          {isSubmitting
            ? "Saving…"
            : selected
            ? `Continue with ${selected === "lua" ? "Lua" : "Leon"}`
            : "Select a companion"}
        </button>
      </div>
    </div>
  );
}
