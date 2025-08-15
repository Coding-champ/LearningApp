// src/utils/safeJsonParse.js
export function safeJsonParse(aiText) {
  // Entferne mögliche Markdown-Codeblöcke
  let cleaned = aiText.trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/, '');

  try {
    return JSON.parse(cleaned);
  } catch (e1) {
    cleaned = cleaned
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      .replace(/'/g, '"');
    try {
      return JSON.parse(cleaned);
    } catch (e2) {
      throw new Error('Keine gültige JSON-Antwort von der KI. Bitte prüfe das KI-Prompt oder die Eingabe.');
    }
  }
}