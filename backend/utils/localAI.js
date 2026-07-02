const axios = require("axios");
console.log("✅ localAI.js loaded");
async function generateMentorNote(prompt) {
   console.log("🔥 Calling FastAPI");
  try {
    const response = await axios.post(
      "https://crummy-sizable-squeeze.ngrok-free.dev/generate-roadmap",
      {
        prompt

      }
    );
 

    if (!response.data.success) {
      throw new Error(response.data.error);
    }
  console.log("✅ Response received");
    return response.data.roadmap;

  } catch (err) {
    console.error("Local AI Error:", err.message);
    throw err;
  }
}

module.exports = generateMentorNote;