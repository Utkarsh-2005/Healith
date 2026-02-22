"use client";

import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { EncryptionProvider, useEncryption } from "../context/EncryptionContext";
import PassphraseModal from "../components/PassphraseModal";

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
  const { isUnlocked, isLoading } = useEncryption();
  
  // Show passphrase modal if not unlocked
  if (!isUnlocked && !isLoading) {
    return <PassphraseModal />;
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
