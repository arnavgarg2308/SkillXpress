const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

module.exports = async function generateMentorNote(prompt) {

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 1500,
          topP: 0.95
        }
      })
    }
  );

  const data = await res.json();

  if (!res.ok) {
    console.error("Gemini API error:", data);
    return null;
  }

  return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
};
