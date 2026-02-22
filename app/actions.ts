"use server";

import { connectDB } from "@/lib/db";
import { buildPrompt, ChatMessage } from "@/lib/prompt";
import { detectCrisis, getCrisisResponseAddendum } from "@/lib/crisis-detection";
import { LongTermMemory } from "@/models/longTermMemory";
import { Session } from "@/models/session";
import { User } from "@/models/user";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Types } from "mongoose";
import { auth, currentUser } from "@clerk/nextjs/server";

// ============================================
// AI PROVIDER CONFIGURATION
// ============================================
// Switch provider: "g" = Gemini, "s" = Sarvam
// Change AI_PROVIDER to swap the default for all AI calls.
export type AIProvider = "g" | "s";
const AI_PROVIDER: AIProvider = "s";

const geminiModelName = "gemini-2.5-flash-lite";
const sarvamModelName = "sarvam-m";
const sarvamApiUrl = "https://api.sarvam.ai/v1/chat/completions";

// ---------- Gemini helpers (unchanged) ----------

async function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY in environment");
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: geminiModelName });
}

// ---------- Sarvam helpers ----------

async function callSarvam(
  messages: Array<{ role: string; content: string }>,
): Promise<string> {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) throw new Error("Missing SARVAM_API_KEY in environment");

  const response = await fetch(sarvamApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: sarvamModelName,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Sarvam API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();
  return result.choices[0].message.content;
}

/**
 * Convert a flat prompt string into structured chat-completion messages
 * for Sarvam.
 *
 * • If the prompt contains "Current messages:" (from buildPrompt),
 *   everything before it becomes the system message and the
 *   USER:/ASSISTANT: lines become proper turns.
 * • Otherwise the whole prompt is sent as a single user message
 *   (used for summary / memory-extraction prompts).
 */
function promptToSarvamMessages(
  prompt: string,
): Array<{ role: string; content: string }> {
  const marker = "Current messages:";
  const idx = prompt.indexOf(marker);

  if (idx === -1) {
    // Simple instruction prompt (summary, memory, etc.)
    return [{ role: "user", content: prompt }];
  }

  const systemPart = prompt.slice(0, idx).trim();
  const messagesPart = prompt.slice(idx + marker.length).trim();

  const result: Array<{ role: string; content: string }> = [
    { role: "system", content: systemPart },
  ];

  // Find every USER: / ASSISTANT: marker at the start of a line
  const turnRegex = /^(USER|ASSISTANT): /gm;
  const matches: Array<{ role: string; index: number; prefixLen: number }> = [];
  let m;
  while ((m = turnRegex.exec(messagesPart)) !== null) {
    matches.push({
      role: m[1] === "USER" ? "user" : "assistant",
      index: m.index,
      prefixLen: m[0].length,
    });
  }

  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i].prefixLen;
    const end =
      i + 1 < matches.length ? matches[i + 1].index : messagesPart.length;
    const content = messagesPart.slice(start, end).trim();
    if (content) {
      result.push({ role: matches[i].role, content });
    }
  }

  // Sarvam requires the first non-system message to be "user".
  // If the conversation starts with assistant (the initial greeting),
  // fold those leading assistant messages into the system message.
  while (result.length > 1 && result[1].role === "assistant") {
    const removed = result.splice(1, 1)[0];
    result[0].content += "\n\nYour opening message was: " + removed.content;
  }

  return result;
}

// ---------- Unified generation entry-point ----------

