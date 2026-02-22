/**
 * Client-side encryption utilities using Web Crypto API
 * Zero-knowledge encryption: keys derived from user passphrase, never sent to server
 */

// Generate a random salt for key derivation
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  return bufferToBase64(salt);
}

// Derive an AES-GCM key from passphrase using PBKDF2
export async function deriveKey(passphrase: string, saltBase64: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const salt = base64ToBuffer(saltBase64);
  
  // Import passphrase as key material
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveBits", "deriveKey"]
  );
  
  // Derive AES-GCM key using PBKDF2
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000, // High iteration count for security
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false, // Not extractable
    ["encrypt", "decrypt"]
  );
}

// Generate a verification hash to check if passphrase is correct
export async function generateVerificationHash(passphrase: string, saltBase64: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = base64ToBuffer(saltBase64);
  
  // Use a different derivation for verification (append "verify" to salt)
  const verifySalt = new Uint8Array(salt.length + 6);
  verifySalt.set(salt);
  verifySalt.set(encoder.encode("verify"), salt.length);
  
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveBits"]
  );
  
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: verifySalt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256
  );
  
  return bufferToBase64(new Uint8Array(bits));
}

// Encrypt plaintext using AES-GCM
export async function encrypt(plaintext: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(plaintext)
  );
  
  // Combine IV + ciphertext and encode as base64
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  
  return bufferToBase64(combined);
}

// Decrypt ciphertext using AES-GCM
export async function decrypt(encryptedBase64: string, key: CryptoKey): Promise<string> {
  const decoder = new TextDecoder();
  const combined = base64ToBuffer(encryptedBase64);
  
  // Extract IV (first 12 bytes) and ciphertext
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  
  return decoder.decode(plaintext);
}

// Encrypt an array of messages
export async function encryptMessages(
  messages: Array<{ role: string; content: string }>,
  key: CryptoKey
): Promise<string> {
  const json = JSON.stringify(messages);
  return encrypt(json, key);
}

// Decrypt an array of messages
export async function decryptMessages(
  encryptedBase64: string,
  key: CryptoKey
): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  if (!encryptedBase64) return [];
  try {
    const json = await decrypt(encryptedBase64, key);
    const parsed = JSON.parse(json) as Array<{ role: string; content: string }>;
    return parsed.map(m => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    }));
  } catch {
    console.error("Failed to decrypt messages");
    return [];
  }
}

// Helper: Convert Uint8Array to base64 string
function bufferToBase64(buffer: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < buffer.length; i++) {
    binary += String.fromCharCode(buffer[i]);
  }
  return btoa(binary);
}

// Helper: Convert base64 string to Uint8Array
function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
}
