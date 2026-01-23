import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const generateMappingSuggestion = async (headers: string[]) => {
    // Use gemini-2.0-flash-exp as verified in Phase 2
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const prompt = `
    I have a CSV with the following headers: ${JSON.stringify(headers)}.
    Please map these headers to the following target fields:
    - amount (required)
    - date (optional)
    - description (optional)
    - type (optional)

    Return a JSON object where keys are target fields and values are the matching CSV header names.
    If no match found for optional fields, omit them.
    Example: { "amount": "Cost", "date": "Transaction Date" }
    
    Only return the JSON object, no other text.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error) {
        console.error("Error generating mapping:", error);
        // Fallback: simple heuristic
        const mapping: any = {};
        headers.forEach(h => {
            const lower = h.toLowerCase();
            if (lower.includes('amount') || lower.includes('price') || lower.includes('cost')) mapping.amount = h;
            if (lower.includes('date') || lower.includes('time')) mapping.date = h;
            if (lower.includes('desc') || lower.includes('memo') || lower.includes('detail')) mapping.description = h;
        });
        return mapping;
    }
};