async function generateText(
  prompt: string,
  provider: AIProvider = AI_PROVIDER,
): Promise<string> {
  if (provider === "g") {
    const model = await getGeminiModel();
    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  // Sarvam: convert the flat prompt into structured messages
  const messages = promptToSarvamMessages(prompt);
  return callSarvam(messages);
}

export async function getAuthenticatedUser() {
  await connectDB();
  
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("User not authenticated");
  
  let user = await User.findOne({ clerkId });
  
  if (!user) {
    const clerkUser = await currentUser();
    
    user = await User.create({
      clerkId,
      email: clerkUser?.emailAddresses?.[0]?.emailAddress,
      name: clerkUser?.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}`.trim() : undefined,
    });
  }
  
  return user;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await connectDB();
  await Session.deleteOne({ _id: sessionId });
}

export async function startSession() {
  const user = await getAuthenticatedUser();
  
  // Clean up abandoned sessions (not ended, no encrypted messages, fewer than 4 stored messages)
  await Session.deleteMany({
    userId: user._id,
    endedAt: { $eq: null },
    encryptedMessages: { $in: [null, undefined] },
    $expr: { $lt: [{ $size: { $ifNull: ["$messages", []] } }, 4] },
  });
  
  const count = await Session.countDocuments({ userId: user._id });
  const sessionNumber = count + 1;
  const sess = await Session.create({ userId: user._id, sessionNumber, startedAt: new Date() });
  const firstName = user.name?.split(" ")[0] || "";
  const initialMessage = getInitialAssistantMessage(sessionNumber, firstName);
  // Persist the initial assistant message so it appears in history
  sess.messages = [{ role: "assistant", content: initialMessage }];
  await sess.save();
  return { sessionId: sess._id.toString(), sessionNumber, initialMessage };
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getInitialAssistantMessage(sessionNumber: number, firstName: string): string {
  const name = firstName || "there";

  const first = [
    `Hello ${name}, welcome! What brings you here today? I'm here to listen and help however I can.`,
    `Hi ${name}, it's nice to meet you! How can I help you today?`,
    `Hey ${name}, welcome aboard. What's on your mind, How can I support you?`,
    `Hello ${name}! I'm glad you're here. What brings you in today?`,
  ];

  const second = [
    `Hey ${name}, good to see you again! How have you been doing since last time?`,
    `Hi ${name}, welcome back. How are you feeling today?`,
    `Hey ${name}, nice to have you back! How's everything been going?`,
    `Hello ${name}, glad you're here again. How have things been since we last talked?`,
  ];

  const third = [
    `Hey ${name}, great to see you again! What brings you here today?`,
    `Hi ${name}, welcome back. What would you like to focus on today?`,
    `Hey ${name}, glad you're back! What's been on your mind lately?`,
    `Hello ${name}, nice to see you again. What feels important to talk about today?`,
  ];

  const standard = [
    `Hey ${name}, how can I help you today?`,
    `Hi ${name}, how have you been?`,
    `Hey ${name}, where would you like to start today?`,
    `Hello ${name}, what's on your mind?`,
  ];

  if (sessionNumber === 1) return pickRandom(first);
  if (sessionNumber === 2) return pickRandom(second);
  if (sessionNumber === 3) return pickRandom(third);
  return pickRandom(standard);
}

export async function sendMessage(params: {
  sessionId: string;
  messages: ChatMessage[]; // ephemeral chat context
  trailingSummaries?: Array<{ sessionNumber: number; summary: string | null }>;
  persistentMemory?: string;
}) {
  await connectDB();
  const session = await Session.findById(params.sessionId);
  if (!session) throw new Error("Session not found");
  
  // Get user's first name for personalisation
  const user = await User.findById(session.userId).lean<{ name?: string } | null>();
  const firstName = user?.name?.split(" ")[0] || "";
  
  // Detect crisis in the latest user message
  const lastUserMessage = params.messages.filter(m => m.role === "user").pop();
  const crisisResult = lastUserMessage ? detectCrisis(lastUserMessage.content) : { level: "none" as const, shouldShowResources: false };
  
  const prompt = await buildPrompt({
    userId: session.userId as Types.ObjectId,
    sessionNumber: session.sessionNumber,
    messages: params.messages,
    clientTrailingSummaries: params.trailingSummaries,
    clientMemory: params.persistentMemory,
    userName: firstName,
  });
  let text = await generateText(prompt);
  
  // Detect agent-initiated session close
  const SESSION_COMPLETE_TAG = "[SESSION_COMPLETE]";
  let agentRequestedClose = false;
  if (text.includes(SESSION_COMPLETE_TAG)) {
    agentRequestedClose = true;
    text = text.replace(SESSION_COMPLETE_TAG, "").trim();
  }
  
  // Append crisis resources if detected
  if (crisisResult.level !== "none") {
    text += getCrisisResponseAddendum(crisisResult.level);
  }
  
  // Messages are not persisted in plaintext — client handles encrypted storage
  
  return { 
    reply: text,
    crisisLevel: crisisResult.level,
    showCrisisResources: crisisResult.shouldShowResources,
    agentRequestedClose,
  };
}

export async function endSession(params: {
  sessionId: string;
  messages: ChatMessage[]; // full session messages (plaintext from client state)
  existingMemory?: string; // client-decrypted existing long-term memory, for merging
}): Promise<{ ok: boolean; summary?: string; intensityScore?: number | null; longTermMemory?: string | null; meditation?: { recommended: boolean; affirmations: string[] } | null }> {
  await connectDB();
  const session = await Session.findById(params.sessionId);
  if (!session) throw new Error("Session not found");
  console.log("Session is ending");

  // Determine if the session should be counted (requires >= 3 user messages)
  const finalMessages = Array.isArray(params.messages) ? params.messages : [];
  const userMessageCount = finalMessages.filter(m => m.role === "user").length;
  if (userMessageCount < 3) {
    // Not a real session: too few user messages. Remove it so it isn't counted.
    await Session.deleteOne({ _id: session._id });
    return { ok: true };
  }

  // Generate session summary
  const summaryPrompt = [
    "Summarize the session for persistent storage.",
    "Include: Key emotions, major events discussed, problems surfaced, and a neutral intensity score (1–5).",
    "Output strictly as raw JSON with keys: summary, intensityScore.",
    "Return only JSON. No markdown code fences, no language labels, no prose, no additional text.",
    "Session messages:",
    ...params.messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`),
  ].join("\n\n");

  const summaryText = await generateText(summaryPrompt);

  let summary = summaryText;
  let intensityScore: number | null = null;
  try {
    const parsed = JSON.parse(extractJson(summaryText));
    summary = parsed.summary ?? summaryText;
    const score = Number(parsed.intensityScore);
    intensityScore = Number.isFinite(score) ? score : null;
  } catch {
    // fallback: keep raw text
  }

  // Mark session as ended (summary + memory will be saved encrypted by client)
  session.endedAt = new Date();
  await session.save();

  // Extract long-term memory paragraph or null
  let longTermMemory: string | null = null;
  const categories = "Childhood, Relationships, Career, MentalHealthPatterns, BehaviorLoops, CopingStrategies, BeliefsAndNarratives, Goals";

  const memoryPrompt = [
    session.sessionNumber <= 3
      ? "From the session messages, write a relevant details and observations about the user, especially if they may influence behaviour. long-term memory capturing stable facts, enduring themes, and patterns."
      : `Determine if anything enduring and relevant emerged in these categories: ${categories}. If nothing substantive for long-term memory, return null. If yes, write a concise paragraph focusing on the enduring info.`,
    "Output strictly as raw JSON: { \"longTermMemory\": string | null }",
    "***Return only JSON. No markdown code fences, no language labels, no prose, no additional text.***",
    "Rules:",
    "- No bullet lists. A single cohesive paragraph only when not null.",
    "- Exclude ephemeral details and momentary phrasing.",
    "- Prefer neutral, non-judgmental tone.",
    "- Memory blocks should be observation and start like 'Person has...'",
    "Session messages:",
    ...params.messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`),
  ].join("\n\n");

  try {
    const memText = await generateText(memoryPrompt);
    console.log("[endSession] Memory raw text:", memText);
    const parsed = JSON.parse(extractJson(memText)) as { longTermMemory: string | null };
    console.log("[endSession] Parsed memory:", parsed);
    const newPiece = (parsed && typeof parsed.longTermMemory !== "undefined") ? parsed.longTermMemory : null;
    if (newPiece && newPiece.trim()) {
      // Merge with existing memory (decrypted by client and passed in)
      const existingContent = params.existingMemory ?? "";
      const combined = (existingContent ? existingContent + "\n\n" : "") + newPiece.trim();

      const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
      longTermMemory = combined;

      if (wordCount(combined) > 500) {
        const summarizePrompt = [
          "You are updating a user's permanent long-term memory.",
          "Goal: produce a single cohesive paragraph of 500 words or fewer.",
          "Keep the most relevant, stable facts, recurring patterns, beliefs, and goals.",
          "Prefer recency when conflicts arise. Remove less relevant or redundant details.",
          "Do not output JSON or lists; output the paragraph only.",
          "Current memory:",
          existingContent,
          "New information:",
          newPiece.trim(),
        ].join("\n\n");

        longTermMemory = (await generateText(summarizePrompt)).trim();
      }
    }
  } catch (err) {
    console.error("[endSession] Memory extraction/summarization failed:", err);
  }

  // ---- Meditation / Positive Reinforcement ----
  // Always recommended for session 1; for later sessions, only if intensity >= 3
  let meditation: { recommended: boolean; affirmations: string[] } | null = null;
  const shouldMeditate = session.sessionNumber === 1 || (intensityScore !== null && intensityScore >= 3);

  if (shouldMeditate) {
    const meditationPrompt = [
      "Based on this wellness session summary, generate 6 short positive-reinforcement affirmations.",
      "Each affirmation should start with 'You are' or 'You have' or 'You deserve'.",
      "Keep them warm, universal, and safe — never reference specific trauma, diagnoses, or sensitive details.",
      "They should be uplifting and grounding, suitable for a calming meditation.",
      "Output strictly as raw JSON: { \"affirmations\": string[] }",
      "***Return only JSON. No markdown code fences, no language labels, no prose.***",
      "Session summary for context:",
      summary ?? "",
    ].join("\n\n");

    try {
      const medText = await generateText(meditationPrompt);
      const parsed = JSON.parse(extractJson(medText)) as { affirmations: string[] };
      if (Array.isArray(parsed.affirmations) && parsed.affirmations.length > 0) {
        meditation = { recommended: true, affirmations: parsed.affirmations };
      }
    } catch (err) {
      console.error("[endSession] Meditation affirmation generation failed:", err);
    }
  }

  // Return generated data for client-side encryption and storage
  return { ok: true, summary, intensityScore, longTermMemory, meditation };
}

export type SessionListItem = {
  id: string;
  sessionNumber: number;
  startedAt: string;
  endedAt: string | null;
  intensityScore: number | null;
  summary: string | null;
};

export async function listSessions(limit = 100): Promise<SessionListItem[]> {
  const user = await getAuthenticatedUser();
  // Include sessions with encrypted messages or legacy sessions with 4+ messages
  const rows = await Session.find({
    userId: user._id,
    $or: [
      { "messages.3": { $exists: true } },
      { encryptedMessages: { $exists: true, $ne: null } }
    ]
  })
    .sort({ sessionNumber: -1 })
    .limit(limit)
    .lean<Array<{ _id: any; sessionNumber: number; startedAt: Date; endedAt?: Date | null; intensityScore?: number | null; summary?: string | null }>>();

  return rows.map((r) => ({
    id: String(r._id),
    sessionNumber: r.sessionNumber,
    startedAt: new Date(r.startedAt).toISOString(),
    endedAt: r.endedAt ? new Date(r.endedAt).toISOString() : null,
    intensityScore: r.intensityScore ?? null,
    summary: r.summary ?? null,
  }));
}

export async function getSessionChat(sessionId: string): Promise<ChatMessage[]> {
  await connectDB();
  const sess = await Session.findById(sessionId).lean<{ messages?: Array<{ role: string; content: string }> } | null>();
  if (!sess?.messages) return [];
  return sess.messages.map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content }));
}

