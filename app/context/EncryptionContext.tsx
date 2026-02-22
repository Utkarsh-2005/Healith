"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { deriveKey, generateSalt, generateVerificationHash } from "@/lib/encryption";
import { getEncryptionData, setupEncryption, verifyPassphrase } from "@/app/actions";

interface EncryptionContextType {
  isUnlocked: boolean;
  isLoading: boolean;
  needsSetup: boolean;
  encryptionKey: CryptoKey | null;
  unlock: (pin: string) => Promise<{ success: boolean; error?: string }>;
  setup: (pin: string) => Promise<{ success: boolean; error?: string }>;
  lock: () => void;
  checkStatus: () => Promise<void>;
}

const EncryptionContext = createContext<EncryptionContextType | null>(null);

export function EncryptionProvider({ children }: { children: React.ReactNode }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState<CryptoKey | null>(null);
  const [salt, setSalt] = useState<string | null>(null);

  // Check if user has encryption set up
  const checkStatus = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getEncryptionData();
      if (data.hasEncryption && data.salt) {
        setSalt(data.salt);
        setNeedsSetup(false);
        // PIN must be entered every time the site is opened — no auto-unlock
      } else {
        setNeedsSetup(true);
      }
    } catch (error) {
      console.error("Failed to check encryption status:", error);
      setNeedsSetup(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set up encryption with a new PIN
  const setup = useCallback(async (pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const newSalt = generateSalt();
      const verificationHash = await generateVerificationHash(pin, newSalt);

      await setupEncryption({ salt: newSalt, verificationHash });

      const key = await deriveKey(pin, newSalt);
      setEncryptionKey(key);
      setSalt(newSalt);
      setNeedsSetup(false);
      setIsUnlocked(true);

      return { success: true };
    } catch (error) {
      console.error("Failed to set up encryption:", error);
      return { success: false, error: "Failed to set up encryption" };
    }
  }, []);

  // Unlock with existing PIN
  const unlock = useCallback(async (pin: string): Promise<{ success: boolean; error?: string }> => {
    if (!salt) {
      return { success: false, error: "No encryption data found" };
    }

    try {
      const verificationHash = await generateVerificationHash(pin, salt);
      const isValid = await verifyPassphrase(verificationHash);
      if (!isValid) {
        return { success: false, error: "Incorrect PIN" };
      }

      const key = await deriveKey(pin, salt);
      setEncryptionKey(key);
      setIsUnlocked(true);

      return { success: true };
    } catch (error) {
      console.error("Failed to unlock:", error);
      return { success: false, error: "Failed to unlock" };
    }
  }, [salt]);

  // Lock (clear key from memory)
  const lock = useCallback(() => {
    setEncryptionKey(null);
    setIsUnlocked(false);
  }, []);

  // Check status on mount
  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return (
    <EncryptionContext.Provider
      value={{ isUnlocked, isLoading, needsSetup, encryptionKey, unlock, setup, lock, checkStatus }}
    >
      {children}
    </EncryptionContext.Provider>
  );
}

export function useEncryption() {
  const context = useContext(EncryptionContext);
  if (!context) throw new Error("useEncryption must be used within an EncryptionProvider");
  return context;
}
