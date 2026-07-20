module.exports = async function handler(req, res) {
  // Autorise seulement les requetes POST
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Methode non autorisee' });
    return;
  }

  // Securise la lecture du corps de la requete
  let body = req.body;
  if (!body) {
    res.status(400).json({ error: 'Corps de requete manquant' });
    return;
  }
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      res.status(400).json({ error: 'JSON invalide' });
      return;
    }
  }

  const system = body.system;
  const message = body.message;

  if (!message) {
    res.status(400).json({ error: 'Message manquant' });
    return;
  }

  // Verifie que la cle existe avant d'appeler Groq
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'Cle API manquante cote serveur' });
    return;
  }

  try {
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: system || 'Tu es un assistant utile.' },
          { role: 'user', content: message }
        ],
        max_tokens: 1500,
        temperature: 0.7
      })
    });

    const data = await groqResponse.json();

    if (!groqResponse.ok) {
      const errMsg = (data && data.error && data.error.message) || 'Erreur Groq inconnue';
      res.status(502).json({ error: errMsg });
      return;
    }

    const text = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    res.status(200).json({ text: text });

  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur : ' + (err && err.message ? err.message : String(err)) });
  }
};