export async function getSessionMeta(sessionId: string): Promise<{ sessionNumber: number; endedAt: string | null } | null> {
  await connectDB();
  const sess = await Session.findById(sessionId).lean<{ sessionNumber: number; endedAt?: Date | null } | null>();
  if (!sess) return null;
  return {
    sessionNumber: sess.sessionNumber,
    endedAt: sess.endedAt ? new Date(sess.endedAt).toISOString() : null,
  };
}

// Helper to safely extract JSON from model outputs that may include code fences or extra text
function extractJson(text: string): string {
  const trimmed = text.trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end >= start) {
    return trimmed.slice(start, end + 1).trim();
  }
  return trimmed;
}

// ============================================
// ENCRYPTION-RELATED SERVER ACTIONS
// ============================================

// Get encryption data (salt) for the current user
export async function getEncryptionData(): Promise<{ hasEncryption: boolean; salt: string | null }> {
  const user = await getAuthenticatedUser();
  return {
    hasEncryption: !!(user.encryptionSalt && user.verificationHash),
    salt: user.encryptionSalt || null,
  };
}

// Set up encryption for a new user
export async function setupEncryption(params: { salt: string; verificationHash: string }): Promise<void> {
  const user = await getAuthenticatedUser();
  
  if (user.encryptionSalt) {
    throw new Error("Encryption already set up for this user");
  }
  
  user.encryptionSalt = params.salt;
  user.verificationHash = params.verificationHash;
  await user.save();
}

