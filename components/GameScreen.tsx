
import React from 'react';
import { StoryStep, Choice } from '../types';
import LoadingIcon from './LoadingIcon';
import StoryLog from './StoryLog';

interface GameScreenProps {
  storyLog: StoryStep[];
  choices: Choice[];
  isLoading: boolean;
  isGameOver: boolean;
  gameOverMessage: string;
  error: string | null;
  onMakeChoice: (choice: string) => void;
  onRestart: () => void;
}

const GameScreen: React.FC<GameScreenProps> = ({
  storyLog,
  choices,
  isLoading,
  isGameOver,
  gameOverMessage,
  error,
  onMakeChoice,
  onRestart,
}) => {
  return (
    <div className="bg-slate-800/50 p-6 md:p-8 rounded-lg shadow-2xl border border-slate-700 animate-fade-in">
      <StoryLog storyLog={storyLog} />

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

      {!isLoading && !isGameOver && (
        <div className="mt-6">
          <h3 className="text-xl text-cyan-300 font-semibold mb-4 text-center">你接下來要做什麼？</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => onMakeChoice(choice.text)}
                className="w-full text-left bg-slate-700/70 p-4 rounded-lg border border-slate-600 hover:bg-cyan-800/50 hover:border-cyan-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                disabled={isLoading}
              >
                {choice.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {isGameOver && (
        <div className="text-center my-6 animate-fade-in">
          <p className="text-2xl text-cyan-400 font-bold mb-4">{gameOverMessage}</p>
          <button
            onClick={onRestart}
            className="bg-cyan-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-cyan-500 transition duration-300 transform hover:scale-105 shadow-lg"
          >
            再次遊玩
          </button>
        </div>
      )}
    </div>
  );
};

export default GameScreen;
