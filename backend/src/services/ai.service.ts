import { GoogleGenerativeAI, Schema, SchemaType } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// The schema matching our required JSON output
const receptionistSchema: Schema = {
    type: SchemaType.OBJECT,
    properties: {
        dialogue: {
            type: SchemaType.STRING,
            description: "公會貓娘櫃台的對話回應，語氣可愛有活力，句尾偶爾帶「喵」或「尼雅」。根據對話情境調整語氣。"
        },
        expression: {
            type: SchemaType.STRING,
            description: "貓娘當下的表情: normal(預設微笑), thinking(思考中), surprised(驚訝/擔憂), happy(開心)",
            format: "enum",
            enum: ["normal", "thinking", "surprised", "happy"]
        },
        quest_draft: {
            type: SchemaType.OBJECT,
            description: "整理過的委託單草稿。如果資訊還太少不足以立案，則 is_ready 設為 false，並在對話中詢問更多細節。",
            properties: {
                is_ready: {
                    type: SchemaType.BOOLEAN,
                    description: "是否已蒐集到足夠資訊（標題、描述、分類、金額、風險）可以發布？"
                },
                title: {
                    type: SchemaType.STRING,
                    description: "根據需求總結的任務標題"
                },
                description: {
                    type: SchemaType.STRING,
                    description: "詳細任務描述"
                },
                guild_class: {
                    type: SchemaType.STRING,
                    description: "公會分類",
                    format: "enum",
                    enum: ["Slay", "Gather", "Escort", "Puzzle"]
                },
                risk_level: {
                    type: SchemaType.STRING,
                    description: "任務風險。純線上/數位為 L0；到府/進門檻/高度危險為 L2；一般線下跑腿為 L1。",
                    format: "enum",
                    enum: ["L0", "L1", "L2"]
                },
                suggested_reward: {
                    type: SchemaType.INTEGER,
                    description: "建議賞金(整數)，依難度或客戶提示，如未定則給予合理猜測(300~2000)"
                },
                tags: {
                    type: SchemaType.ARRAY,
                    items: { type: SchemaType.STRING },
                    description: "標籤，例如 #大掃除, #代購, #搬運"
                }
            },
            required: ["is_ready"]
        }
    },
    required: ["dialogue", "expression"]
};


export const chatWithReceptionistService = async (history: { role: "user" | "model", parts: { text: string }[] }[], newMessage: string) => {
    // We use gemini-2.5-flash as it supports system instructions and structured output beautifully
    const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: `妳叫「庫洛米」(Kuromi)，是一位在異世界冒險者公會工作的貓娘接待員。
        妳的個性活潑、可愛、熱心，偶爾有點小迷糊，句尾或感到興奮/疑惑時會加上「喵」或類似貓咪的語氣詞。遇到高賞金會很驚喜。
        妳的職責是傾聽委託人（使用者）的需求，將他們日常的瑣事（例如買消夜、打掃、找東西）轉化為公會正式的委託任務。
        妳需要判斷任務的「公會分類 (Guild Class: Slay/Gather/Escort/Puzzle)」與「風險等級 (Risk Level: L0數位/L1一般線下/L2到府高危)」。
        當使用者提出需求時：
        1. 如果資訊充足，可以整理好 quest_draft 並設定 is_ready=true。
        2. 如果資訊不明確（例如不知道金額或具體地點狀況），把 is_ready 設為 false，並在 dialogue 中用語音互動詢問確認。
        請務必遵守 JSON Schema。`,
        generationConfig: {
            responseMimeType: "application/json",
            responseSchema: receptionistSchema,
        }
    });

    try {
        const chat = model.startChat({
            history: history,
        });

        const result = await chat.sendMessage(newMessage);
        const responseText = result.response.text();
        
        return JSON.parse(responseText);
    } catch (error) {
        console.error("Error communicating with Gemini Receptionist:", error);
        throw new Error("Failed to process conversation");
    }
};
