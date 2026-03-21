import { GoogleGenAI } from "@google/genai";
import { Disaster } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateStory(disaster: Disaster) {
  const model = "gemini-3-flash-preview";
  const prompt = `You are a documentary narrator for a digital memorial. 
  Tell a short, emotionally powerful, and respectful story about this forgotten disaster:
  Title: ${disaster.title}
  Location: ${disaster.location}
  Year: ${disaster.year}
  Summary: ${disaster.summary}
  
  Keep it under 150 words. Focus on the human element and the tragedy of it being forgotten.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating story:", error);
    return "The system is unable to retrieve the narrative at this time.";
  }
}
