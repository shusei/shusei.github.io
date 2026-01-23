"use client";

import { useState } from "react";
import axios from "axios";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const SmartEntry = () => {
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        setLoading(true);
        try {
            // 1. Parse with AI
            const parseRes = await axios.post("http://localhost:3000/api/transactions/smart", {
                input
            });
            const data = parseRes.data;

            // 2. Confirm & Create (In a real app, we might show a confirmation dialog here)
            // For now, we assume the AI is correct and create it directly if the API didn't already
            // Actually, our backend /smart endpoint only parses. We need to call /transactions to create.
            // Wait, let's check backend logic.
            // Backend /smart returns { parsed: ... }. It does NOT create.

            // So we need to create it.
            await axios.post("http://localhost:3000/api/transactions", {
                user_id: "b8b8984a-0782-4e36-b5ad-ce42ae297d1b", // Hardcoded for demo
                ...data.parsed
            });

            toast.success("記帳成功！", {
                description: `${data.parsed.date} - ${data.parsed.description} $${data.parsed.amount}`
            });
            setInput("");
        } catch (err) {
            console.error(err);
            toast.error("記帳失敗", { description: "請稍後再試" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-2 border-sky-100 shadow-sm">
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg font-medium text-sky-700">
                    <Sparkles className="w-5 h-5 mr-2 text-sky-500" />
                    AI 智慧記帳
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="例如：午餐吃牛肉麵 150 元..."
                        className="flex-1"
                        disabled={loading}
                    />
                    <Button type="submit" disabled={loading} className="bg-sky-600 hover:bg-sky-700">
                        {loading ? "處理中..." : <Send className="w-4 h-4" />}
                    </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2">
                    支援自然語言輸入，AI 會自動分析日期、金額與分類。
                </p>
            </CardContent>
        </Card>
    );
};
