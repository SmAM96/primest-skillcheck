// [AI-ASSISTED]: Standard boilerplate for OpenAI API interaction.

const OpenAI = require('openai');
const config = require('../config/env');

const openai = new OpenAI({
  apiKey: config.openaiKey,
});

async function checkLLM(userAnswer) {
  try {
    console.log(`🤖 AI ACTIVATED: Analyzing ambiguous answer: "${userAnswer}"`);

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a boolean classifier for a German solar lead API. The question asked was: "Sind Sie Eigentümer?" (Are you the owner?).
          RULES:
          - If the answer implies YES, ownership, or strong agreement, output strictly: CONFIRMED
          - If the answer implies NO, renting, uncertainty, or someone else owns it, output strictly: DENIED
          Output ONLY the word CONFIRMED or DENIED.`,
        },
        {
          role: 'user',
          content: `User Answer: "${userAnswer}"`,
        },
      ],
      temperature: 0,
    });

    const decision = completion.choices[0].message.content.trim();
    return decision.includes('CONFIRMED') ? 'CONFIRMED' : 'DENIED';
  } catch (error) {
    console.error('⚠️ LLM Failed:', error.message);
    return 'DENIED'; // Default to denied on error
  }
}

module.exports = { checkLLM };
