import React, { useState } from 'react';

interface ApiKeyInputProps {
  onKeySubmit: (key: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onKeySubmit }) => {
  const [key, setKey] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (key.trim()) {
      onKeySubmit(key.trim());
    }
  };

  return (
    <div className="bg-slate-800/50 p-8 rounded-lg shadow-2xl border border-slate-700 animate-fade-in-up backdrop-blur-sm">
      <h2 className="text-2xl font-semibold text-cyan-300 mb-4 text-center">輸入您的 API 金鑰</h2>
      <p className="text-slate-400 mb-6 text-center">
        要遊玩此遊戲，您需要一個 Google AI API 金鑰。您可以從 
        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-cyan-400 underline hover:text-cyan-300">
          Google AI Studio
        </a>
         免費取得。
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="請在此貼上您的 API 金鑰"
          className="w-full bg-slate-900 border border-slate-600 rounded-md p-3 text-lg text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition duration-300 placeholder-slate-500"
        />
        <p className="text-xs text-slate-500 text-center mt-2">
            您的金鑰只會儲存在此瀏覽器工作階段中。
        </p>
        <div className="mt-6 text-center">
          <button
            type="submit"
            disabled={!key.trim()}
            className="bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg w-full md:w-auto"
          >
            儲存並開始
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApiKeyInput;