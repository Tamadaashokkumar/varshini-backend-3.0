import https from "https";

// 👇👇👇 మీ కొత్త API Key ని ఇక్కడ పేస్ట్ చేయండి 👇👇👇
const API_KEY = "AIzaSyAlfBHwBv4RA8euBJvU9Ukfd2A6-hAiPvU";

const options = {
  hostname: "generativelanguage.googleapis.com",
  path: `/v1beta/models?key=${API_KEY}`,
  method: "GET",
  headers: { "Content-Type": "application/json" },
};

console.log("🔍 Checking available models for your Key...");

const req = https.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    const response = JSON.parse(data);

    if (res.statusCode === 200 && response.models) {
      console.log("\n✅ SUCCESS! ఈ కీ తో ఈ మోడల్స్ మాత్రమే పనిచేస్తాయి:");
      console.log("------------------------------------------------");
      response.models.forEach((m) => {
        // మనకు కావాల్సినవి 'generateContent' సపోర్ట్ చేసే మోడల్స్ మాత్రమే
        if (m.supportedGenerationMethods.includes("generateContent")) {
          console.log(`👉 ${m.name}`); // ఉదాహరణకు: models/gemini-pro
        }
      });
      console.log("------------------------------------------------");
      console.log("పై లిస్ట్‌లో ఉన్న పేరుని మాత్రమే మీ కోడ్‌లో వాడాలి.");
    } else {
      console.log("\n❌ ERROR: కీ లేదా అకౌంట్లో ఇంకా సమస్య ఉంది.");
      console.log("Status Code:", res.statusCode);
      console.log("Error Details:", JSON.stringify(response, null, 2));
    }
  });
});

req.on("error", (e) => {
  console.error("Connection Error:", e);
});

req.end();
