require("dotenv").config();
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
app.use(cors());
app.use(express.json({limit:"10mb"}));

const openai = new OpenAI({
  apiKey: process.env.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
});

app.post("/scan", async (req,res)=>{

try{

const {image}=req.body;

const response = await openai.chat.completions.create({
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