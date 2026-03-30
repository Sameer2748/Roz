const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Llama 4 Scout — free, supports vision (image input)
const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct';

module.exports = { groq, VISION_MODEL };
