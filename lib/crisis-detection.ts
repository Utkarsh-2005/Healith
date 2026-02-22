/**
 * Crisis Detection System
 * Detects concerning language patterns and provides crisis resources
 */

// Keywords that indicate potential crisis situations
const CRISIS_KEYWORDS = [
  // Suicidal ideation
  "kill myself", "end my life", "want to die", "suicide", "suicidal",
  "don't want to live", "better off dead", "no reason to live",
  "can't go on", "end it all", "take my own life",
  // Self-harm
  "hurt myself", "cut myself", "self harm", "self-harm",
  // Hopelessness
  "no hope", "hopeless", "give up", "giving up",
];

// Keywords that indicate concern but not immediate crisis
const CONCERN_KEYWORDS = [
  "worthless", "burden", "alone", "nobody cares",
  "can't cope", "overwhelmed", "breaking down",
  "falling apart", "exhausted", "drained",
];

export type CrisisLevel = "none" | "concern" | "crisis";

export interface CrisisResult {
  level: CrisisLevel;
  shouldShowResources: boolean;
  matchedKeywords: string[];
}

export function detectCrisis(message: string): CrisisResult {
  const lowerMessage = message.toLowerCase();
  
  // Check for crisis keywords first
  const crisisMatches = CRISIS_KEYWORDS.filter(keyword => 
    lowerMessage.includes(keyword)
  );
  
  if (crisisMatches.length > 0) {
    return {
      level: "crisis",
      shouldShowResources: true,
      matchedKeywords: crisisMatches,
    };
  }
  
  // Check for concern keywords
  const concernMatches = CONCERN_KEYWORDS.filter(keyword => 
    lowerMessage.includes(keyword)
  );
  
  if (concernMatches.length > 0) {
    return {
      level: "concern",
      shouldShowResources: true,
      matchedKeywords: concernMatches,
    };
  }
  
  return {
    level: "none",
    shouldShowResources: false,
    matchedKeywords: [],
  };
}

export const CRISIS_RESOURCES = [
  {
    country: "United States",
    name: "National Suicide Prevention Lifeline",
    phone: "988",
    description: "24/7 free and confidential support",
  },
  {
    country: "United States",
    name: "Crisis Text Line",
    phone: "Text HOME to 741741",
    description: "Free 24/7 crisis support via text",
  },
  {
    country: "United Kingdom",
    name: "Samaritans",
    phone: "116 123",
    description: "24/7 emotional support",
  },
  {
    country: "India",
    name: "iCall",
    phone: "9152987821",
    description: "Mon-Sat 8am-10pm IST",
  },
  {
    country: "India",
    name: "Vandrevala Foundation",
    phone: "1860-2662-345",
    description: "24/7 mental health support",
  },
  {
    country: "Canada",
    name: "Talk Suicide Canada",
    phone: "988",
    description: "24/7 crisis support",
  },
  {
    country: "Australia",
    name: "Lifeline",
    phone: "13 11 14",
    description: "24/7 crisis support",
  },
];

export function getCrisisResponseAddendum(level: CrisisLevel): string {
  if (level === "crisis") {
    return "\n\n---\n**I want you to know that I care about your wellbeing.** If you're having thoughts of harming yourself, please reach out to a crisis helpline. You don't have to face this alone. In the US, call or text 988. In India, call iCall at 9152987821 or Vandrevala Foundation at 1860-2662-345.";
  }
  if (level === "concern") {
    return "\n\n---\n*If you're feeling overwhelmed, remember that professional support is available. You can reach out to a crisis helpline anytime.*";
  }
  return "";
}
