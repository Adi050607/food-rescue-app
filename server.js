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
            {
              type: "text",
              text: `
Analyze the image carefully.

- Detect ONLY edible food items present anywhere in the image.
- Ignore humans, faces, hands, background objects.
- Even if food is partially visible, still detect it.
- If NO food is present → return valid:false

Return STRICT JSON ONLY:
{
  "valid": true/false,
  "name": "food name",
  "shelfLife": number_of_days
}
`
            },
            {
              type: "image_url",
              image_url: { url: image }
            }
          ]
        }
      ]
    });

    const text = response.choices[0].message.content;

    let result;

    try {
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");

      const cleanJson = text.slice(jsonStart, jsonEnd + 1);

      result = JSON.parse(cleanJson);

    } catch (e) {
      console.log("AI RAW RESPONSE:", text);

      return res.json({
        valid: false,
        name: "Unknown",
        shelfLife: 1
      });
    }

    res.json({
      valid: result.valid ?? true,
      name: result.name || "Unknown",
      shelfLife: result.shelfLife || 1
    });

  } catch (e) {
    console.log("SERVER ERROR:", e);
    res.json({ valid: false });
  }
});

const path = require("path");

app.use(express.static(path.join(__dirname)));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});