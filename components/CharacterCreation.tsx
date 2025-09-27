
import React, { useState, useEffect } from 'react';
import LoadingIcon from './LoadingIcon';

interface CharacterCreationProps {
  onConfirm: (name: string, background: string) => void;
  isLoading: boolean;
  loadingMessage: string;
  theme: string | null;
  initialIntroduction: string | null;
}

const randomNames = [
    '艾拉', '雷戈', '莉娜', '卡恩', '莎拉',
    '傑斯', '諾娃', '瑞克', '菲歐', '洛奇'
];

const CharacterCreation: React.FC<CharacterCreationProps> = ({ onConfirm, isLoading, loadingMessage, theme, initialIntroduction }) => {
  const [name, setName] = useState('');
  const [background, setBackground] = useState('');

  useEffect(() => {
    if (initialIntroduction) {
      setBackground(initialIntroduction);
    }
  }, [initialIntroduction]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isLoading) {
      let finalName = name.trim();
      if (!finalName) {
        finalName = randomNames[Math.floor(Math.random() * randomNames.length)];
      }
      onConfirm(finalName, background.trim());
    }
  };

  return (
    <div className="bg-slate-800/50 p-8 rounded-lg shadow-2xl border border-slate-700 animate-fade-in-up backdrop-blur-sm max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold text-cyan-300 mb-2 text-center">創建你的角色</h2>
      <p className="text-slate-400 mb-6 text-center">你的冒險主題是：<strong className="text-cyan-400">{theme || '未知'}</strong></p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="character-name" className="block text-lg font-medium text-slate-300 mb-2">你的名字</label>
          <input
            id="character-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`例如：${randomNames[0]}`}
            className="w-full bg-slate-900 border border-slate-600 rounded-md p-3 text-lg text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition duration-300 placeholder-slate-500"
            disabled={isLoading}
            autoFocus
          />
           <p className="text-xs text-slate-500 text-center mt-2">
            若留白，將會隨機產生一個名字。
          </p>
        </div>

        <div>
            <label htmlFor="character-introduction" className="block text-lg font-medium text-slate-300 mb-2">你的腳色介紹</label>
            <textarea
                id="character-introduction"
                value={background}
                onChange={(e) => setBackground(e.target.value)}
                placeholder={initialIntroduction ? '' : '正在生成腳色介紹...'}
                className="w-full bg-slate-900 border border-slate-600 rounded-md p-3 text-lg text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition duration-300 placeholder-slate-500 h-32 resize-y"
                disabled={isLoading || !initialIntroduction}
            />
            <p className="text-xs text-slate-500 text-center mt-2">
                這是 AI 為你生成的腳色介紹，你可以自由修改它，決定你在這個故事中的起點。
            </p>
        </div>

        <div className="mt-6 text-center">
          <button
            type="submit"
            disabled={isLoading || !background.trim()}
            className="bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg w-full md:w-auto flex items-center justify-center mx-auto"
          >
            {isLoading ? (
              <>
                <LoadingIcon />
                {loadingMessage || '處理中...'}
              </>
            ) : (
              '開始冒險'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CharacterCreation;
