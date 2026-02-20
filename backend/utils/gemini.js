const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

module.exports = async function generateMentorNote(prompt) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
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
            temperature: 0.7,
            maxOutputTokens: 1500
          }
        })
      }
    );

    const data = await res.json();

    // 🔴 If API returned error
   if (!res.ok) {
  const errorText = await res.text();
  console.error("Gemini HTTP ERROR:", errorText);
  throw new Error("Gemini API failed: " + errorText);
}

    if (!data.candidates || !data.candidates.length) {
      console.error("No candidates:", data);
      throw new Error("No response from Gemini");
    }

    return data.candidates[0].content.parts[0].text;

  } 
  catch (err) {
  console.error("Gemini error FULL:", err);
  return res.status(500).json({ error: err.message });
  }
};
