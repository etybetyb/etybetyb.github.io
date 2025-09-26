
import React, { useState } from 'react';
import LoadingIcon from './LoadingIcon';

interface ThemeSelectorProps {
  onStart: (theme: string) => void;
  isLoading: boolean;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onStart, isLoading }) => {
  const [theme, setTheme] = useState('');
  const [placeholder, setPlaceholder] = useState('一棟鬧鬼的維多利亞式豪宅...');
  const placeholders = [
    "一座下著酸雨的賽博龐克城市...",
    "火星上最後的人類殖民地...",
    "一片充滿發光蘑菇的神秘森林...",
    "1940 年代紐約的黑色偵探故事...",
    "在荒涼的熱帶島嶼上求生..."
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (theme.trim() && !isLoading) {
      onStart(theme.trim());
    } else if (!theme.trim() && !isLoading) {
        onStart(placeholder);
    }
  };

  const handlePlaceholderClick = () => {
    const randomPlaceholder = placeholders[Math.floor(Math.random() * placeholders.length)];
    setPlaceholder(randomPlaceholder);
  }

  return (
    <div className="bg-slate-800/50 p-8 rounded-lg shadow-2xl border border-slate-700 animate-fade-in-up">
      <h2 className="text-2xl font-semibold text-cyan-300 mb-4 text-center">描述你的冒險</h2>
      <p className="text-slate-400 mb-6 text-center">你想探索一個什麼樣的世界？描述可以簡短或詳細。</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-900 border border-slate-600 rounded-md p-3 text-lg text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition duration-300 placeholder-slate-500"
          disabled={isLoading}
        />
        <p className="text-xs text-slate-500 text-center mt-2">
            或試試隨機主題： <button type="button" onClick={handlePlaceholderClick} className="underline hover:text-cyan-400">新點子</button>
        </p>
        <div className="mt-6 text-center">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition duration-300 transform hover:scale-105 shadow-lg w-full md:w-auto flex items-center justify-center mx-auto"
          >
            {isLoading ? (
              <>
                <LoadingIcon />
                構築世界中...
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

export default ThemeSelector;
