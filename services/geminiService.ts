
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  async getTradingAdvice(userMessage: string, tradeContext: any[]) {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `
          You are an expert Forex Trading Psychologist and Technical Analyst. 
          Context: The user has ${tradeContext.length} trades recorded. 
          Task: Provide succinct, professional, and helpful advice based on the user's question.
          Question: ${userMessage}
        `,
        config: {
          systemInstruction: "You are a professional forex trading coach. Be concise, objective, and psychologically supportive. Use trading terminology like Pip, Spread, RR, FOMO, and Confluence."
        }
      });
      return response.text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      return "I'm having trouble connecting to the markets right now. Please check your connection and try again.";
    }
  }
}
