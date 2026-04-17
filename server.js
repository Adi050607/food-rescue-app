require("dotenv").config();
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/scan", async (req, res) => {
  try {
    const { image, foodName } = req.body;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
Detect food in the image.

- Fruits, vegetables, cooked food → VALID
- Even if held by human → VALID
- If ANY edible item → valid = true
- If nothing edible → valid = false

Compare with user input: "${foodName}"

Return JSON:
{
  "valid": true/false,
  "detectedName": "food name",
  "matches": true/false,
  "shelfLife": number
}
`
            },
            {
              type: "input_image",
              image_url: image
            }
          ]
        }
      ]
    });
    app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
You are EcoEase AI.
Help with food donation, NGOs, delivery.

User: ${message}
`
            }
          ]
        }
      ]
    });

    const reply = response.output[0].content[0].text;
    res.json({ reply });

  } catch (e) {
    res.json({ reply: "AI not available" });
  }
});

    const text = response.output[0].content[0].text;

    let result;

    try {
      const start = text.indexOf("{");
      const end = text.lastIndexOf("}");
      result = JSON.parse(text.slice(start, end + 1));
    } catch (e) {
      console.log("RAW:", text);
      return res.json({ valid: false });
    }

    res.json(result);

  } catch (e) {
    console.log("SERVER ERROR:", e);
    res.json({ valid: false });
  }
});

app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});