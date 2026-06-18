

const CONVERSATIONAL_PATTERNS = [
  /^(hi|hello|hey|sup|yo|hiya|howdy)[.!?]*$/i,
  /^(good\s*(morning|afternoon|evening|night))[.!?]*$/i,
  /^how are you/i,
  /^how('s| is) it going/i,
  /^what('s| is) up/i,
  /^what can you do/i,
  /^what do you do/i,
  /^who are you/i,
  /^tell me about yourself/i,
  /^(thanks|thank you|thx|ty|cheers)[.!?]*$/i,
  /^(ok|okay|cool|great|awesome|nice|got it|sounds good)[.!?]*$/i,
  /^(bye|goodbye|see you|cya|later)[.!?]*$/i,
  /^(yes|no|yeah|nope|yep|nah)[.!?]*$/i,
  /^(help|help me)[.!?]*$/i,
];

const CONVERSATIONAL_RESPONSES: Record<string, string> = {
  greeting:
    "Hello! I'm Orion, your AI workspace assistant. I can help you manage emails, schedule meetings, draft replies, and organise your day. What would you like to do?",
  how_are_you:
    "I'm doing great and ready to help. You can ask me to summarise your inbox, draft an email, create a calendar event, or schedule a meeting. What's on your mind?",
  what_can_you_do:
    "I can help you with:\n\n• **Email** — Send emails, draft replies, and manage your inbox\n• **Calendar** — Create events, schedule meetings, and add attendees\n• **Combined** — Send an invite email and create a calendar event in one go\n\nJust tell me what you need in plain English.",
  who_are_you:
    "I'm Orion — your AI-powered workspace assistant built to manage Gmail and Google Calendar. Give me a task in plain English and I'll handle it.",
  thanks:
    "You're welcome! Let me know if there's anything else I can help you with.",
  farewell: "See you soon! Come back anytime you need help managing your workspace.",
  generic:
    "Hello! I'm Orion, your AI workspace assistant. Ask me to send an email, create a calendar event, or schedule a meeting — I've got you covered.",
};

export type ConversationalMatch = {
  isConversational: true;
  response: string;
} | {
  isConversational: false;
};

export function detectConversationalIntent(prompt: string): ConversationalMatch {
  const trimmed = prompt.trim().toLowerCase();

  const wordCount = trimmed.split(/\s+/).length;
  if (wordCount > 12) return { isConversational: false };

  // Match against patterns
  if (/^(hi|hello|hey|sup|yo|hiya|howdy)[.!?]*$/i.test(trimmed)) {
    return { isConversational: true, response: CONVERSATIONAL_RESPONSES.greeting };
  }
  if (/how are you|how('s| is) it going|what('s| is) up/i.test(trimmed)) {
    return { isConversational: true, response: CONVERSATIONAL_RESPONSES.how_are_you };
  }
  if (/what can you do|what do you do/i.test(trimmed)) {
    return { isConversational: true, response: CONVERSATIONAL_RESPONSES.what_can_you_do };
  }
  if (/who are you|tell me about yourself/i.test(trimmed)) {
    return { isConversational: true, response: CONVERSATIONAL_RESPONSES.who_are_you };
  }
  if (/^(thanks|thank you|thx|ty|cheers)[.!?]*$/i.test(trimmed)) {
    return { isConversational: true, response: CONVERSATIONAL_RESPONSES.thanks };
  }
  if (/^(bye|goodbye|see you|cya|later)[.!?]*$/i.test(trimmed)) {
    return { isConversational: true, response: CONVERSATIONAL_RESPONSES.farewell };
  }
  if (/^(good\s*(morning|afternoon|evening|night))[.!?]*$/i.test(trimmed)) {
    return { isConversational: true, response: CONVERSATIONAL_RESPONSES.greeting };
  }
  if (/^(help|help me)[.!?]*$/i.test(trimmed)) {
    return { isConversational: true, response: CONVERSATIONAL_RESPONSES.what_can_you_do };
  }
  if (/^(ok|okay|cool|great|awesome|nice|got it|sounds good)[.!?]*$/i.test(trimmed)) {
    return {
      isConversational: true,
      response: "Got it! Let me know if there's anything else you'd like me to do.",
    };
  }
  if (/^(yes|no|yeah|nope|yep|nah)[.!?]*$/i.test(trimmed)) {
    return {
      isConversational: true,
      response: "Understood. Let me know when you have a task for me.",
    };
  }

  // General pattern sweep
  for (const pattern of CONVERSATIONAL_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { isConversational: true, response: CONVERSATIONAL_RESPONSES.generic };
    }
  }

  return { isConversational: false };
}
