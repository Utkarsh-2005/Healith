"use client";

interface MeditationOfferModalProps {
  isDarkMode: boolean;
  onAccept: () => void;
  onDecline: () => void;
  isProcessing?: boolean;
}

export default function MeditationOfferModal({
  isDarkMode,
  onAccept,
  onDecline,
  isProcessing = false,
}: MeditationOfferModalProps) {
  const bg = isDarkMode ? "bg-[#0a1410]" : "bg-[#FDFCF8]";
  const border = isDarkMode ? "border-[#1F3326]" : "border-[#D8E6DB]";
  const textMain = isDarkMode ? "text-[#E8F3EE]" : "text-[#2F3E33]";
  const textMuted = isDarkMode ? "text-[#8CA394]" : "text-[#5F7466]";
  const btnPrimary = isDarkMode
    ? "bg-[#2C4A3B] text-[#E8F3EE] hover:bg-[#3A614D]"
    : "bg-[#2C4A3B] text-[#FDFCF8] hover:bg-[#3A5A40]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onDecline}
      />

      {/* Modal */}
      <div
        className={`relative z-10 max-w-md w-full mx-4 rounded-3xl border shadow-2xl p-8 animate-in fade-in zoom-in-95 duration-300 ${bg} ${border}`}
      >
        {/* Decorative glow */}
        <div
          className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 rounded-full pointer-events-none"
          style={{
            background: isDarkMode
              ? "radial-gradient(circle, rgba(158,205,184,0.12) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(74,124,89,0.08) 0%, transparent 70%)",
          }}
        />

        <div className="text-center space-y-5">
          {/* Icon */}
          <div className="flex justify-center">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center ${
                isDarkMode ? "bg-[#1F3326]" : "bg-[#E6F5E9]"
              }`}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={isDarkMode ? "text-[#9ECDB8]" : "text-[#4A7C59]"}
              >
                <circle cx="12" cy="12" r="3" />
                <circle cx="12" cy="12" r="7" opacity="0.5" />
                <circle cx="12" cy="12" r="11" opacity="0.25" />
              </svg>
            </div>
          </div>

          <h2
            className={`text-xl font-[family-name:var(--font-playfair)] font-semibold ${textMain}`}
          >
            A moment of calm
          </h2>

          <p className={`text-sm leading-relaxed ${textMuted}`}>
            We&apos;ve prepared a guided meditation with personalized affirmations
            based on your session. It only takes a couple of minutes.
          </p>

          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={onAccept}
              disabled={isProcessing}
              className={`w-full px-6 py-3 rounded-2xl text-sm font-medium tracking-wide transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-60 ${btnPrimary}`}
            >
              {isProcessing ? "Preparing…" : "Begin meditation"}
            </button>
            <button
              onClick={onDecline}
              disabled={isProcessing}
              className={`w-full px-6 py-3 rounded-2xl text-sm tracking-wide transition-colors duration-300 disabled:opacity-60 ${textMuted} hover:opacity-70`}
            >
              {isProcessing ? "Ending session…" : "Skip for now"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
