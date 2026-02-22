"use client";

import { useState, useEffect } from "react";

interface DisclaimerProps {
  isDarkMode: boolean;
}

export default function Disclaimer({ isDarkMode }: DisclaimerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem("healith-disclaimer-accepted");
    if (!accepted) {
      setIsVisible(true);
    }
  }, []);

  function handleAccept() {
    localStorage.setItem("healith-disclaimer-accepted", "true");
    setIsVisible(false);
  }

  if (!isVisible) return null;

  const bgOverlay = isDarkMode ? "bg-black/70" : "bg-black/50";
  const cardBg = isDarkMode ? "bg-[#0f1a14] border-[#1F3326]" : "bg-white border-[#D8E6DB]";
  const textMain = isDarkMode ? "text-[#E8F3EE]" : "text-[#2F3E33]";
  const textMuted = isDarkMode ? "text-[#9ECDB8]" : "text-[#5A6B5D]";
  const buttonBg = isDarkMode ? "bg-[#3C6E51] hover:bg-[#4A8563]" : "bg-[#4A7C59] hover:bg-[#3C6E51]";

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 ${bgOverlay}`}>
      <div className={`max-w-md w-full rounded-2xl border p-6 shadow-2xl ${cardBg}`}>
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${isDarkMode ? "bg-[#1F3326]" : "bg-[#E6F5E9]"}`}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={isDarkMode ? "text-[#9ECDB8]" : "text-[#4A7C59]"}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M12 8v4"/>
              <path d="M12 16h.01"/>
            </svg>
          </div>
          <h2 className={`text-xl font-semibold font-[family-name:var(--font-playfair)] ${textMain}`}>
            Before We Begin
          </h2>
        </div>

        <div className={`space-y-3 text-sm ${textMuted}`}>
          <p className="flex items-start gap-2">
            <span className="text-amber-500 flex-shrink-0 mt-0.5">•</span>
            <span>Healith is an <strong>AI wellness companion</strong>, not a licensed therapist or medical professional.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-amber-500 flex-shrink-0 mt-0.5">•</span>
            <span>This service <strong>cannot diagnose</strong> mental health conditions or provide medical advice.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-amber-500 flex-shrink-0 mt-0.5">•</span>
            <span>If you are in <strong>crisis or experiencing a mental health emergency</strong>, please contact emergency services or a crisis helpline.</span>
          </p>
          <p className="flex items-start gap-2">
            <span className="text-amber-500 flex-shrink-0 mt-0.5">•</span>
            <span>Healith is designed for <strong>self-reflection and personal growth</strong>, not as a replacement for professional care.</span>
          </p>
        </div>

        <div className={`mt-6 p-3 rounded-lg text-xs ${isDarkMode ? "bg-[#1F3326]/50" : "bg-[#F5F9F6]"} ${textMuted}`}>
          By continuing, you acknowledge that you have read and understood these limitations.
        </div>

        <button
          onClick={handleAccept}
          className={`w-full mt-6 py-3 px-4 rounded-xl text-white font-medium transition-colors ${buttonBg}`}
        >
          I Understand, Continue
        </button>
      </div>
    </div>
  );
}
