import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

// Get API key from environment
const apiKey = process.env.GOOGLE_GENAI_API_KEY;

export const ai = genkit({
  plugins: [googleAI({ apiKey })],
  model: 'googleai/gemini-2.5-flash',
});
