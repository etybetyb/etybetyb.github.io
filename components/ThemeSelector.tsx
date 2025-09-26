import React, { useState } from 'react';
import LoadingIcon from './LoadingIcon';

interface ThemeSelectorProps {
  onStart: (theme: string) => void;
  isLoading: boolean;
}

const classicThemes = [
  "一座下著酸雨的賽博龐克城市",
  "火星上最後的人類殖民地",
  "一片充滿發光蘑菇的神秘森林",
  "1940 年代紐約的黑色偵探故事",
  "在荒涼的熱帶島嶼上求生",
  "一艘探索未知星系的深空太空船"
];

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
    <div className="bg-slate-800/50 p-8 rounded-lg shadow-2xl border border-slate-700 animate-fade-in-up backdrop-blur-sm">
      <h2 className="text-2xl font-semibold text-cyan-300 mb-4 text-center">描述你的冒險</h2>
      <p className="text-slate-400 mb-6 text-center">自由發揮你的想像力，或從下方的經典主題中選擇。</p>
      
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
            不知道玩什麼？ <button type="button" onClick={handlePlaceholderClick} className="underline hover:text-cyan-400">來點靈感</button>
        </p>
        <div className="mt-6 text-center">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg w-full md:w-auto flex items-center justify-center mx-auto"
          >
            {isLoading && theme ? (
              <>
                <LoadingIcon />
                構築世界中...
              </>
            ) : (
              '用這個主題開始'
            )}
          </button>
        </div>
      </form>

      <div className="my-8 flex items-center" aria-hidden="true">
        <hr className="flex-grow border-t border-slate-600" />
        <span className="mx-4 text-slate-400 text-sm">或</span>
        <hr className="flex-grow border-t border-slate-600" />
      </div>

      <div>
        <h3 className="text-xl font-semibold text-cyan-300 mb-4 text-center">從經典主題中選擇</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {classicThemes.map((classicTheme, index) => (
            <button
              key={index}
              onClick={() => onStart(classicTheme)}
              disabled={isLoading}
              className="text-left bg-slate-700/70 p-4 rounded-lg border border-slate-600 hover:bg-cyan-800/50 hover:border-cyan-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-1 active:scale-95 flex items-center justify-between"
            >
              <span>{classicTheme}</span>
              {isLoading ? (
                <LoadingIcon />
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;
