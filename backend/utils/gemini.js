const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

module.exports = async function generateMentorNote(prompt) {
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
          maxOutputTokens: 2048
        }
      })
    }
  );

  const data = await res.json();

  console.log("Gemini raw response:", JSON.stringify(data, null, 2));

  if (!data.candidates || !data.candidates.length) {
    throw new Error("No candidates returned from Gemini");
  }

  return data.candidates[0].content.parts[0].text;
};
