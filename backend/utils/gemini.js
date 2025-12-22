const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

async function generateMentorNote(prompt) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 450,
            temperature: 0.2
          }
        })
      }
    );

    const data = await res.json();
    return data.candidates[0].content.parts[0].text;
  } catch (e) {
    return "Is month consistency aur daily practice sabse zyada important hai.";
  }
}

module.exports = generateMentorNote;
