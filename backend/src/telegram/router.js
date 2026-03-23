const ROUTER_MODEL = "llama-3.1-8b-instant";

const INTENTS = {
  market_query: "Questions about Bonzo market data, liquidity, APY, utilization, reserves, token supply rates",
  position_query: "Questions about user's own position, collateral, debt, borrows, balances on Bonzo",
  risk_query: "Questions about health factor, liquidation risk, safety of user's position",
  sentiment_query: "Questions about market sentiment, fear & greed, crypto news, DeFi TVL trends",
  strategy_query: "Questions asking for advice, what to do, should I invest, deposit, withdraw, or any action recommendation",
  full_run: "Explicit request to run the full pipeline, monitor cycle, or do a comprehensive check",
  system_status: "Questions about the bot itself, last run, heartbeat, when was last check, is bot running",
  unknown: "Anything else, greetings, off-topic, or unclear",
};

const SYSTEM_PROMPT = [
  "You are an intent classifier for a DeFi monitoring bot on Bonzo Finance (Hedera).",
  "Classify the user message into exactly ONE intent from this list:",
  "",
  ...Object.entries(INTENTS).map(([k, v]) => `- ${k}: ${v}`),
  "",
  "Reply with ONLY the intent name, nothing else. No punctuation, no explanation.",
].join("\n");

async function classifyIntent(userMessage) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return "unknown";

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: ROUTER_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        max_tokens: 30,
        temperature: 0,
      }),
    });

    const data = await res.json();
    if (data.error) {
      console.error(`[router] Groq error: ${data.error.message || JSON.stringify(data.error)}`);
      return "unknown";
    }

    const raw = (data.choices?.[0]?.message?.content || "").trim().toLowerCase();
    return INTENTS[raw] ? raw : "unknown";
  } catch (e) {
    console.error(`[router] classify failed: ${e.message}`);
    return "unknown";
  }
}

module.exports = { classifyIntent, INTENTS };
