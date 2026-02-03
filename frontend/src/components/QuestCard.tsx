
import React, { useState } from 'react';
import { Quest, acceptQuest } from '../lib/api';
import { toast } from 'sonner';

interface QuestCardProps {
    quest: Quest;
    adventurerId?: string;
    onQuestAccepted?: (questId: string) => void;
}

const CLASS_BADGES: Record<string, { label: string; color: string; icon: string }> = {
    SLAY: { label: '討伐', color: 'bg-red-900/50 text-red-200 border-red-800', icon: '⚔️' },
    GATHER: { label: '採集', color: 'bg-emerald-900/50 text-emerald-200 border-emerald-800', icon: '🌿' },
    ESCORT: { label: '護送', color: 'bg-blue-900/50 text-blue-200 border-blue-800', icon: '🛡️' },
    PUZZLE: { label: '解謎', color: 'bg-purple-900/50 text-purple-200 border-purple-800', icon: '🧩' },
    OTHER: { label: '其他', color: 'bg-stone-800 text-stone-300 border-stone-700', icon: '📜' },
};

const RISK_BADGES: Record<string, { label: string; color: string }> = {
    L0: { label: 'L0 線上', color: 'text-stone-400' },
    L1: { label: 'L1 公共', color: 'text-amber-400' },
    L2: { label: 'L2 到府', color: 'text-red-500 font-bold' },
};

export function QuestCard({ quest, adventurerId, onQuestAccepted }: QuestCardProps) {
    const badge = CLASS_BADGES[quest.guild_class] || CLASS_BADGES['OTHER'];
    const risk = RISK_BADGES[quest.risk_level] || RISK_BADGES['L0'];
    const [isAccepting, setIsAccepting] = useState(false);

    const handleAccept = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click
        if (!adventurerId) {
            toast.error('您尚未登入冒險者帳號！');
            return;
        }

        setIsAccepting(true);
        const result = await acceptQuest(quest.id, adventurerId);
        setIsAccepting(false);

        if (result.success) {
            toast.success(`委託「${quest.title}」已接取！`);
            if (onQuestAccepted) onQuestAccepted(quest.id);
        } else {
            toast.error(result.message || '接取失敗，可能已被搶走。');
        }
    };

    return (
        <div className="bg-stone-900/80 backdrop-blur-sm border border-stone-800 p-6 rounded-xl hover:border-amber-700/50 transition-all hover:shadow-lg hover:shadow-amber-900/10 group cursor-pointer relative overflow-hidden flex flex-col h-full">
            {/* Paper texture overlay */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cardboard-flat.png')] opacity-5 pointer-events-none"></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`px-3 py-1 rounded-md text-xs font-bold border flex items-center gap-2 ${badge.color}`}>
                    <span>{badge.icon}</span>
                    <span>{badge.label}</span>
                </div>
                <span className={`text-xs font-mono border border-stone-800 px-2 py-1 rounded bg-stone-950 ${risk.color}`}>
                    {risk.label}
                </span>
            </div>

            <h3 className="text-lg font-bold text-stone-100 mb-2 group-hover:text-amber-400 transition-colors line-clamp-1">{quest.title}</h3>
            <p className="text-stone-400 text-sm mb-6 line-clamp-2 h-10">{quest.description}</p>

            <div className="flex items-center justify-between border-t border-stone-800 pt-4 relative z-10 mt-auto">
                <div className="flex items-center gap-2">
                    <span className="text-amber-500 text-xs uppercase tracking-wider font-semibold">Reward</span>
                    <span className="text-lg font-bold text-amber-300">{quest.reward_gp} GP</span>
                </div>

                {quest.status === 'posted' ? (
                    <button
                        onClick={handleAccept}
                        disabled={isAccepting}
                        className="bg-stone-800 hover:bg-amber-700 hover:text-white text-stone-300 px-3 py-1.5 rounded-md text-sm font-medium transition-all border border-stone-700 hover:border-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isAccepting ? '搶單中...' : '接取委託'}
                    </button>
                ) : (
                    <span className="text-xs font-mono text-stone-500 border border-stone-800 px-2 py-1 rounded">
                        {quest.status.toUpperCase()}
                    </span>
                )}
            </div>
        </div>
    );
}
