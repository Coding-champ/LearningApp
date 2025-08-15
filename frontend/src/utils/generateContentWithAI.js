import { safeJsonParse } from './safeJsonParse';

export async function generateContentWithAI(text) {
  const response = await fetch('http://localhost:3001/api/generate-content', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
   const data = await response.json();
  return safeJsonParse(data.choices[0].message.content);
}