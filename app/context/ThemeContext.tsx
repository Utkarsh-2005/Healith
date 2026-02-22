"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Theme = {
  bg: string;
  textMain: string;
  textMuted: string;
  blobBlend: string;
  blob1: string;
  blob2: string;
  blob3: string;
  button: string;
  headerBg: string;
  userBubble: string;
  aiBubble: string;
  inputBg: string;
  inputGradient: string;
  inputText: string;
};

interface ThemeContextType {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: Theme;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("healith-theme");
    if (saved === "dark") {
      setIsDarkMode(true);
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("healith-theme", isDarkMode ? "dark" : "light");
    }
  }, [isDarkMode, mounted]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const theme: Theme = {
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
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
