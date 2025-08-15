require('dotenv').config();
const express = require('express');
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/api/generate-content', async (req, res) => {
  const { text } = req.body;
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "mistralai/mistral-7b-instruct:free",
        messages: [
          {
            role: "system",
            content: "Extrahiere aus folgendem Uni-Text sinnvolle Karteikarten (Frage+Antwort) und Multiple-Choice-Quizfragen mit je 4 Antwortmöglichkeiten, davon eine korrekt. Antworte als JSON: {flashcards:[{question, answer}], quiz:[{question, options, correct}]}"
          },
          { role: "user", content: text }
        ]
      })
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Proxy läuft auf Port ${PORT}`));