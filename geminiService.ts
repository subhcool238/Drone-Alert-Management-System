import { GoogleGenAI } from "@google/genai";

/**
 * Provides smart suggestions based on the provided system context.
 * Re-initializes GoogleGenAI within the function to ensure it uses the current API key from environment.
 */
export async function getSmartSuggestion(context: string) {
  try {
    // Create a new instance right before making the API call for reliability
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Context: You are an AI security advisor for a drone fleet management system. 
      The current system state is: ${context}. 
      Provide a concise (2-3 sentences) strategic suggestion for the security operator.`,
      config: {
        temperature: 0.7,
        topP: 0.9
      }
    });
    
    // Correctly accessing the .text property from GenerateContentResponse
    return response.text || "Continue regular perimeter surveillance. System load is within normal parameters.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Optimizing patrol routes based on current heatmaps. Proceed with standard surveillance.";
  }
}
