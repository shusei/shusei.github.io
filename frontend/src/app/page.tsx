'use client';

import React from 'react';
import Link from 'next/link';

export default function GuildHall() {
  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 font-sans selection:bg-amber-900 selection:text-amber-100">
      {/* Header / Navigation */}
      <header className="border-b border-stone-800 bg-stone-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🛡️</span>
            <span className="text-xl font-bold tracking-tight text-amber-500">Project Guild</span>
          </div>
          <nav className="flex space-x-6 text-sm font-medium text-stone-400">
            <Link href="/" className="hover:text-amber-400 transition-colors">公會大廳</Link>
            <Link href="/quests" className="hover:text-amber-400 transition-colors">任務公告欄</Link>
            <Link href="/profile" className="hover:text-amber-400 transition-colors">冒險者執照</Link>
          </nav>
          <div className="flex items-center space-x-4">
            <button className="text-sm font-medium hover:text-white transition-colors">登入</button>
            <button className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-lg shadow-amber-900/20">
              註冊公會
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12 space-y-20">
        <section className="text-center space-y-6 py-12 relative overflow-hidden rounded-3xl bg-stone-950 border border-stone-800 shadow-2xl">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-leather.png')] opacity-20"></div>
          <div className="relative z-10">
            <div className="inline-block px-3 py-1 rounded-full bg-amber-950/50 border border-amber-900 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-4">
              Demo Phase • Alpha 0.1
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-stone-100 tracking-tight leading-tight">
              現實生活的 <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-600">冒險者公會</span>
            </h1>
            <p className="max-w-2xl mx-auto text-lg text-stone-400 leading-relaxed">
              將日常瑣事轉化為冒險任務。接取委託、累積名聲、晉升階級。<br />
              這是你的公會，你的冒險，你的傳說。
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <Link href="/quests" className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-4 rounded-lg text-lg font-bold transition-all transform hover:scale-105 shadow-xl shadow-amber-900/30 flex items-center">
                <span>⚔️ 前往任務公告欄</span>
              </Link>
              <button className="bg-stone-800 hover:bg-stone-700 text-stone-200 px-8 py-4 rounded-lg text-lg font-bold transition-all border border-stone-700">
                發布委託
              </button>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid md:grid-cols-3 gap-8">
          <div className="bg-stone-950 border border-stone-800 p-8 rounded-2xl hover:border-amber-900/50 transition-colors group">
            <div className="w-12 h-12 bg-stone-900 rounded-lg flex items-center justify-center mb-6 group-hover:bg-amber-900/20 transition-colors">
              <span className="text-2xl">📜</span>
            </div>
            <h3 className="text-xl font-bold text-stone-100 mb-2">RPG 任務系統</h3>
            <p className="text-stone-400 leading-relaxed">
              從討伐 (打掃) 到採集 (跑腿)，所有工作都被分類為公會任務。完成任務獲取 GP 與名聲。
            </p>
          </div>
          <div className="bg-stone-950 border border-stone-800 p-8 rounded-2xl hover:border-amber-900/50 transition-colors group">
            <div className="w-12 h-12 bg-stone-900 rounded-lg flex items-center justify-center mb-6 group-hover:bg-amber-900/20 transition-colors">
              <span className="text-2xl">⚖️</span>
            </div>
            <h3 className="text-xl font-bold text-stone-100 mb-2">公會托管支付</h3>
            <p className="text-stone-400 leading-relaxed">
              公會作為公正第三方，資金暫存於 Escrow 帳本。驗收通過才放款，保障雙方權益。
            </p>
          </div>
          <div className="bg-stone-950 border border-stone-800 p-8 rounded-2xl hover:border-amber-900/50 transition-colors group">
            <div className="w-12 h-12 bg-stone-900 rounded-lg flex items-center justify-center mb-6 group-hover:bg-amber-900/20 transition-colors">
              <span className="text-2xl">🛡️</span>
            </div>
            <h3 className="text-xl font-bold text-stone-100 mb-2">S 級風控與信任</h3>
            <p className="text-stone-400 leading-relaxed">
              嚴格的等級制度與實名認證。只有高信譽的冒險者才能承接 L2 到府高風險任務。
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-stone-800 bg-stone-950 mt-20 py-12">
        <div className="container mx-auto px-4 text-center text-stone-500">
          <p>© 2026 Project Guild / Moonlight Savior. All rights reserved.</p>
          <p className="text-xs mt-2 opacity-50">Backend Engineering Showcase Demo</p>
        </div>
      </footer>
    </div>
  );
}
