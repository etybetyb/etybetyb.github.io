import React from 'react';
import { PlayerState } from '../types';

interface PlayerStatusProps {
  playerState: PlayerState | null;
}

const PlayerStatus: React.FC<PlayerStatusProps> = ({ playerState }) => {
  return (
    <div className="bg-slate-800/50 p-6 rounded-lg shadow-2xl border border-slate-700 backdrop-blur-sm sticky top-8">
      <h3 className="text-xl font-bold text-cyan-300 mb-4 border-b border-slate-600 pb-2">人物狀態</h3>
      
      {playerState ? (
        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-semibold text-slate-300 mb-2">屬性</h4>
            <ul className="space-y-1 text-slate-400">
              {Object.entries(playerState.attributes).map(([key, value]) => (
                <li key={key} className="flex justify-between">
                  <span>{key}:</span>
                  <span className="font-mono font-bold text-cyan-400">{value}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <hr className="thematic-divider" />

          <div>
            <h4 className="text-lg font-semibold text-slate-300 mb-2">物品欄</h4>
            {playerState.inventory.length > 0 ? (
              <ul className="space-y-2 text-slate-400">
                {playerState.inventory.map((item) => (
                  <li key={item.name} className="group relative">
                    <span className="font-semibold">{item.name}</span>
                    <div className="absolute left-0 bottom-full mb-2 w-full max-w-xs p-2 text-sm bg-slate-900 text-slate-300 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 border border-slate-700">
                      {item.description}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500 italic">你的口袋空空如也。</p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-slate-500 italic">正在等待冒險的召喚...</p>
      )}
    </div>
  );
};

export default PlayerStatus;