// Verify passphrase by checking the verification hash
export async function verifyPassphrase(verificationHash: string): Promise<boolean> {
  const user = await getAuthenticatedUser();
  return user.verificationHash === verificationHash;
}

// Save encrypted messages for a session
export async function saveEncryptedMessages(params: {
  sessionId: string;
  encryptedMessages: string;
}): Promise<void> {
  await connectDB();
  const session = await Session.findById(params.sessionId);
  if (!session) throw new Error("Session not found");
  
  session.encryptedMessages = params.encryptedMessages;
  // Clear unencrypted messages when encrypted version is saved
  session.messages = [];
  await session.save();
}

// Get encrypted messages for a session
export async function getEncryptedSessionChat(sessionId: string): Promise<string | null> {
  await connectDB();
  const sess = await Session.findById(sessionId).lean<{ encryptedMessages?: string | null } | null>();
  return sess?.encryptedMessages || null;
}

// Save encrypted long-term memory
export async function saveEncryptedMemory(encryptedContent: string): Promise<void> {
  const user = await getAuthenticatedUser();
  
  const existing = await LongTermMemory.findOne({ userId: user._id });
  if (existing) {
    existing.encryptedContent = encryptedContent;
    existing.content = ""; // Clear unencrypted content
    existing.updatedAt = new Date();
    await existing.save();
  } else {
    await LongTermMemory.create({
      userId: user._id,
      content: "",
      encryptedContent,
      updatedAt: new Date(),
    });
  }
}

