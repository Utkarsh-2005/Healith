"use client";

import { useState, useRef, useEffect } from "react";
import { useEncryption } from "@/app/context/EncryptionContext";
import { useTheme } from "@/app/context/ThemeContext";

const PIN_LENGTH = 6;

interface PinModalProps {
  onSuccess?: () => void;
}

export default function PassphraseModal({ onSuccess }: PinModalProps) {
  const { needsSetup, unlock, setup, isLoading } = useEncryption();
  const { isDarkMode, theme } = useTheme();

  const [pin, setPin] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [confirmPin, setConfirmPin] = useState<string[]>(Array(PIN_LENGTH).fill(""));
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    if (!isLoading) {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isLoading]);

  const handleDigitChange = (
    index: number,
    value: string,
    target: "pin" | "confirm"
  ) => {
    if (!/^\d*$/.test(value)) return; // digits only

    const digit = value.slice(-1); // take last char in case of paste
    const setter = target === "pin" ? setPin : setConfirmPin;
    const refs = target === "pin" ? inputRefs : confirmRefs;

    setter((prev) => {
      const next = [...prev];
      next[index] = digit;
      return next;
    });

    // Auto-advance to next input
    if (digit && index < PIN_LENGTH - 1) {
      refs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    index: number,
    e: React.KeyboardEvent<HTMLInputElement>,
    target: "pin" | "confirm"
  ) => {
    const current = target === "pin" ? pin : confirmPin;
    const refs = target === "pin" ? inputRefs : confirmRefs;

    if (e.key === "Backspace" && !current[index] && index > 0) {
      refs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
    target: "pin" | "confirm"
  ) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, PIN_LENGTH);
    if (!pasted) return;

    const setter = target === "pin" ? setPin : setConfirmPin;
    const refs = target === "pin" ? inputRefs : confirmRefs;

    const newArr = Array(PIN_LENGTH).fill("");
    for (let i = 0; i < pasted.length; i++) newArr[i] = pasted[i];
    setter(newArr);

    const focusIdx = Math.min(pasted.length, PIN_LENGTH - 1);
    refs.current[focusIdx]?.focus();
  };

  const pinString = pin.join("");
  const confirmPinString = confirmPin.join("");
  const isPinComplete = pinString.length === PIN_LENGTH;
  const isConfirmComplete = confirmPinString.length === PIN_LENGTH;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isPinComplete) return;

    if (needsSetup) {
      if (!isConfirming) {
        // Move to confirm step
        setIsConfirming(true);
        setTimeout(() => confirmRefs.current[0]?.focus(), 100);
        return;
      }

      if (!isConfirmComplete) return;

      if (pinString !== confirmPinString) {
        setError("PINs do not match");
        setConfirmPin(Array(PIN_LENGTH).fill(""));
        setTimeout(() => confirmRefs.current[0]?.focus(), 100);
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await setup(pinString);
        if (result.success) {
          onSuccess?.();
        } else {
          setError(result.error || "Failed to set up encryption");
        }
      } catch {
        setError("An unexpected error occurred");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(true);
      try {
        const result = await unlock(pinString);
        if (result.success) {
          onSuccess?.();
        } else {
          setError(result.error || "Incorrect PIN");
          setPin(Array(PIN_LENGTH).fill(""));
          setTimeout(() => inputRefs.current[0]?.focus(), 100);
        }
      } catch {
        setError("An unexpected error occurred");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const renderPinInputs = (
    values: string[],
    refs: React.MutableRefObject<(HTMLInputElement | null)[]>,
    target: "pin" | "confirm"
  ) => (
    <div className="flex justify-center gap-1.5 xs:gap-2 sm:gap-3">
      {values.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleDigitChange(i, e.target.value, target)}
          onKeyDown={(e) => handleKeyDown(i, e, target)}
          onPaste={(e) => handlePaste(e, target)}
          disabled={isSubmitting}
          className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-mono rounded-lg sm:rounded-xl border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#2C5542]/50 ${
            isDarkMode
              ? "bg-[#0f1a14] border-[#1F3326] text-[#E8F3EE] focus:border-[#3A614D]"
              : "bg-white border-[#D8E6DB] text-[#1A2E22] focus:border-[#2C5542]"
          } ${digit ? (isDarkMode ? "border-[#3A614D]" : "border-[#2C5542]") : ""}`}
        />
      ))}
    </div>
  );

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className={`${isDarkMode ? "bg-[#0a1410]" : "bg-white"} rounded-2xl p-8 shadow-2xl`}>
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${isDarkMode ? "bg-[#1F4433]" : "bg-[#2C5542]"}`} />
            <p className={theme.textMuted}>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className={`${isDarkMode ? "bg-[#0a1410] border-[#1F3326]" : "bg-white border-[#D8E6DB]"} border rounded-2xl p-6 sm:p-8 shadow-2xl max-w-sm w-full`}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDarkMode ? "bg-[#1F4433]" : "bg-[#E6F5E9]"}`}>
            <svg className={`w-8 h-8 ${isDarkMode ? "text-[#8CA394]" : "text-[#2C5542]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h2 className={`text-xl font-semibold mb-2 ${theme.textMain}`}>
            {needsSetup
              ? isConfirming ? "Confirm Your PIN" : "Create Your PIN"
              : "Enter Your PIN"}
          </h2>

          <p className={`text-sm ${theme.textMuted}`}>
            {needsSetup
              ? isConfirming
                ? "Re-enter your 6-digit PIN to confirm."
                : "Choose a 6-digit PIN to encrypt your conversations."
              : "Enter your 6-digit PIN to access your conversations."}
          </p>
        </div>

        {/* Warning for new setup */}
        {needsSetup && !isConfirming && (
          <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? "bg-[#1a0f0a] border-[#3d2a1f]" : "bg-[#FFF8E6] border-[#E6D5A8]"} border`}>
            <p className={`text-sm ${isDarkMode ? "text-[#e68a8a]" : "text-[#8b1414]"} text-center`}>
              <strong>Important:</strong> If you forget your PIN, your data <strong>Cannot</strong> be recovered.<br></br> There is   <strong>No Reset Option!</strong>
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PIN input or Confirm input */}
          {needsSetup && isConfirming
            ? renderPinInputs(confirmPin, confirmRefs, "confirm")
            : renderPinInputs(pin, inputRefs, "pin")}

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={
              isSubmitting ||
              (needsSetup && isConfirming ? !isConfirmComplete : !isPinComplete)
            }
            className={`w-full py-3 px-4 rounded-lg font-medium transition-all ${theme.button} disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer`}
          >
            {isSubmitting
              ? "Processing..."
              : needsSetup
                ? isConfirming ? "Set Up Encryption" : "Continue"
                : "Unlock"}
          </button>

          {/* Back button during confirm step */}
          {needsSetup && isConfirming && (
            <button
              type="button"
              onClick={() => {
                setIsConfirming(false);
                setConfirmPin(Array(PIN_LENGTH).fill(""));
                setError("");
                setTimeout(() => inputRefs.current[0]?.focus(), 100);
              }}
              className={`w-full text-sm ${theme.textMuted} hover:underline`}
            >
              Go back
            </button>
          )}
        </form>

        {/* Footer info */}
        <p className={`mt-6 text-xs text-center ${theme.textMuted}`}>
          Your PIN never leaves your device. All encryption happens locally in your browser.
        </p>
      </div>
    </div>
  );
}
