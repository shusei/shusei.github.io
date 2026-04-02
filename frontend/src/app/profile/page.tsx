'use client';

import React from 'react';
import Link from 'next/link';

export default function AdventurerProfile() {
  const adventurer = {
    name: '庫洛米喵 (Kuromi)',
    rank: 'F',
    reputation: 150,
    completed_quests: 0,
    description: '剛剛加入公會的新生冒險者。雖然還沒接過正式任務，但對日常雜物整理和搬家很有自信喵！'
  };

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
            <Link href="/quests" className="hover:text-amber-400 transition-colors">任務公告欄</Link>
            <Link href="/profile" className="text-amber-400 transition-colors">冒險者執照</Link>
          </nav>
          <div className="flex gap-4">
             <Link href="/post-quest" className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-lg shadow-amber-900/20">
              發布委託
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl space-y-12">
        <section className="bg-stone-950 border border-stone-800 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-10"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center md:items-start">
            {/* Avatar / Shield */}
            <div className="w-32 h-32 bg-stone-900 border-4 border-amber-900 rounded-full flex items-center justify-center text-5xl shadow-inner">
               🐱
            </div>

            <div className="flex-1 space-y-4 text-center md:text-left">
              <div>
                <h1 className="text-3xl font-extrabold text-stone-100">{adventurer.name}</h1>
                <p className="text-amber-500 font-mono font-bold tracking-widest uppercase">Rank {adventurer.rank} Adventurer</p>
              </div>
              <p className="text-stone-400 leading-relaxed italic border-l-2 border-amber-900 pl-4">
                「{adventurer.description}」
              </p>
            </div>

            {/* Reputation Badge */}
            <div className="bg-amber-600/10 border border-amber-500/50 p-4 rounded-xl text-center min-w-[120px]">
                <div className="text-xs text-amber-500 uppercase font-bold">目前聲望</div>
                <div className="text-3xl font-bold text-amber-500">{adventurer.reputation}</div>
                <div className="text-[10px] text-stone-500 mt-1">Reputation Points</div>
            </div>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-8">
            <div className="bg-stone-950 border border-stone-800 p-8 rounded-2xl relative overflow-hidden group">
                <h3 className="text-xl font-bold text-stone-100 mb-6 flex items-center gap-2">
                    <span className="text-amber-500">📈</span> 冒險成就
                </h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center bg-stone-900/50 p-3 rounded-lg border border-stone-800">
                        <span className="text-stone-400">完成委託數</span>
                        <span className="font-bold text-stone-200">{adventurer.completed_quests}</span>
                    </div>
                    <div className="flex justify-between items-center bg-stone-900/50 p-3 rounded-lg border border-stone-800">
                        <span className="text-stone-400">目前階級進度</span>
                        <span className="font-bold text-stone-200">0%</span>
                    </div>
                </div>
            </div>

            <div className="bg-stone-950 border border-stone-800 p-8 rounded-2xl relative overflow-hidden group">
                <h3 className="text-xl font-bold text-stone-100 mb-6 flex items-center gap-2">
                    <span className="text-amber-500">🛡️</span> 專長與標籤
                </h3>
                <div className="flex flex-wrap gap-2">
                    {['除蟲專家', '熱心新人', '公會櫃台小助手', '貓咪擬人專長'].map(tag => (
                        <span key={tag} className="bg-stone-800 text-stone-400 px-3 py-1 rounded text-xs border border-stone-700">
                            #{tag}
                        </span>
                    ))}
                </div>
            </div>
        </section>

        <div className="text-center pt-8">
             <Link href="/post-quest" className="text-stone-500 hover:text-amber-500 text-sm transition-colors">
                ← 回公會發布委託
            </Link>
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
