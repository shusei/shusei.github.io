"use client";

import React, { useState, useRef, useEffect } from "react";
import { Quest } from "../lib/api";

interface ChatMessage {
    role: "user" | "model";
    parts: { text: string }[];
}

interface QuestDraft {
    is_ready: boolean;
    title?: string;
    description?: string;
    guild_class?: string;
    risk_level?: string;
    suggested_reward?: number;
    tags?: string[];
}

interface GalGameChatProps {
    onPublish: (quest: QuestDraft) => void;
}

export default function GalGameChat({ onPublish }: GalGameChatProps) {
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [currentDialogue, setCurrentDialogue] = useState("歡迎來到冒險者公會！我是接待員庫洛米喵～有什麼可以幫您的嗎？");
    const [currentExpression, setCurrentExpression] = useState<"normal" | "thinking" | "surprised" | "happy">("normal");
    const [inputText, setInputText] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [questDraft, setQuestDraft] = useState<QuestDraft | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [history, currentDialogue]);

    const handleSend = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!inputText.trim() || isTyping) return;

        const userMessage = inputText.trim();
        setInputText("");
        setIsTyping(true);

        const newHistory = [...history, { role: "user" as const, parts: [{ text: userMessage }] }];
        setHistory(newHistory);

        try {
            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
            const res = await fetch(`${API_BASE_URL}/quests/receptionist/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ history: newHistory, message: userMessage })
            });

            if (!res.ok) throw new Error("API Request Failed");

            const aiResponse = await res.json();

            // Update UI with Catgirl's response
            setCurrentDialogue(aiResponse.dialogue);

            // If thinking sprite failed to generate, fallback to normal
            if (aiResponse.expression === "thinking") {
                // Try to load thinking, but if it doesn't exist the browser will show broken image.
                // We rely on the backend expression if it's one of the 4.
            }
            setCurrentExpression(aiResponse.expression || "normal");

            if (aiResponse.quest_draft) {
                setQuestDraft(aiResponse.quest_draft);
            }

            // Append model response to history for next turn
            setHistory([...newHistory, { role: "model" as const, parts: [{ text: aiResponse.dialogue }] }]);

        } catch (error) {
            console.error(error);
            setCurrentDialogue("唔...公會的通訊魔導器好像出了點問題喵，請稍後再試！");
            setCurrentExpression("surprised");
        } finally {
            setIsTyping(false);
        }
    };

    return (
        <div className="relative w-full h-screen overflow-hidden bg-gradient-to-br from-[#2a1b15] to-[#120a05] font-sans flex items-center justify-center">

            {/* Ambient Background (Tavern / Guild feel) */}
            <div className="absolute inset-0 opacity-40 mix-blend-overlay pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #8b5a2b 0%, transparent 70%)' }}>
            </div>

            {/* Character Sprite Container */}
            <div className="absolute bottom-[20%] left-1/2 transform -translate-x-1/2 w-[600px] h-[800px] pointer-events-none z-10 flex justify-center items-end transition-all duration-500 ease-in-out">
                {/* Fallback to normal if thinking fails to load handled in state now */}
                <img
                    src={`/sprites/${currentExpression}.png`}
                    alt="Kuromi"
                    className="max-h-full object-contain drop-shadow-2xl transition-all duration-300"
                />
            </div>

            {/* Left/Right Container for Quest Draft */}
            {questDraft && (
                <div className={`absolute right-10 top-1/2 transform -translate-y-1/2 w-80 bg-[#f4e4c1] text-[#3e2723] p-6 rounded-sm shadow-2xl z-20 border-2 border-[#8d6e63] border-dashed transition-all duration-700 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${questDraft.is_ready ? 'scale-100 opacity-100' : 'scale-95 opacity-80'}`}
                    style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/aged-paper.png')" }}>
                    <div className="text-center font-bold text-xl border-b-2 border-[#8d6e63] pb-2 mb-4">
                        📜 委託單草稿
                    </div>

                    <div className="space-y-3 text-sm">
                        <div><span className="font-bold text-black">標題：</span> {questDraft.title || '（未定）'}</div>
                        <div><span className="font-bold text-black">類別：</span> {questDraft.guild_class || '（未知）'}</div>
                        <div><span className="font-bold text-black">風險：</span> <span className={`font-bold ${questDraft.risk_level === 'L2' ? 'text-red-700' : questDraft.risk_level === 'L1' ? 'text-yellow-700' : 'text-green-700'}`}>{questDraft.risk_level || 'L0'}</span></div>
                        <div><span className="font-bold text-black">賞金：</span> <span className="font-bold text-amber-700">{questDraft.suggested_reward || 0} GP</span></div>

                        <div className="pt-2"><span className="font-bold border-b border-[#3e2723]">委託詳情</span></div>
                        <p className="min-h-[60px] italic bg-[#ecd4a2] p-2 rounded shrink-0">{questDraft.description || '（等待更多資訊...）'}</p>

                        {questDraft.tags && questDraft.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {questDraft.tags.map(tag => (
                                    <span key={tag} className="bg-[#5d4037] text-[#efebe9] text-xs px-2 py-1 rounded shadow-inner">{tag}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    {questDraft.is_ready && (
                        <button
                            onClick={() => onPublish(questDraft)}
                            className="w-full mt-6 bg-[#d84315] hover:bg-[#bf360c] text-white font-bold py-3 rounded shadow-[0_4px_0_#870000] active:translate-y-[4px] active:shadow-none transition-all duration-100 uppercase tracking-widest relative overflow-hidden group">
                            <span className="relative z-10 text-shadow-md">🖋️ 簽署並發布委託</span>
                        </button>
                    )}
                </div>
            )}

            {/* Bottom Visual Novel Dialogue Box */}
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-[80%] max-w-4xl z-30 flex flex-col items-center">

                {/* Character Name Badge */}
                <div className="self-start ml-8 mb-[-10px] z-40 bg-gradient-to-r from-pink-500 to-rose-400 text-white font-bold py-1 px-6 rounded-tr-xl rounded-tl-md shadow-lg border-2 border-white/20">
                    接待員 庫洛米
                </div>

                {/* Main Text Box */}
                <div className="w-full bg-black/70 backdrop-blur-md text-white border-2 border-white/20 rounded-xl p-8 pb-12 shadow-2xl relative overflow-hidden group hover:border-pink-300/50 transition-colors duration-300">

                    {/* Glassmorphism corner highlights */}
                    <div className="absolute top-0 left-0 w-20 h-20 bg-pink-500/20 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-rose-500/20 rounded-full blur-3xl"></div>

                    <p className="text-xl md:text-2xl font-serif leading-relaxed tracking-wide text-gray-100 relative z-10 min-h-[80px]">
                        {currentDialogue}
                        {isTyping && <span className="animate-pulse ml-1 inline-block w-3 h-3 bg-pink-400 rounded-full"></span>}
                    </p>
                </div>

                {/* User Input Area */}
                <form onSubmit={handleSend} className="w-full mt-[-20px] z-40 px-8 flex gap-4">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="請敘述您的委託需求... (例如: 我家有好幾袋垃圾需要人幫忙丟)"
                        className="flex-1 bg-white/10 backdrop-blur-xl border border-white/30 text-white placeholder-gray-400 px-6 py-4 rounded-full shadow-2xl focus:outline-none focus:ring-2 focus:ring-pink-500 focus:bg-white/20 transition-all duration-300 text-lg"
                        disabled={isTyping}
                        autoFocus
                    />
                    <button
                        type="submit"
                        disabled={isTyping || !inputText.trim()}
                        className="bg-white/20 backdrop-blur-xl hover:bg-pink-500 text-white font-bold px-8 rounded-full border border-white/30 shadow-2xl transition-all duration-300 disabled:opacity-50 disabled:hover:bg-white/20 whitespace-nowrap text-lg group">
                        傳送 <span className="group-hover:translate-x-1 inline-block transition-transform duration-200">➤</span>
                    </button>
                </form>

            </div>
            {/* Hidden div to scroll to */}
            <div ref={messagesEndRef} />
        </div>
    );
}
