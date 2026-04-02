'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchQuests, Quest } from '../../lib/api';
import { QuestCard } from '../../components/QuestCard';

export default function QuestBoard() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadQuests() {
      try {
        const data = await fetchQuests();
        setQuests(data);
      } catch (error) {
        console.error('Failed to load quests', error);
      } finally {
        setLoading(false);
      }
    }
    loadQuests();
  }, []);

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 font-sans selection:bg-amber-900 selection:text-amber-100">
      {/* Header / Navigation */}
      <header className="border-b border-stone-800 bg-stone-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🛡️</span>
            <span className="text-xl font-bold tracking-tight text-amber-500">Project Guild</span>
          </Link>
          <nav className="flex space-x-6 text-sm font-medium text-stone-400">
            <Link href="/" className="hover:text-amber-400 transition-colors">公會大廳</Link>
            <Link href="/quests" className="text-amber-400 transition-colors">任務公告欄</Link>
            <Link href="/profile" className="hover:text-amber-400 transition-colors">冒險者執照</Link>
          </nav>
          <div className="flex gap-4">
             <Link href="/post-quest" className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-lg shadow-amber-900/20">
              發布委託
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 space-y-12">
        <section className="space-y-4">
          <h1 className="text-4xl font-extrabold text-stone-100 tracking-tight">任務公告欄 (Quest Board)</h1>
          <p className="text-stone-400 max-w-2xl">
            這裡匯集了所有的冒險者委託。請根據您的自身能力、當前階級與風險偏好，接取合適的任務。
          </p>
        </section>

        <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar Filters (Static for now) */}
            <aside className="w-full md:w-64 space-y-6 shrink-0">
                <div className="bg-stone-950 border border-stone-800 p-6 rounded-xl space-y-4">
                    <h3 className="font-bold text-amber-500 text-sm uppercase tracking-widest">任務分類</h3>
                    <div className="space-y-2 text-sm text-stone-400">
                        <label className="flex items-center gap-2 cursor-pointer hover:text-stone-200">
                            <input type="checkbox" defaultChecked className="accent-amber-600" /> 全部
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:text-stone-200">
                            <input type="checkbox" className="accent-amber-600" /> ⚔️ 討伐 (Slay)
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:text-stone-200">
                            <input type="checkbox" className="accent-amber-600" /> 🌿 採集 (Gather)
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:text-stone-200">
                            <input type="checkbox" className="accent-amber-600" /> 🛡️ 護送 (Escort)
                        </label>
                    </div>
                </div>

                <div className="bg-stone-950 border border-stone-800 p-6 rounded-xl space-y-4">
                    <h3 className="font-bold text-amber-500 text-sm uppercase tracking-widest">風險等級</h3>
                    <div className="space-y-2 text-sm text-stone-400">
                        <label className="flex items-center gap-2 cursor-pointer hover:text-stone-200">
                            <input type="checkbox" defaultChecked className="accent-amber-600" /> L0 - 線上委託
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:text-stone-200">
                            <input type="checkbox" defaultChecked className="accent-amber-600" /> L1 - 跑腿任務
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer hover:text-stone-200">
                            <input type="checkbox" className="accent-amber-600" /> L2 - 到府高危
                        </label>
                    </div>
                </div>
            </aside>

            {/* Quests Display */}
            <div className="flex-1">
                {loading ? (
                    <div className="grid md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-48 bg-stone-950 border border-stone-800 rounded-xl animate-pulse"></div>
                        ))}
                    </div>
                ) : quests.length === 0 ? (
                    <div className="text-center py-20 bg-stone-950 rounded-xl border border-stone-800 border-dashed">
                        <p className="text-stone-500 text-lg">目前沒有符合條件的委託。</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {quests.map((quest) => (
                            <QuestCard
                                key={quest.id}
                                quest={quest}
                                adventurerId="d220ee37-62ad-4360-a61e-964ee40b92bf"
                                onQuestAccepted={(id: string) => {
                                    setQuests(prev => prev.map(q => q.id === id ? { ...q, status: 'accepted' as const } : q));
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
      </main>

      <footer className="border-t border-stone-800 bg-stone-950 mt-20 py-12">
        <div className="container mx-auto px-4 text-center text-stone-500">
          <p>© 2026 Project Guild. All rights reserved.</p>
        </div>
      </footer>
    </div >
  );
}
