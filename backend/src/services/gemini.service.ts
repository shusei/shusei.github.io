import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const parseTransactionInput = async (input: string) => {
    // Use gemini-2.0-flash-exp as it is available in the list
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `
    Extract transaction details from the following text: "${input}".
    Return a JSON object with the following fields:
    - amount: number
    - type: "income" or "expense" (default to expense if unclear)
    - category: string (short category name, e.g., Food, Transport)
    - description: string
    - date: string (ISO 8601 format YYYY-MM-DD, default to today if not specified)
    
    Only return the JSON object, no other text.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error parsing transaction with Gemini:", error);
        throw new Error("Failed to parse transaction input");
    }
};
