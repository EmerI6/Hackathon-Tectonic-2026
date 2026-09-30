import { MOMENT_CATEGORIES, PRODUCT_CATEGORIES } from '../src/detection/guardrails.ts';

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';
const TIMEOUT_MS = 8000;

const str = { type: 'STRING' };
const responseSchema = {
  type: 'OBJECT',
  properties: {
    candidates: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          moment: str,
          category: { type: 'STRING', enum: MOMENT_CATEGORIES },
          confidence: { type: 'INTEGER' },
          signals: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                label: str,
                explanation: str,
                source: { type: 'STRING', enum: ['Transactions', 'Income', 'Savings', 'In-app behaviour', 'Profile'] },
              },
              required: ['label', 'explanation', 'source'],
            },
          },
          customerNeed: str,
          productCategory: { type: 'STRING', enum: PRODUCT_CATEGORIES },
          sensitive: { type: 'BOOLEAN' },
          headline: str,
          customerMessage: str,
        },
        required: [
          'moment',
          'category',
          'confidence',
          'signals',
          'customerNeed',
          'productCategory',
          'sensitive',
          'headline',
          'customerMessage',
        ],
      },
    },
  },
  required: ['candidates'],
};

/** Calls Gemini in JSON mode and returns the parsed (still untrusted) object. */
export async function callGemini(apiKey: string, model: string, system: string, user: string): Promise<unknown> {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: user }] }],
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json', responseSchema },
    }),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('');
  if (!text) throw new Error('Gemini returned no content');
  return JSON.parse(text);
}
