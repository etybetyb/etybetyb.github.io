import React from 'react';
import { NpcState } from '../types';

interface NpcStatusProps {
  npcs: NpcState[];
}

const getAffinityColor = (affinity: string) => {
  switch (affinity) {
    case '友好':
      return 'text-green-400';
    case '敵對':
      return 'text-red-400';
    case '中立':
    default:
      return 'text-yellow-400';
  }
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

const NpcStatus: React.FC<NpcStatusProps> = ({ npcs }) => {
  if (!npcs || npcs.length === 0) {
    return (
       <div className="bg-slate-800/50 p-6 rounded-lg shadow-2xl border border-slate-700 backdrop-blur-sm">
        <h3 className="text-xl font-bold text-cyan-300 mb-4 border-b border-slate-600 pb-2">NPC 狀態</h3>
        <p className="text-slate-500 italic">目前場景沒有其他角色。</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 p-6 rounded-lg shadow-2xl border border-slate-700 backdrop-blur-sm">
      <h3 className="text-xl font-bold text-cyan-300 mb-4 border-b border-slate-600 pb-2">NPC 狀態</h3>
      <div className="space-y-6">
        {npcs.map((npc, index) => (
          <div key={index}>
            <div className="group relative">
              <h4 className="text-lg font-semibold text-cyan-200 mb-2">{npc.name}</h4>
              <div className="absolute left-0 bottom-full mb-2 w-max max-w-xs p-3 text-sm bg-slate-900 text-slate-300 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 border border-slate-700">
                {npc.description || '一位神秘的人物。'}
              </div>
            </div>
            <div className="space-y-3">
               <div className="flex justify-between items-center text-slate-400">
                <span>好感度:</span>
                <span className={`font-mono font-bold ${getAffinityColor(npc.affinity)}`}>{npc.affinity}</span>
              </div>

              {Object.keys(npc.attributes).length > 0 && (
                <ul className="space-y-1 text-slate-400 border-t border-slate-700 pt-2">
                  {Object.entries(npc.attributes).map(([key, value]) => {
                    const { level, range } = getAttributeLevelInfo(key, value);
                    return (
                      <li key={key} className="flex justify-between items-center text-sm">
                        <span>{key}:</span>
                        {range ? (
                          <span className="group relative cursor-help font-mono font-bold text-cyan-400 border-b border-dotted border-slate-500">
                            {level}
                            <div className="absolute right-0 bottom-full mb-2 w-max p-2 text-xs bg-slate-900 text-slate-300 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 border border-slate-700">
                              數值範圍: {range}
                            </div>
                          </span>
                        ) : (
                          <span className="font-mono font-bold text-cyan-400">{level}</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
              
              {(npc.inventory.length > 0 || (npc.unknownItemCount && npc.unknownItemCount > 0)) && (
                <div>
                  <h5 className="text-md font-semibold text-slate-300 mb-1 border-t border-slate-700 pt-2">物品:</h5>
                   <ul className="space-y-1 text-slate-400 text-sm">
                    {/* 顯示已知物品 */}
                    {npc.inventory.map((item) => (
                      <li key={item.name} className="group relative">
                        <span>- {item.name}</span>
                        <div className="absolute left-0 bottom-full mb-2 w-full max-w-xs p-2 text-xs bg-slate-900 text-slate-300 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10 border border-slate-700">
                          {item.description}
                        </div>
                      </li>
                    ))}
                    {/* 顯示未知物品 */}
                    {Array.from({ length: npc.unknownItemCount || 0 }).map((_, i) => (
                      <li key={`unknown-${npc.name}-${i}`}>
                        <span>- 未知物品</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            {index < npcs.length - 1 && <hr className="thematic-divider mt-4" />}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NpcStatus;
