"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import LandingPage from "./components/LandingPage";
import Disclaimer from "./components/Disclaimer";

// --- STYLES FOR ANIMATIONS ---
const styleTag = `
  @keyframes float {
    0% { transform: translate(0px, 0px) scale(1); }
    33% { transform: translate(30px, -50px) scale(1.1); }
    66% { transform: translate(-20px, 20px) scale(0.9); }
    100% { transform: translate(0px, 0px) scale(1); }
  }
  @keyframes float-delayed {
    0% { transform: translate(0px, 0px) scale(1); }
    33% { transform: translate(-30px, 50px) scale(1.2); }
    66% { transform: translate(20px, -20px) scale(0.8); }
    100% { transform: translate(0px, 0px) scale(1); }
  }
  @keyframes ripple-expand {
    0% { transform: scale(1); opacity: 1; }
    100% { transform: scale(50); opacity: 0; }
  }
  .animate-float { animation: float 20s infinite ease-in-out; }
  .animate-float-delayed { animation: float-delayed 25s infinite ease-in-out; }
  .animate-ripple { animation: ripple-expand 1.2s forwards ease-in-out; }
`;

export default function Home() {
  const router = useRouter();
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Transition States
  const [isEntering, setIsEntering] = useState(false);
  
  const enterAudioRef = useRef<HTMLAudioElement | null>(null);

  // Load theme preference and sound preference from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("healith-theme");
    if (savedTheme === "dark") {
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    enterAudioRef.current = new Audio('/angelic.mp3');
    enterAudioRef.current.load();
    return () => {
      enterAudioRef.current = null;
    };
  }, []);

  async function handleStart() {
    if (isEntering) return;
    try { await enterAudioRef.current?.play(); } catch {}
    setIsEntering(true);
    
    // Wait for animation, then redirect to /chats/new
    setTimeout(() => {
      router.push("/chats/new");
    }, 1000);
  }

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("healith-theme", newMode ? "dark" : "light");
  };

  // --- COLORS & THEME TOKENS ---
  const theme = {
    bg: isDarkMode ? "bg-[#050a07]" : "bg-[#FDFCF8]",
    textMain: isDarkMode ? "text-[#E8F3EE]" : "text-[#2F3E33]",
    textMuted: isDarkMode ? "text-[#8CA394]" : "text-[#5F7466]",
    blobBlend: isDarkMode ? "mix-blend-screen opacity-20" : "mix-blend-multiply opacity-30",
    blob1: isDarkMode ? "bg-[#1F4433]" : "bg-[#2C5542]",
    blob2: isDarkMode ? "bg-[#2C5542]" : "bg-[#1F4433]",
    blob3: isDarkMode ? "bg-[#143326]" : "bg-[#3A614D]",
    button: isDarkMode ? "bg-[#2C4A3B] text-[#E8F3EE] hover:bg-[#3A614D]" : "bg-[#2C4A3B] text-[#FDFCF8] hover:bg-[#3A5A40]",
    headerBg: isDarkMode ? "bg-[#050a07]/70 border-[#1F3326]" : "bg-[#FDFCF8]/70 border-[#D8E6DB]",
    userBubble: isDarkMode ? "bg-[#161a24] text-[#E8F3EE] border-[#1F3326]" : "bg-[#EAF2EC] text-[#1A2E22] border-[#D8E6DB]",
    aiBubble: isDarkMode ? "bg-[#13241C] text-[#E8F3EE] border-[#1F3326]" : "bg-[#E6F5E9] text-[#1A2E22] border-[#CDE7D6]",
    inputBg: isDarkMode ? "bg-[#050a07]/80 border-[#1F3326]" : "bg-white/80 border-[#D8E6DB]",
    inputGradient: isDarkMode ? "from-[#050a07] via-[#050a07]" : "from-[#FDFCF8] via-[#FDFCF8]",
    inputText: isDarkMode ? "text-[#E8F3EE] placeholder:text-[#4A6356]" : "text-[#1A2E22] placeholder:text-[#8CA394]",
  };

  return (
    <>
      <style>{styleTag}</style>
      
      {/* Disclaimer Modal */}
      <Disclaimer isDarkMode={isDarkMode} />
      
      <div className={`relative flex min-h-screen flex-col font-serif transition-colors duration-1000 overflow-hidden ${theme.bg} ${theme.textMain}`}>
        
        {/* --- BACKGROUND AMBIENCE --- */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-colors duration-1000">
          <div className={`absolute rounded-full filter blur-[80px] animate-float transition-all duration-1000 ${theme.blob1} ${theme.blobBlend} ${isDarkMode ? 'top-[-10%] left-[-10%] w-[500px] h-[500px]' : 'top-[-18%] left-[-16%] w-[420px] h-[420px]'}`} />
          <div className={`absolute rounded-full filter blur-[80px] animate-float-delayed transition-all duration-1000 ${theme.blob2} ${theme.blobBlend} ${isDarkMode ? 'bottom-[-10%] right-[-10%] w-[600px] h-[600px]' : 'bottom-[-18%] right-[-14%] w-[500px] h-[500px]'}`} />
          <div className={`absolute rounded-full filter blur-[60px] animate-float transition-all duration-1000 ${theme.blob3} ${theme.blobBlend} ${isDarkMode ? 'top-[40%] left-[30%] w-[400px] h-[400px]' : 'top-[65%] left-[70%] w-[350px] h-[350px]'}`} style={{ animationDuration: '30s' }} />
        </div>

        {/* --- LANDING PAGE --- */}
        <LandingPage 
          onEnter={handleStart} 
          isEntering={isEntering} 
          theme={theme}
          isDarkMode={isDarkMode}
          onToggleTheme={toggleTheme}
        />
      </div>
    </>
  );
}