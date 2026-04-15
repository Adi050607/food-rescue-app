require("dotenv").config();
const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json({limit:"10mb"}));

const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/scan", async (req,res)=>{

try{

const {image}=req.body;

const response = await client.chat.completions.create({
model:"gpt-4o-mini",
messages:[{
role:"user",
content:[
{type:"text",text:"Is this food? Return JSON {valid,name,shelfLife}"},
{type:"image_url",image_url:{url:image}}
]
}]
});

let text=response.choices[0].message.content;
let json=text.slice(text.indexOf("{"),text.lastIndexOf("}")+1);

res.json(JSON.parse(json));

}catch(e){
res.json({valid:false});
}

});

const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>{
    console.log("Server running on port"+PORT);
});