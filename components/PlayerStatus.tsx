
import React from 'react';
import { PlayerState } from '../types';

interface PlayerStatusProps {
  playerState: PlayerState | null;
}

const attributeDescriptions: { [key: string]: string } = {
  '生命值': '代表玩家的生命力。降至 0 通常意味著遊戲結束。',
  '體力值': '代表玩家的精力，影響奔跑、攀爬等持續性活動。',
  '力量': '代表玩家的物理力量，影響舉重、戰鬥、破壞等。',
  '敏捷': '代表玩家的靈巧、速度和反應，影響閃避、潛行、精細操作等。',
  '體質': '代表玩家的耐力和抵抗力，影響對毒藥、疾病和惡劣環境的抵抗能力。',
  '精神': '代表玩家的意志力、專注力和心靈韌性，影響抵抗心靈攻擊、解謎、保持冷靜等。',
};

// 獲取核心屬性的描述性等級和數值範圍
const getAttributeLevelInfo = (key: string, value: string | number): { level: string; range: string | null } => {
  const coreAttributes = ['力量', '敏捷', '體質', '精神'];
  const numericValue = Number(value);

  if (coreAttributes.includes(key) && !isNaN(numericValue)) {
    if (numericValue <= 5) return { level: '低', range: '1-5' };
    if (numericValue <= 10) return { level: '中', range: '6-10' };
    if (numericValue <= 15) return { level: '高', range: '11-15' };
    if (numericValue >= 16) return { level: '極高', range: '16-20' };
  }
  
  return { level: String(value), range: null };
};

const PlayerStatus: React.FC<PlayerStatusProps> = ({ playerState }) => {
  return (
    <div className="bg-slate-800/50 p-6 rounded-lg shadow-2xl border border-slate-700 backdrop-blur-sm">
      {playerState?.avatar && (
        <div className="mb-4 flex justify-center">
            <img 
                src={`data:image/png;base64,${playerState.avatar}`} 
                alt={`${playerState.name} 的頭像`}
                className="w-16 h-16 rounded-md border-2 border-slate-600 shadow-lg pixelated-image"
                width="64"
                height="64"
            />
        </div>
      )}
      {playerState?.name ? (
        <div className="group relative mb-4 border-b border-slate-600 pb-2 cursor-help">
            <h3 className="text-xl font-bold text-cyan-300 text-center">{playerState.name}</h3>
            {playerState.background && (
                 <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs p-3 text-sm bg-slate-900 text-slate-300 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 border border-slate-700 text-left">
                    <p className="font-bold text-cyan-400 mb-1">腳色介紹</p>
                    <p className="whitespace-pre-wrap">{playerState.background}</p>
                 </div>
            )}
        </div>
      ) : (
         <h3 className="text-xl font-bold text-cyan-300 mb-4 border-b border-slate-600 pb-2">人物狀態</h3>
      )}
      
      {playerState ? (
        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-semibold text-slate-300 mb-2">屬性</h4>
            <ul className="space-y-1 text-slate-400">
              {Object.entries(playerState.attributes).map(([key, value]) => {
                const { level, range } = getAttributeLevelInfo(key, value);
                return (
                  <li key={key} className="flex justify-between items-center">
                    <span className="group relative cursor-help border-b border-dotted border-slate-500">
                      {key}:
                      <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-max max-w-xs p-3 text-sm bg-slate-900 text-slate-300 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 border border-slate-700 text-left">
                        <p className="font-bold text-cyan-400 mb-1">{key}</p>
                        {attributeDescriptions[key] || '一個神秘的屬性。'}
                      </div>
                    </span>
                    {range ? (
                       <span className="group relative cursor-help font-mono font-bold text-cyan-400 border-b border-dotted border-slate-500">
                        {value}
                        <div className="absolute right-0 bottom-full mb-2 w-max p-2 text-xs bg-slate-900 text-slate-300 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 border border-slate-700">
                          等級: {level} ({range})
                        </div>
                      </span>
                    ) : (
                      <span className="font-mono font-bold text-cyan-400">{value}</span>
                    )}
                  </li>
                );
              })}
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