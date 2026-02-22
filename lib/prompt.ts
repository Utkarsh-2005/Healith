import { LongTermMemory } from "@/models/longTermMemory";
import { Session } from "@/models/session";
import { Types } from "mongoose";

export type ChatMessage = { role: "user" | "assistant"; content: string };

export type SessionType =
  | "FIRST_SESSION"
  | "SECOND_SESSION"
  | "CONSOLIDATION_SESSION"
  | "STANDARD_SESSION";

export function getSessionType(sessionNumber: number): SessionType {
  if (sessionNumber === 1) return "FIRST_SESSION";
  if (sessionNumber === 2) return "SECOND_SESSION";
  if (sessionNumber === 3) return "CONSOLIDATION_SESSION";
  return "STANDARD_SESSION";
}

export async function getTimeGap(userId: Types.ObjectId) {
  const last = await Session.findOne({ userId, endedAt: { $ne: null } })
    .sort({ endedAt: -1 })
    .lean<{ endedAt: Date | null } | null>();
  if (!last?.endedAt) return { daysSinceLastSession: null, hoursSinceLastSession: null };
  const now = new Date();
  const diffMs = now.getTime() - new Date(last.endedAt).getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);
  return { daysSinceLastSession: days, hoursSinceLastSession: hours };
}

export async function getTrailingSessionSummaries(userId: Types.ObjectId, limit = 2) {
  const sessions = await Session.find({ userId, summary: { $ne: null } })
    .sort({ sessionNumber: -1 })
    .limit(limit)
    .lean<Array<{ sessionNumber: number; summary: string | null }>>();
  return sessions.map((s) => ({ sessionNumber: s.sessionNumber, summary: s.summary }));
}

export async function getPersistentMemory(userId: Types.ObjectId) {
  const mem = await LongTermMemory.findOne({ userId }).lean<{ content: string } | null>();
  return mem?.content ?? "";
}

function baseSystemRole(userName?: string) {
  let personalisation = "";
  if (userName) {
    personalisation =
      `\nThe user's first name is \"${userName}\". ` +
      "Use their name occasionally to make the conversation feel warm and personal, " +
      "but do NOT overuse it—limit it to roughly once every 3–4 messages, " +
      "and only when it feels natural (e.g., at the start of a reply, when validating feelings, " +
      "or when wrapping up). Never force it into every response.\n";
  }

  return (
    "You are a calm, empathetic AI wellness companion.\n" +
    "Your goal is to help the user understand themselves, recognize patterns,\n" +
    "track growth over time, and make healthier choices.\n" +
    personalisation +
    "You are NOT a therapist, doctor, or mental health professional. You cannot diagnose conditions or provide medical advice.\n" +
    "If someone expresses crisis or suicidal thoughts, gently encourage them to contact a crisis helpline and remind them that professional support is available.\n" +
    "Balance information-gathering with gentle, practical support. Interleave probing with small, actionable steps (e.g., paced breathing, grounding, reframing), when appropriate and with consent.\n" +
    "Avoid repeating the same question; vary probes and summarize progress periodically.\n" +
    "Offer help without urgency, and keep tone supportive and neutral.\n" +
    "IMPORTANT:- You must output must be a direct response to the user's message as it will be shown in the chat.\n" +
    "\n" +
    "SESSION CLOSING DETECTION:\n" +
    "When the user sends a strong signal that they are satisfied and ready to end the session " +
    "(e.g., \"I feel better\", \"thanks, that's all\", \"I think I'm good\", \"bye\", \"that's enough for today\"), " +
    "end your response with the exact tag [SESSION_COMPLETE] on a new line. " +
    "Do NOT include this tag unless the user has clearly and voluntarily signalled they want to stop. " +
    "Never pressure the user to end a session."
  );
}

function sessionSpecificPrompt(type: SessionType) {
  switch (type) {
    case "FIRST_SESSION":
      return (
        "This is the first ever session.\n" +
        "Gently explore and also offer small, supportive steps.\n" +
        "Collect: background, emotional baseline, current struggles, triggers, coping strategies, support system, and goals.\n" +
        "When the user surfaces a concrete difficulty (e.g., anxiety symptoms), offer one simple technique (with consent), such as: paced breathing (inhale 4, exhale 6), a brief grounding exercise (5-4-3-2-1), or a gentle reframing.\n" +
        "Do not diagnose. Keep responses concise and varied; avoid asking more than two consecutive probing questions without providing reflection or a small step."
      );
    case "SECOND_SESSION":
      return (
        "This is the second session.\n" +
        "Continue context-building and begin gently identifying early patterns.\n" +
        "Reference the previous session to create continuity.\n" +
        "Interleave 1–2 probes with a practical micro-step the user can try, and ask consent before guiding a technique."
      );
    case "CONSOLIDATION_SESSION":
      return (
        "This is the third session.\n" +
        "Begin consolidation: repeated themes, emotional loops, and early patterns.\n" +
        "Offer a brief recap and one practical next step. Keep inquiry varied and avoid repetitive probing."
      );
    default:
      return (
        "This is a regular session.\n" +
        "Focus on ongoing issues, pattern recognition, and progress tracking while maintaining accountability.\n" +
        "Interleave reflection with small, consent-based techniques or suggestions; avoid loops of questions without support."
      );
  }
}

export function timeAwarenessPrompt(hoursSinceLastSession: number | null, daysSinceLastSession: number | null) {
  const gap =
    hoursSinceLastSession == null || daysSinceLastSession == null
      ? "unknown"
      : `${daysSinceLastSession} days (${hoursSinceLastSession} hours)`;
  return `It has been ${gap} since the last session. Adjust relevance and assumptions accordingly.`;
}

export function memoryParagraphPrompt(content: string) {
  if (!content?.trim()) return "";
  return "Persistent long-term memory (single paragraph):\n" + content.trim();
}

export function trailingSummariesPrompt(trailing: { sessionNumber: number; summary: string | null }[]) {
  if (!trailing.length) return "";
  const lines = trailing
    .filter((t) => t.summary)
    .map((t) => `Session #${t.sessionNumber} summary: ${t.summary}`);
  if (!lines.length) return "";
  return "Trailing memory for continuity (last 1–2 sessions):\n" + lines.join("\n");
}

export async function buildPrompt(opts: {
  userId: Types.ObjectId;
  sessionNumber: number;
  messages: ChatMessage[];
  clientTrailingSummaries?: Array<{ sessionNumber: number; summary: string | null }>;
  clientMemory?: string;
  userName?: string;
}) {
  const type = getSessionType(opts.sessionNumber);
  const { hoursSinceLastSession, daysSinceLastSession } = await getTimeGap(opts.userId);
  // Use client-provided decrypted data if available, otherwise fall back to DB (legacy/unencrypted)
  const trailing = opts.clientTrailingSummaries !== undefined
    ? opts.clientTrailingSummaries
    : await getTrailingSessionSummaries(opts.userId, 2);
  const memoryParagraph = opts.clientMemory !== undefined
    ? opts.clientMemory
    : await getPersistentMemory(opts.userId);

  const parts = [
    baseSystemRole(opts.userName),
    sessionSpecificPrompt(type),
    timeAwarenessPrompt(hoursSinceLastSession, daysSinceLastSession),
    trailingSummariesPrompt(trailing),
    memoryParagraphPrompt(memoryParagraph),
    "Current messages:",
    ...opts.messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`),
  ].filter(Boolean);

  return parts.join("\n\n");
}
