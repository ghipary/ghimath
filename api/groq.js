// api/groq.js
export default async function handler(req, res) {
  // Hanya izinkan method POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Ambil API Key dari Environment Variable Vercel (TANPA prefix VITE_)
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API Key Groq belum di-setup di server' });
  }

  try {
    // Teruskan request dari frontend ke Groq API
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body), // Teruskan body (prompt, model, dll) dari frontend
    });

    const data = await response.json();
    
    // Kirim balik response dari Groq ke frontend
    return res.status(response.status).json(data);

  } catch (error) {
    console.error('Error di Serverless Function:', error);
    return res.status(500).json({ error: 'Terjadi kesalahan di server' });
  }
}