api/generate.js
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { system, message } = req.body || {};

  if (!message) {
    return res.status(400).json({ error: 'Message manquant' });
  }

  try {
    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: system || "Tu es un assistant utile." },
          { role: "user", content: message }
        ],
        max_tokens: 1500,
        temperature: 0.7
      })
    });

    const data = await groqResponse.json();

    if (data.error) {
      return res.status(500).json({ error: data.error.message || "Erreur Groq" });
    }

    const text = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ text });

  } catch (err) {
    return res.status(500).json({ error: "Erreur serveur : " + err.message });
  }
}
