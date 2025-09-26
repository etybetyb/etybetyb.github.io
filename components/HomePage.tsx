import React from 'react';

interface HomePageProps {
  onNewGame: () => void;
  onContinueGame: () => void;
  hasSaveData: boolean;
}

const HomePage: React.FC<HomePageProps> = ({ onNewGame, onContinueGame, hasSaveData }) => {
  return (
    <div className="bg-slate-800/50 p-8 rounded-lg shadow-2xl border border-slate-700 animate-fade-in-up backdrop-blur-sm text-center">
      <h2 className="text-3xl font-bold text-cyan-300 mb-4">歡迎回來，冒險者</h2>
      <p className="text-slate-400 mb-8">你的旅程將從何處開始？</p>
      
      <div className="flex flex-col md:flex-row justify-center items-center gap-6">
        <button
          onClick={onNewGame}
          className="bg-cyan-600 text-white font-bold py-4 px-10 rounded-lg hover:bg-cyan-500 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg w-full md:w-auto text-lg"
        >
          新冒險
        </button>
        
        <button
          onClick={onContinueGame}
          disabled={!hasSaveData}
          className="bg-slate-700/70 text-white font-bold py-4 px-10 rounded-lg hover:bg-slate-600/70 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg w-full md:w-auto text-lg disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed disabled:transform-none"
        >
          繼續旅程
        </button>
      </div>
      {!hasSaveData && (
        <p className="text-slate-500 mt-4 text-sm">找不到先前的冒險紀錄。</p>
      )}
    </div>
  );
};

export default HomePage;
