import React, { useState, useEffect, useMemo } from 'react';
import { StoryStep, Choice, PlayerState } from '../types';
import LoadingIcon from './LoadingIcon';
import StoryLog from './StoryLog';
import PlayerStatus from './PlayerStatus';

interface GameScreenProps {
  storyLog: StoryStep[];
  choices: Choice[];
  playerState: PlayerState | null;
  isLoading: boolean;
  isGameOver: boolean;
  gameOverMessage: string;
  error: string | null;
  onMakeChoice: (choice: string) => void;
  onRestart: () => void;
  onOpenHistory: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({
  storyLog,
  choices,
  playerState,
  isLoading,
  isGameOver,
  gameOverMessage,
  error,
  onMakeChoice,
  onRestart,
  onOpenHistory,
}) => {
  const [isTyping, setIsTyping] = useState(true);
  const [isCustomChoiceActive, setIsCustomChoiceActive] = useState(false);
  const [customChoice, setCustomChoice] = useState('');

  useEffect(() => {
    if (!isLoading && storyLog.length > 0 && storyLog[storyLog.length - 1].type === 'scene') {
      setIsTyping(true);
      setIsCustomChoiceActive(false); // 重設自訂輸入
      setCustomChoice('');
    }
  }, [isLoading, storyLog]);

  const handleTypingComplete = () => {
    setIsTyping(false);
  };
  
  const handleCustomChoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customChoice.trim()) {
        onMakeChoice(customChoice.trim());
    }
  };

  // 建立一個只顯示最新內容的日誌，用於主遊戲畫面
  const displayLog = useMemo(() => {
    if (!storyLog || storyLog.length === 0) {
      return [];
    }
    const lastStep = storyLog[storyLog.length - 1];
    
    // 如果有前一步且那一步是 'choice'，則將選擇和結果一起顯示
    if (storyLog.length > 1 && storyLog[storyLog.length - 2].type === 'choice') {
      return [storyLog[storyLog.length - 2], lastStep];
    }
    
    // 否則，只顯示最新的步驟（例如遊戲開始的第一個場景）
    return [lastStep];
  }, [storyLog]);


  return (
    <div className="grid grid-cols-1 md:grid-cols-3 md:gap-8 animate-fade-in">
      {/* Main Story Column */}
      <div className="md:col-span-2 bg-slate-800/50 p-6 md:p-8 rounded-lg shadow-2xl border border-slate-700 backdrop-blur-sm mb-6 md:mb-0">
        <StoryLog storyLog={displayLog} onTypingComplete={handleTypingComplete} />

        {error && (
          <div className="my-4 p-4 bg-red-900/50 border border-red-700 rounded-md text-red-300 text-center">
            <p className="font-semibold">發生錯誤</p>
            <p>{error}</p>
          </div>
        )}

        {isLoading && !isGameOver && (
          <div className="flex items-center justify-center text-slate-400 my-4 p-4 text-lg">
            <LoadingIcon />
            <span className="ml-3">說書人正在思考...</span>
          </div>
        )}

        {!isLoading && !isGameOver && !isTyping && (
          <div className="mt-6 animate-fade-in">
            <h3 className="text-xl text-cyan-300 font-semibold mb-4 text-center">你接下來要做什麼？</h3>
            
            {!isCustomChoiceActive ? (
              <div className="grid grid-cols-1 gap-4">
                {choices.map((choice, index) => (
                  <button
                    key={index}
                    onClick={() => onMakeChoice(choice.text)}
                    className="w-full text-left bg-slate-700/70 p-4 rounded-lg border border-slate-600 hover:bg-cyan-800/50 hover:border-cyan-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50 transform hover:-translate-y-1 active:scale-95"
                    disabled={isLoading}
                  >
                    {choice.text}
                  </button>
                ))}
                <button
                    onClick={() => setIsCustomChoiceActive(true)}
                    className="w-full text-center bg-transparent p-4 rounded-lg border-2 border-dashed border-slate-600 text-slate-400 hover:border-cyan-600 hover:text-cyan-400 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    disabled={isLoading}
                >
                    其他... (自行輸入行動)
                </button>
              </div>
            ) : (
              <form onSubmit={handleCustomChoiceSubmit} className="space-y-4 animate-fade-in-fast">
                <input
                    type="text"
                    value={customChoice}
                    onChange={(e) => setCustomChoice(e.target.value)}
                    placeholder="輸入你的行動..."
                    className="w-full bg-slate-900 border border-slate-600 rounded-md p-3 text-lg text-slate-200 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition duration-300 placeholder-slate-500"
                    autoFocus
                />
                <div className="flex gap-4">
                    <button
                        type="submit"
                        className="flex-1 bg-cyan-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-cyan-500 disabled:bg-slate-600 disabled:cursor-not-allowed transition-all duration-300"
                        disabled={!customChoice.trim() || isLoading}
                    >
                        送出
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsCustomChoiceActive(false)}
                        className="flex-1 bg-slate-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-slate-500 transition-all duration-300"
                        disabled={isLoading}
                    >
                        取消
                    </button>
                </div>
              </form>
            )}
          </div>
        )}

        {isGameOver && (
          <div className="text-center my-6 animate-fade-in">
            <p className="text-2xl text-cyan-400 font-bold mb-4">{gameOverMessage}</p>
            <button
              onClick={onRestart}
              className="bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-cyan-500 transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg"
            >
              開啟新冒險
            </button>
          </div>
        )}
      </div>

      {/* Status & Actions Column */}
      <div className="md:col-span-1">
        <div className="sticky top-8">
          <PlayerStatus playerState={playerState} />
          <div className="mt-6">
              <button
                  onClick={onOpenHistory}
                  className="w-full bg-slate-700/70 text-slate-300 font-bold py-3 px-6 rounded-lg hover:bg-slate-600/70 transition-all duration-300 shadow-lg"
              >
                  查看冒險日誌
              </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameScreen;