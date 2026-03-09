const DEFAULT_BASE_URL = process.env.AI_BASE_URL || "https://api.openai.com/v1";
const DEFAULT_MODEL = process.env.AI_MODEL || "gpt-4.1-mini";

const hasApiKey = () => Boolean(process.env.AI_API_KEY && process.env.AI_API_KEY.trim());

const createSystemPrompt = () =>
  [
    "You are a cautious healthcare triage assistant.",
    "Never provide a definitive diagnosis.",
    "Always return strict JSON with keys: riskLevel, possibleConditions, recommendedActions, redFlags, disclaimer.",
    "riskLevel must be one of: low, medium, high, emergency.",
    "Keep responses concise and safety-focused."
  ].join(" ");

const callAI = async (messages, temperature = 0.2) => {
  const response = await fetch(`${DEFAULT_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.AI_API_KEY}`
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages,
      temperature,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI API error ${response.status}: ${text}`);
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI API returned an empty response");
  }

  return {
    model: payload?.model || DEFAULT_MODEL,
    content
  };
};

const keywordMatch = (haystack, keywords) =>
  keywords.some((word) => haystack.includes(word));

const heuristicTriage = (input) => {
  const combined = [
    ...(input.symptoms || []),
    ...(input.medicalHistory || []),
    ...(input.currentMedications || [])
  ]
    .join(" ")
    .toLowerCase();

  let riskLevel = "low";

  if (
    keywordMatch(combined, ["chest pain", "difficulty breathing", "seizure", "unconscious", "stroke"]) ||
    (input.vitals?.spo2 && input.vitals.spo2 < 90)
  ) {
    riskLevel = "emergency";
  } else if (
    keywordMatch(combined, ["high fever", "blood", "vomiting", "severe pain", "fainting"]) ||
    (input.vitals?.temperatureC && input.vitals.temperatureC >= 39)
  ) {
    riskLevel = "high";
  } else if (
    keywordMatch(combined, ["fever", "persistent cough", "headache", "fatigue"]) ||
    (input.vitals?.temperatureC && input.vitals.temperatureC >= 37.5)
  ) {
    riskLevel = "medium";
  }

  return {
    provider: "local-fallback",
    model: "heuristic-v1",
    raw: JSON.stringify({ source: "fallback" }),
    triage: {
      riskLevel,
      possibleConditions: ["Needs clinical assessment"],
      recommendedActions: [
        "Monitor symptoms closely",
        "If symptoms worsen, seek in-person medical care"
      ],
      redFlags: [
        "Trouble breathing",
        "Chest pain",
        "Confusion",
        "Persistent high fever"
      ],
      disclaimer:
        "AI output is assistive only. Not a medical diagnosis. Contact emergency services for severe symptoms."
    }
  };
};

const getTriageFromAI = async (input) => {
  if (!hasApiKey()) {
    return heuristicTriage(input);
  }

  const messages = [
    { role: "system", content: createSystemPrompt() },
    {
      role: "user",
      content: `Triage this case: ${JSON.stringify(input)}`
    }
  ];

  const ai = await callAI(messages, 0.2);
  let parsed;

  try {
    parsed = JSON.parse(ai.content);
  } catch (error) {
    throw new Error("AI returned invalid JSON for triage");
  }

  return {
    provider: "openai-compatible",
    model: ai.model,
    raw: ai.content,
    triage: {
      riskLevel: ["low", "medium", "high", "emergency"].includes(parsed.riskLevel)
        ? parsed.riskLevel
        : "medium",
      possibleConditions: Array.isArray(parsed.possibleConditions) ? parsed.possibleConditions : [],
      recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
      redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
      disclaimer:
        parsed.disclaimer ||
        "AI output is assistive only. Consult a licensed clinician for diagnosis."
    }
  };
};

const generateFollowUpQuestions = async (input) => {
  if (!hasApiKey()) {
    return [
      "When did each symptom start and has it changed over time?",
      "Do you have fever, chest pain, or breathing difficulty right now?",
      "Do you have any chronic medical condition or regular medication?"
    ];
  }

  const messages = [
    {
      role: "system",
      content:
        "Return strict JSON: { \"questions\": [string, string, string, string, string] }. Ask concise clinical follow-up questions."
    },
    {
      role: "user",
      content: `Generate follow-up questions for this patient: ${JSON.stringify(input)}`
    }
  ];

  const ai = await callAI(messages, 0.3);
  const parsed = JSON.parse(ai.content);
  return Array.isArray(parsed.questions) ? parsed.questions : [];
};

const generateGuidance = async (question) => {
  if (!hasApiKey()) {
    return {
      answer:
        "For safety, seek medical evaluation if symptoms are persistent or worsening. For emergency symptoms, contact local emergency services immediately.",
      redFlags: ["Chest pain", "Breathing difficulty", "Severe bleeding", "Confusion"]
    };
  }

  const messages = [
    {
      role: "system",
      content:
        "Return strict JSON: { \"answer\": string, \"redFlags\": string[] }. Keep guidance non-diagnostic and safety-oriented."
    },
    {
      role: "user",
      content: question
    }
  ];

  const ai = await callAI(messages, 0.2);
  const parsed = JSON.parse(ai.content);

  return {
    answer: parsed.answer || "",
    redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : []
  };
};

module.exports = {
  hasApiKey,
  getTriageFromAI,
  generateFollowUpQuestions,
  generateGuidance
};
