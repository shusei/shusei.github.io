import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const parseTransactionInput = async (input: string) => {
    // Use gemini-flash-latest for better quota availability
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const today = new Date().toISOString().split('T')[0];
    const prompt = `
    Extract transaction details from the following text: "${input}".
    Current Date: ${today}
    Return a JSON object with the following fields:
    - amount: number
    - type: "income" or "expense" (default to expense if unclear)
    - category: string (Specific category, e.g., Breakfast, Lunch, Dinner, Snack, Drink, Transport, Shopping, Entertainment, Bills. Avoid generic 'Food' if possible.)
    - description: string
    - date: string (ISO 8601 format YYYY-MM-DD, default to Current Date ${today} if not specified)
    
    Only return the JSON object, no other text.
  `;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if present
        const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch (error: any) {
        console.error("Error parsing transaction with Gemini:", error);
        if (error.message?.includes('429') || error.status === 429) {
            throw new Error("RATE_LIMIT");
        }
        throw new Error("Failed to parse transaction input");
    }
};

export const parseBankStatement = async (text: string): Promise<any[]> => {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = `
        Analyze the following text from a bank statement or credit card bill.
        Extract all transactions into a JSON array.
        For each transaction, extract:
        - date (YYYY-MM-DD)
        - description (merchant name or details)
        - amount (number, positive for income, negative for expense)
        - type ('income' or 'expense')
        - category (guess a category like 'Food', 'Transport', 'Shopping', 'Salary', 'Transfer', etc.)

        If the text contains no transactions, return an empty array [].
        Return ONLY the JSON array, no markdown formatting.

        Text:
        ${text.substring(0, 30000)} 
        `; // Limit text length to avoid token limits

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();

        const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
        const transactions = JSON.parse(cleanJson);
        return transactions.map((t: any) => ({
            ...t,
            amount: Math.abs(t.amount)
        }));
    } catch (error: any) {
        console.error('Gemini Statement Parse Error:', error);
        if (error.message?.includes('429') || error.status === 429) {
            throw new Error("RATE_LIMIT");
        }
        return [];
    }
};
