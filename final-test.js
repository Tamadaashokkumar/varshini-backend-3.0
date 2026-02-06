// final-test.js
import https from "https";

// 👇 మీ API Key ని ఇక్కడ పేస్ట్ చేయండి
const API_KEY = "AIzaSyAlfBHwBv4RA8euBJvU9Ukfd2A6-hAiPvU";

const data = JSON.stringify({
  contents: [{ parts: [{ text: "Hello AI" }] }],
});

const options = {
  hostname: "generativelanguage.googleapis.com",
  path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": data.length,
  },
};

console.log("🚀 Testing Direct Connection to Google...");

const req = https.request(options, (res) => {
  let responseBody = "";

  res.on("data", (chunk) => {
    responseBody += chunk;
  });

  res.on("end", () => {
    if (res.statusCode === 200) {
      console.log("✅ SUCCESS! It Works! (మీ API Key బాగుంది)");
      console.log(
        "Response:",
        JSON.parse(responseBody).candidates[0].content.parts[0].text,
      );
    } else {
      console.log("❌ FAILED. (సమస్య మీ API Key లో ఉంది)");
      console.log("Status Code:", res.statusCode);
      console.log("Error Details:", responseBody);
      console.log(
        "\n👉 SOLUTION: కొత్త Google Account తో కొత్త API Key క్రియేట్ చేయండి.",
      );
    }
  });
});

req.on("error", (error) => {
  console.error("Connection Error:", error);
});

req.write(data);
req.end();
