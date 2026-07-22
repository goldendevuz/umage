import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
dotenv.config();

const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const models = await client.models.list({});
const names = [];
for await (const m of models) {
  names.push(m.name);
}
names.sort().forEach(n => console.log(n));
