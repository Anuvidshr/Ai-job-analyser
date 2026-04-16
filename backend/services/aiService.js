const Anthropic = require('@anthropic-ai/sdk');
const client = new Anthropic();

async function analyzeThread(threadText) {
  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Analyze this fan discussion thread and return a JSON object with:
      - summary (2-3 sentence summary)
      - topics (array of top 5 trending topics)
      - sentimentScore (number from -1 to 1)
      - engagementLevel ("low", "medium", "high")
      
      Thread: ${threadText}
      
      Return ONLY valid JSON, no extra text.`
    }]
  });

  return JSON.parse(message.content[0].text);
}

module.exports = { analyzeThread };