// Get encrypted long-term memory
export async function getEncryptedMemory(): Promise<string | null> {
  const user = await getAuthenticatedUser();
  const mem = await LongTermMemory.findOne({ userId: user._id }).lean<{ encryptedContent?: string | null } | null>();
  return mem?.encryptedContent || null;
}

// Save encrypted session summary
export async function saveEncryptedSummary(params: {
  sessionId: string;
  encryptedSummary: string;
  intensityScore: number | null;
}): Promise<void> {
  await connectDB();
  const session = await Session.findById(params.sessionId);
  if (!session) throw new Error("Session not found");
  
  session.encryptedSummary = params.encryptedSummary;
  session.intensityScore = params.intensityScore;
  session.summary = null; // Clear unencrypted summary
  session.endedAt = new Date();
  await session.save();
}

// Get encrypted summary for a session
export async function getEncryptedSummary(sessionId: string): Promise<{ encryptedSummary: string | null; intensityScore: number | null }> {
  await connectDB();
  const sess = await Session.findById(sessionId).lean<{ encryptedSummary?: string | null; intensityScore?: number | null } | null>();
  return {
    encryptedSummary: sess?.encryptedSummary || null,
    intensityScore: sess?.intensityScore || null,
  };
}

// Get trailing session context (encrypted + legacy summaries) for prompt building
export async function getTrailingSessionContext(): Promise<Array<{ sessionNumber: number; encryptedSummary: string | null; summary: string | null }>> {
  const user = await getAuthenticatedUser();
  const sessions = await Session.find({ userId: user._id, endedAt: { $ne: null } })
    .sort({ sessionNumber: -1 })
    .limit(2)
    .lean<Array<{ sessionNumber: number; encryptedSummary?: string | null; summary?: string | null }>>();

  return sessions.map(s => ({
    sessionNumber: s.sessionNumber,
    encryptedSummary: s.encryptedSummary || null,
    summary: s.summary || null,
  }));
}
