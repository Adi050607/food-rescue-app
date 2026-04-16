require("dotenv").config();
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/scan", async (req, res) => {
  try {
    const { image } = req.body;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Identify the food in the image and return ONLY JSON like {\"name\":\"Food\",\"shelfLife\":2}. No extra text." },
            { type: "image_url", image_url: { url: image } }
          ]
        }
      ]
    });

    const text = response.choices[0].message.content;

let result;

try {
  result = JSON.parse(text);
} catch (e) {
  return res.json({
    name: "Unknown",
    shelfLife: 1
  });
}

// Ensure fields exist
res.json({
  name: result.name || "Unknown",
  shelfLife: result.shelfLife || 1
});

  } catch (e) {
    res.json({ valid: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
const path = require("path");

app.use(express.static(path.join(__dirname)));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});