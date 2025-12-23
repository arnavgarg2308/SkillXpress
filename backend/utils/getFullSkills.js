const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

module.exports = async function getFullSkills(userId, githubUsername) {
  const res = await fetch(
    `https://skillxpress.onrender.com/full-skills/${userId}/${githubUsername}`
  );

  const data = await res.json();
  return data.skills || {};
};
