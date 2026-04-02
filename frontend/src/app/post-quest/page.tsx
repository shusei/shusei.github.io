"use client";

import React, { useState } from 'react';
import GalGameChat from '../../components/GalGameChat';
import { useRouter } from 'next/navigation';

export default function PostQuestPage() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    const handlePublish = async (questDraft: any) => {
        if (submitting) return;
        setSubmitting(true);

        try {
            // Mock creator_id for MVP
            const payload = {
                title: questDraft.title,
                description: questDraft.description,
                guild_class: questDraft.guild_class,
                risk_level: questDraft.risk_level,
                reward_gp: questDraft.suggested_reward,
                tags: questDraft.tags,
                creator_id: "b8b8984a-0782-4e36-b5ad-ce42ae297d1b", // Dummy user ID from Seed script
                location: "公會大廳發布"
            };

            const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';
            const res = await fetch(`${API_BASE_URL}/quests`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error("Failed to post quest");

            // Redirect back to home after successful poster
            router.push("/");
            router.refresh();

        } catch (error) {
            console.error("Publishing error:", error);
            alert("發布委託失敗，請稍後再試！");
            setSubmitting(false);
        }
    };

    return (
        <main className="w-full h-screen bg-black overflow-hidden relative">
            <GalGameChat onPublish={handlePublish} />
            
            {submitting && (
                <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center backdrop-blur-sm transition-opacity">
                    <div className="text-pink-400 text-2xl font-bold animate-pulse flex items-center gap-4">
                        <span className="w-8 h-8 rounded-full border-4 border-t-white animate-spin"></span>
                        正在由公會紀錄官蓋章備查中...
                    </div>
                </div>
            )}
        </main>
    );
}
