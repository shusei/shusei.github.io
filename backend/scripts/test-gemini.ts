import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, '../.env') });

const run = async () => {
    const key = process.env.GEMINI_API_KEY;
    console.log(`Checking API Key: ${key ? 'Present' : 'Missing'}`);

    if (!key) {
        console.error("❌ GEMINI_API_KEY is missing");
        return;
    }

    const genAI = new GoogleGenerativeAI(key);
    const models = [
        "gemini-2.0-flash-lite-preview-02-05",
        "gemini-flash-latest",
        "gemini-2.0-flash-exp",
        "gemini-1.5-flash-latest"
    ];

    for (const modelName of models) {
        console.log(`\n👉 Testing model via SDK: ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            const response = await result.response;
            console.log(`✅ SUCCESS with ${modelName}:`, response.text());
            return; // Exit on first success
        } catch (error: any) {
            console.error(`❌ FAILED with ${modelName}:`, error.message);
            if (error.response) {
                console.error("Status:", error.response.status);
            }
        }
    }
    console.error("\n💥 All alternative models failed.");
};

run();
