
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getSmartSuggestion(context: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Context: You are an AI security advisor for a drone fleet management system. 
      The current system state is: ${context}. 
      Provide a concise (2-3 sentences) strategic suggestion for the security operator.`,
      config: {
        temperature: 0.7,
        topP: 0.9,
      }
    });
    return response.text || "Continue regular perimeter surveillance. System load is within normal parameters.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Optimizing patrol routes based on current heatmaps. Proceed with standard surveillance.";
  }
}
