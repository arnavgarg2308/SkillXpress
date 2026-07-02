const axios = require("axios");

async function generateMentorNote(prompt) {
  try {
    const response = await axios.post(
      "http://localhost:8000/generate-roadmap",
      {
        prompt
      }
    );

    if (!response.data.success) {
      throw new Error(response.data.error);
    }

    return response.data.roadmap;

  } catch (err) {
    console.error("Local AI Error:", err.message);
    throw err;
  }
}

module.exports = generateMentorNote;