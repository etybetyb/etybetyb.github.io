

import React, { useState } from 'react';

interface ThemeSelectorProps {
  onThemeSelected: (theme: string) => void;
  onGenerateInspiration: () => Promise<string | null>;
}

const classicThemes = [
  "與夥伴的末日求生之旅",
  "穿越到戀愛遊戲世界是否搞錯了什麼",
  "小人物的官場求生記",
  "修真世界裡，只有我是TRPG腳色",
  "一醒來，怪物在我面前出現，發現是新手教學",
  "一座下著酸雨的賽博龐克城市",
  "火星上最後的人類殖民地",
  "1940 年代紐約的黑色偵探故事",
  "在荒涼的熱帶島嶼上求生",
  "一艘探索未知星系的深空太空船"


];

const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onThemeSelected, onGenerateInspiration }) => {
  const [theme, setTheme] = useState('');
  const [placeholder, setPlaceholder] = useState('一棟鬧鬼的維多利亞式豪宅...');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (theme.trim()) {
      onThemeSelected(theme.trim());
    } else {
      onThemeSelected(placeholder.endsWith('...') ? placeholder.slice(0, -3) : placeholder);
    }
  };

  const handleInspirationClick = async () => {
    setIsGenerating(true);
    try {
      const inspiration = await onGenerateInspiration();
      if (inspiration) {
        setPlaceholder(inspiration);
      } else {
        setPlaceholder("無法獲取靈感，請檢查網路或 API 金鑰。");
      }
    } catch (error) {
      console.error("Error fetching inspiration:", error);
      setPlaceholder("生成靈感時發生錯誤...");
    } finally {
      setIsGenerating(false);
    }
  };


  return (
    <div className="bg-slate-800/50 p-8 rounded-lg shadow-2xl border border-slate-700 animate-fade-in-up backdrop-blur-sm">
      <h2 className="text-2xl font-semibold text-cyan-300 mb-4 text-center">選擇你的冒險主題</h2>
      <p className="text-slate-400 mb-6 text-center">自由發揮你的想像力，或從下方的經典主題中選擇。</p>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={theme}
          onChange={(e) => setTheme(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-slate-900 border border-slate-600 rounded-md p-3 text-lg text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition duration-300 placeholder-slate-500"
        />
        <p className="text-xs text-slate-500 text-center mt-2">
            不知道玩什麼？{' '}
            <button
              type="button"
              onClick={handleInspirationClick}
              className="underline hover:text-cyan-400 disabled:text-slate-500 disabled:cursor-wait"
              disabled={isGenerating}
            >
              來點靈感
            </button>
        </p>
        <div className="mt-6 text-center">
          <button
            type="submit"
            className="bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-cyan-500 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg w-full md:w-auto flex items-center justify-center mx-auto"
          >
            確認主題
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
              onClick={() => onThemeSelected(classicTheme)}
              className="text-left bg-slate-700/70 p-4 rounded-lg border border-slate-600 hover:bg-cyan-800/50 hover:border-cyan-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 transform hover:-translate-y-1 active:scale-95 flex items-center justify-between"
            >
              <span>{classicTheme}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ThemeSelector;
