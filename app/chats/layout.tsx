"use client";

import { useState, useEffect, useCallback } from "react";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { EncryptionProvider, useEncryption } from "../context/EncryptionContext";
import PassphraseModal from "../components/PassphraseModal";
import CompanionSelectModal from "../components/CompanionSelectModal";
import { getCompanion, setCompanion as setCompanionAction } from "../actions";
import type { CompanionStyle } from "@/models/user";

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
  .animate-float { animation: float 20s infinite ease-in-out; }
  .animate-float-delayed { animation: float-delayed 25s infinite ease-in-out; }
`;

function EncryptionGate({ children }: { children: React.ReactNode }) {
  const { isUnlocked, isLoading, needsSetup } = useEncryption();
  const [companion, setCompanion] = useState<CompanionStyle | null | undefined>(undefined); // undefined = loading
  const [showCompanionModal, setShowCompanionModal] = useState(false);

  // After unlock, check if user has a companion selected
  const checkCompanion = useCallback(async () => {
    try {
      const c = await getCompanion();
      setCompanion(c);
      if (!c) setShowCompanionModal(true);
    } catch {
      setCompanion(null);
      setShowCompanionModal(true);
    }
  }, []);

  useEffect(() => {
    if (isUnlocked) {
      checkCompanion();
    }
  }, [isUnlocked, checkCompanion]);

  // Show passphrase modal if not unlocked
  if (!isUnlocked && !isLoading) {
    return (
      <PassphraseModal
        onSuccess={() => {
          // After PIN success, checkCompanion will run via the isUnlocked effect
        }}
      />
    );
  }

  // Show companion selection modal if no companion set (first time or backward compat)
  if (isUnlocked && showCompanionModal) {
    return (
      <CompanionSelectModal
        isFirstTime={!companion}
        onSelect={async (c: CompanionStyle) => {
          await setCompanionAction(c);
          setCompanion(c);
          setShowCompanionModal(false);
        }}
      />
    );
  }
  
  return <>{children}</>;
}

function ChatsLayoutInner({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme();

  return (
    <>
      <style>{styleTag}</style>
      <div className={`relative flex min-h-screen flex-col font-serif transition-colors duration-1000 overflow-hidden ${theme.bg} ${theme.textMain}`}>
        {/* Background Ambience */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-colors duration-1000">
          <div className={`absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full filter blur-[80px] animate-float transition-all duration-1000 ${theme.blob1} ${theme.blobBlend}`} />
          <div className={`absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full filter blur-[80px] animate-float-delayed transition-all duration-1000 ${theme.blob2} ${theme.blobBlend}`} />
          <div className={`absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full filter blur-[60px] animate-float transition-all duration-1000 ${theme.blob3} ${theme.blobBlend}`} style={{ animationDuration: '30s' }} />
        </div>

        <EncryptionGate>{children}</EncryptionGate>
      </div>
    </>
  );
}

export default function ChatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <EncryptionProvider>
        <ChatsLayoutInner>{children}</ChatsLayoutInner>
      </EncryptionProvider>
    </ThemeProvider>
  );
}
