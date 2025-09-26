
import React from 'react';
import { SaveData } from '../types';

interface HomePageProps {
  saveSlots: (SaveData | null)[];
  onStartNewGame: (slotIndex: number) => void;
  onLoadGame: (slotIndex: number) => void;
  onDeleteSave: (slotIndex: number) => void;
}

const HomePage: React.FC<HomePageProps> = ({ saveSlots, onStartNewGame, onLoadGame, onDeleteSave }) => {
  return (
    <div className="bg-slate-800/50 p-8 rounded-lg shadow-2xl border border-slate-700 animate-fade-in-up backdrop-blur-sm">
      <h2 className="text-3xl font-bold text-cyan-300 mb-2 text-center">冒險日誌</h2>
      <p className="text-slate-400 mb-8 text-center">選擇你的旅程，或開啟一段新的傳說。</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {saveSlots.map((save, index) => (
          <div key={index} className="bg-slate-900/70 p-6 rounded-lg border border-slate-700 flex flex-col justify-between transition-shadow hover:shadow-cyan-500/20">
            <div className="flex-grow">
              <h3 className="text-xl font-semibold text-cyan-400 mb-2">存檔欄位 {index + 1}</h3>
              {save ? (
                <div>
                  <p className="text-slate-300 break-all"><strong>主題：</strong> {save.theme}</p>
                  <p className="text-slate-400 text-sm mt-1">
                    <strong>上次遊玩：</strong> {new Date(save.timestamp).toLocaleString()}
                  </p>
                </div>
              ) : (
                <p className="text-slate-500 italic">空的欄位</p>
              )}
            </div>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {save ? (
                <>
                  <button
                    onClick={() => onLoadGame(index)}
                    className="flex-1 bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-500 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg text-base"
                  >
                    載入冒險
                  </button>
                  <button
                    onClick={() => onDeleteSave(index)}
                    className="flex-shrink-0 bg-red-800/80 text-white font-bold p-2 rounded-lg hover:bg-red-700/80 transition-all duration-300"
                    title="刪除存檔"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                    </svg>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => onStartNewGame(index)}
                  className="w-full bg-slate-700/70 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-600/70 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg text-base"
                >
                  開啟新冒險
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
